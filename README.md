# GitHub 热门项目展示 Web 应用

> 🤖 本项目由 AI 自动创建
> 
> 自动获取并展示 GitHub 热门开源项目，支持中英双语、主题自动切换、历史记录查询

## 功能特性

- 📊 自动获取 GitHub Trending 热门项目
- 🌐 中英双语项目描述
- 🌓 支持亮色/暗色主题自动切换
- 📅 可选择查看历史记录
- 💾 本地 SQLite 数据库存储

## 项目结构

```
github-trending/
├── app.js              # 主服务入口
├── config.json         # 配置文件
├── db.js               # 数据库模块
├── package.json        # 依赖配置
├── data/               # 数据库存储目录
│   └── projects.db     # SQLite 数据库文件
├── public/
│   └── index.html      # 前端页面
└── scripts/
    └── fetcher.js      # 数据获取脚本
```

## 快速开始

### 1. 安装依赖

```bash
cd github-trending
npm install
```

### 2. 启动服务

```bash
npm start
```

服务启动后访问: http://localhost:3000

### 3. 手动获取数据

```bash
npm run fetch
```

## 配置说明

编辑 `config.json`:

```json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0"
  },
  "database": {
    "path": "./data/projects.db"
  },
  "github": {
    "trendingUrl": "https://github.com/trending"
  },
  "cron": {
    "schedule": "0 8 * * *",
    "enabled": true
  },
  "output": {
    "markdownFile": "../GitHub-热门项目.md"
  }
}
```

| 配置项 | 说明 |
|--------|------|
| server.port | 服务端口 |
| server.host | 监听地址 |
| database.path | 数据库文件路径 |
| cron.schedule | 定时任务cron表达式 |
| output.markdownFile | Markdown输出文件路径 |

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/projects` | GET | 获取项目列表，可选参数 `?date=YYYY-MM-DD` |
| `/api/dates` | GET | 获取所有有记录的日期 |
| `/api/logs` | GET | 获取获取日志 |
| `/api/fetch` | POST | 手动触发一次数据获取 |

## 定时任务

默认每天早上 8:00 自动获取 GitHub 热门项目。

查看定时任务:
```bash
crontab -l
```

修改定时任务:
```bash
crontab -e
```

## 数据存储

- **数据库**: SQLite (`data/projects.db`)
- **项目表**: projects (id, name, description, description_zh, url, language, stars, fetched_date)
- **日志表**: fetch_logs (id, fetched_count, status, error_message, created_at)

## 注意事项

- 首次启动会自动获取一次数据
- 翻译使用免费 MyMemory API，可能有频率限制
- 确保服务器能访问 github.com
