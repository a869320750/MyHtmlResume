# MyHtmlResume

这是一个“纯静态 + 数据驱动”的个人简历站点：入口页 `html/index.html` 作为索引，`html/resume.html` 为统一模板页，通过 `data/profiles/*.json` 生成不同投递版本（简版/详细版）。

页面会通过 `fetch()` 动态加载 `data/*` 与 `sections/*`。

如果你直接双击用 `file://` 打开页面，浏览器会把页面视为 `origin=null` 并阻止读取本地文件（CORS/安全策略），因此会出现 `Failed to fetch`。

## 本地打开（推荐）

### Windows

- 双击运行 `scripts\start-server.bat`
- 浏览器访问：`http://localhost:8000/index.html`

### Linux / Mac / WSL

```bash
./scripts/start-server.sh
```

然后访问：`http://localhost:8000/index.html`

## 投递版本

- 通用投递版：`html/resume.html?profile=general&mode=short`
- 软件开发投递版：`html/resume.html?profile=developer&mode=short`
- 架构师投递版：`html/resume.html?profile=architect&mode=short`
- 项目经理投递版：`html/resume.html?profile=pm&mode=short`
- 系统工程师投递版：`html/resume.html?profile=system&mode=short`

`mode=detail` 为面试用详细版（同一套数据，展示更多条目并减少截断）。

## 维护入口

- 个人信息：`data/profile-base.json`
- 投递版本配置：`data/profiles/*.json`（决定“简版/详细版”的模块顺序与截断长度）
- 内容数据：`data/work.json`、`data/projects.json`、`data/skills.json` 等
- 旧版页面保留：`html/resume-legacy.html`

更多启动方式见 `scripts/README.md`。
