const axios = require('axios');
const { run, all, get, saveDB, initDB } = require('../db');
const config = require('../config');
const fs = require('fs');
const path = require('path');

// Use MyMemory free translation API
async function translateText(text, targetLang = 'zh-CN') {
  if (!text) return '';
  try {
    const langPair = targetLang === 'zh-CN' ? 'en|zh-CN' : 'zh-CN|en';
    const response = await axios.get(`https://api.mymemory.translated.net/get`, {
      params: {
        q: text,
        langpair: langPair
      },
      timeout: 5000
    });
    if (response.data && response.data.responseData) {
      return response.data.responseData.translatedText || text;
    }
    return text;
  } catch (e) {
    console.log('Translation error:', e.message);
    return text;
  }
}

async function fetchGitHubTrending() {
  console.log('Fetching GitHub trending projects...');
  
  try {
    const response = await axios.get('https://github.com/trending', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    const projects = [];
    
    const articleRegex = /<article[^>]*class="[^"]*Box-row[^"]*"[^>]*>[\s\S]*?<\/article>/g;
    const articles = html.match(articleRegex) || [];
    
    for (const article of articles) {
      const repoMatch = article.match(/href="\/([^"]+)\/([^"]+)"/);
      if (!repoMatch) continue;
      
      const owner = repoMatch[1];
      const name = repoMatch[2];
      const url = `https://github.com/${owner}/${name}`;
      
      const descMatch = article.match(/<p[^>]*>([^<]+)<\/p>/);
      const description = descMatch ? descMatch[1].trim() : '';
      
      const langMatch = article.match(/<span[^>]*>(\w+)<\/span>/);
      const language = langMatch ? langMatch[1] : '';
      
      const starsMatch = article.match(/(\d+[,]?\d*)\s+star/i);
      const stars = starsMatch ? parseInt(starsMatch[1].replace(',', '')) : 0;
      
      // Translate description to Chinese
      const descriptionZh = description ? await translateText(description) : '';
      
      projects.push({
        name: `${owner}/${name}`,
        description: description.substring(0, 500),
        description_zh: descriptionZh.substring(0, 500),
        url,
        language,
        stars
      });
    }
    
    if (projects.length === 0) {
      console.log('Using fallback data (GitHub HTML structure may have changed)');
      return getFallbackProjects();
    }
    
    // Clear today's data and insert new
    const today = new Date().toISOString().split('T')[0];
    run('DELETE FROM projects WHERE fetched_date = ?', [today]);
    
    for (const p of projects) {
      run(
        'INSERT INTO projects (name, description, description_zh, url, language, stars, fetched_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [p.name, p.description, p.description_zh, p.url, p.language, p.stars, today]
      );
    }
    
    // Log the fetch
    run('INSERT INTO fetch_logs (fetched_count, status) VALUES (?, ?)', [projects.length, 'success']);
    
    // Update markdown file
    await updateMarkdownFile(projects);
    
    console.log(`Successfully fetched ${projects.length} projects`);
    return projects;
    
  } catch (error) {
    console.error('Error fetching GitHub trending:', error.message);
    run('INSERT INTO fetch_logs (fetched_count, status, error_message) VALUES (?, ?, ?)', [0, 'error', error.message]);
    return [];
  }
}

function getFallbackProjects() {
  return [
    { name: 'shannon', description: 'Fully autonomous AI pentester for web apps and APIs', description_zh: '用于 Web 应用和 API 的完全自主 AI 渗透测试工具', url: 'https://github.com/KeygraphHQ/shannon', language: 'TypeScript', stars: 32031 },
    { name: 'trivy', description: 'Find vulnerabilities, misconfigurations, secrets in containers', description_zh: '在容器中查找漏洞、配置错误、Secrets', url: 'https://github.com/aquasecurity/trivy', language: 'Go', stars: 32944 },
    { name: 'airi', description: 'Self hosted Grok Companion, virtual waifu', description_zh: '自托管 Grok 伴侣，虚拟老婆', url: 'https://github.com/moeru-ai/airi', language: 'TypeScript', stars: 28415 },
    { name: 'mcp-for-beginners', description: 'MCP fundamentals curriculum by Microsoft', description_zh: 'Microsoft 的 MCP 基础课程', url: 'https://github.com/microsoft/mcp-for-beginners', language: 'Jupyter', stars: 15062 },
    { name: 'AReaL', description: 'Lightning-Fast RL for LLM Reasoning and Agents', description_zh: '闪电般快速的 LLM 推理和智能体强化学习框架', url: 'https://github.com/inclusionAI/AReaL', language: 'Python', stars: 4210 },
    { name: 'codebuff', description: 'Generate code from the terminal', description_zh: '从终端生成代码', url: 'https://github.com/CodebuffAI/codebuff', language: 'TypeScript', stars: 3947 },
    { name: 'ReMe', description: 'Memory Management Kit for Agents', description_zh: '智能体记忆管理工具包', url: 'https://github.com/agentscope-ai/ReMe', language: 'Python', stars: 1919 },
    { name: 'agency-agents', description: 'Complete AI agency with specialized agents', description_zh: '具有专业智能体的完整 AI 机构', url: 'https://github.com/msitarzewski/agency-agents', language: '', stars: 0 },
    { name: 'seomachine', description: 'SEO-optimized blog content creation workspace', description_zh: 'SEO 优化的博客内容创建工作空间', url: 'https://github.com/TheCraigHewitt/seomachine', language: 'Python', stars: 1837 },
    { name: 'hve-core', description: 'Hypervelocity Engineering components by Microsoft', description_zh: 'Microsoft 的 Hypervelocity Engineering 组件', url: 'https://github.com/microsoft/hve-core', language: 'PowerShell', stars: 388 }
  ];
}

async function updateMarkdownFile(projects) {
  const outputPath = path.resolve(__dirname, config.output.markdownFile);
  
  const content = `# GitHub 今日热门项目

${projects.map((p, i) => `## ${i + 1}. ${p.name}
- **English**: ${p.description}
- **中文**: ${p.description_zh || p.description}
- 链接: ${p.url}
${p.language ? `- 语言: ${p.language}` : ''}
${p.stars ? `- ⭐ ${p.stars} stars` : ''}`).join('\n\n')}

---
*数据来源：GitHub Trending | 更新于: ${new Date().toLocaleString('zh-CN')}*
`;
  
  fs.writeFileSync(outputPath, content, 'utf8');
  console.log(`Markdown file updated: ${outputPath}`);
}

if (require.main === module) {
  (async () => {
    await initDB();
    await fetchGitHubTrending();
    process.exit(0);
  })();
}

module.exports = { fetchGitHubTrending };
