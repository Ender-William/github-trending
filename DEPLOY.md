# GitHub Trending Web 部署指南

> 本指南将帮助你如何在服务器或本地部署运行 GitHub 热门项目展示应用

## 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- 服务器能访问 github.com（用于抓取Trending数据）

## 快速部署

### 1. 克隆项目

```bash
git clone <你的仓库地址>
cd github-trending
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动服务

```bash
# 开发模式（前台运行）
npm start

# 或后台运行
nohup npm start &
```

服务启动后访问: `http://你的服务器IP:3000`

## 配置说明

编辑 `config.json` 文件：

```json
{
  "server": {
    "port": 3000,        // 服务端口，可修改
    "host": "0.0.0.0"   // 监听地址
  },
  "database": {
    "path": "./data/projects.db"  // 数据库文件位置
  },
  "cron": {
    "schedule": "0 8 * * *",      // 定时任务cron表达式
    "enabled": true
  },
  "output": {
    "markdownFile": "../GitHub-热门项目.md"  // Markdown输出文件
  }
}
```

### 定时任务配置 (cron)

| 表达式 | 含义 |
|--------|------|
| `0 8 * * *` | 每天早上 8:00 |
| `0 */6 * * *` | 每 6 小时 |
| `0 9 * * 1-5` | 工作日早上 9:00 |

查看当前定时任务：
```bash
crontab -l
```

修改定时任务：
```bash
crontab -e
```

## PM2 进程管理（推荐）

使用 PM2 管理 Node.js 进程，实现自动重启和开机自启：

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start app.js --name github-trending

# 设置开机自启
pm2 startup
pm2 save
```

常用命令：
```bash
pm2 status              # 查看状态
pm2 logs github-trending # 查看日志
pm2 restart github-trending # 重启
pm2 stop github-trending  # 停止
```

## Docker 部署（可选）

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
```

构建运行：
```bash
docker build -t github-trending .
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data github-trending
```

## 验证部署

1. 访问 `http://你的服务器IP:3000`
2. 检查是否显示 GitHub 热门项目
3. 测试日期选择功能
4. 检查定时任务日志：`cat cron.log`

## 功能说明

- 🌐 自动获取 GitHub Trending 热门项目
- 🌐 中英双语项目描述
- 🌓 亮色/暗色主题自动切换
- 📅 支持查看历史记录
- 💾 本地 SQLite 数据库存储

## 常见问题

### 1. 端口被占用
```bash
# 查找占用端口的进程
lsof -i :3000
# 或修改 config.json 中的端口
```

### 2. 翻译失败
应用使用免费 MyMemory API，可能有频率限制。翻译失败时会显示英文原文。

### 3. 数据未更新
检查定时任务是否正常运行：
```bash
crontab -l
cat cron.log
```

### 4. 无法访问 GitHub
确保服务器网络可以访问 `github.com`，可使用代理或 VPN。

## 目录结构

```
github-trending/
├── app.js              # 主服务入口
├── config.json         # 配置文件
├── db.js               # 数据库模块
├── package.json        # 依赖配置
├── README.md           # 项目说明
├── data/               # 数据目录
│   └── projects.db     # SQLite 数据库
├── public/
│   └── index.html      # 前端页面
└── scripts/
    └── fetcher.js      # 数据获取脚本
```

## 更新升级

```bash
# 拉取最新代码
git pull

# 重新安装依赖（如有更新）
npm install

# 重启服务
pm2 restart github-trending
```

## 许可证

MIT License
