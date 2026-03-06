const express = require('express');
const { initDB, all, get } = require('./db');
const config = require('./config');
const path = require('path');

const app = express();
const PORT = config.server.port;
const HOST = config.server.host;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API: Get all projects
app.get('/api/projects', (req, res) => {
  const { date } = req.query;
  let sql = 'SELECT * FROM projects';
  let params = [];
  
  if (date) {
    sql += ' WHERE fetched_date = ?';
    params.push(date);
  } else {
    const latest = get('SELECT MAX(fetched_date) as latest FROM projects');
    if (latest && latest.latest) {
      sql += ' WHERE fetched_date = ?';
      params.push(latest.latest);
    }
  }
  
  sql += ' ORDER BY stars DESC';
  
  try {
    const projects = all(sql, params);
    res.json(projects);
  } catch (e) {
    res.json([]);
  }
});

// API: Get latest projects
app.get('/api/latest', (req, res) => {
  try {
    const latest = get('SELECT MAX(fetched_date) as latest FROM projects');
    if (!latest || !latest.latest) {
      return res.json({ projects: [], lastUpdate: null });
    }
    
    const projects = all('SELECT * FROM projects WHERE fetched_date = ? ORDER BY stars DESC', [latest.latest]);
    res.json({ projects, lastUpdate: latest.latest });
  } catch (e) {
    res.json({ projects: [], lastUpdate: null });
  }
});

// API: Get available dates
app.get('/api/dates', (req, res) => {
  try {
    const dates = all('SELECT DISTINCT fetched_date FROM projects ORDER BY fetched_date DESC');
    const latest = get('SELECT MAX(fetched_date) as latest FROM projects');
    res.json({
      dates: dates.map(d => d.fetched_date),
      latest: latest ? latest.latest : null
    });
  } catch (e) {
    res.json({ dates: [], latest: null });
  }
});

// API: Get fetch logs
app.get('/api/logs', (req, res) => {
  try {
    const logs = all('SELECT * FROM fetch_logs ORDER BY created_at DESC LIMIT 20');
    res.json(logs);
  } catch (e) {
    res.json([]);
  }
});

// API: Trigger manual fetch
app.post('/api/fetch', (req, res) => {
  const { fetchGitHubTrending } = require('./scripts/fetcher');
  fetchGitHubTrending()
    .then(projects => {
      res.json({ success: true, count: projects.length });
    })
    .catch(err => {
      res.status(500).json({ success: false, error: err.message });
    });
});

// Main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize DB and start server
async function start() {
  try {
    await initDB();
    console.log('✅ Database initialized');
    
    // Initial fetch on startup
    try {
      const { fetchGitHubTrending } = require('./scripts/fetcher');
      await fetchGitHubTrending();
      console.log('✅ Initial data fetch complete');
    } catch (e) {
      console.log('⚠️ Initial fetch skipped:', e.message);
    }
    
    app.listen(PORT, HOST, () => {
      console.log(`🚀 GitHub Trending Web 已启动: http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
