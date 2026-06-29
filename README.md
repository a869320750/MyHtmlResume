# MyHtmlResume

纯静态数据驱动简历站点。所有内容通过 `fetch()` 动态加载 `data/*` JSON 文件渲染，仅保留一个简历展示页。

## 本地打开

### Windows

双击运行 `scripts\start-server.bat`，浏览器访问 `http://localhost:8000/index.html`

### Linux / Mac / WSL

```bash
./scripts/start-server.sh
```

访问 `http://localhost:8000/index.html`

> 不要用 `file://` 直接打开，浏览器会因 CORS 安全策略阻止 `fetch()` 加载本地数据文件。

## 文件结构

```
html/
  index.html      — 入口页（跳转到简历）
  ats.html        — 唯一简历展示页，加载全部数据完整渲染
data/
  profile-base.json  — 个人基础信息（姓名、联系方式）
  profiles/
    general.json     — 简历配置（展示哪些模块、摘要文案）
  work.json          — 工作经历
  projects.json      — 项目经验
  skills.json        — 技能
  education.json     — 教育经历
  projects-github.json — 开源项目
  intro.txt          — 个人简介
scripts/
  ats.js             — 简历渲染脚本
  dev_server.py      — Python 开发服务器
  start-server.bat   — Windows 启动脚本
  start-server.sh    — Linux/Mac 启动脚本
css/
  ats.css            — 简历页样式
  style.css          — 入口页样式
```

## 如何维护

- 修改内容：编辑 `data/` 下对应的 JSON 文件
- 修改个人信息：编辑 `data/profile-base.json`（头像、联系方式）
- 简历全局配置：编辑 `data/profiles/general.json`（标题、摘要、显示限制）
