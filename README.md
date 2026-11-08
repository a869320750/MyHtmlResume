# MyHtmlResume

纯静态数据驱动简历站点。所有内容通过 `fetch()` 动态加载 `data/*` JSON 文件渲染，无构建步骤。

站点入口 `index.html` 会自动跳转到 `html/index.html`（个人主页）；`html/ats.html` 是投递用的简历页，`html/markdown-viewer.html` 渲染各项目的详细文档。

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
index.html               — 入口页（跳转到 html/index.html）
html/
  index.html             — 个人主页（工作经历 / 项目经验 / 开源项目 / 技术栈 / 教育）
  ats.html               — 简历页，按 profiles/*.json 的 sections 顺序渲染，支持打印 PDF 与导出纯文本
  markdown-viewer.html   — 项目文档渲染器（marked + mermaid）
data/
  profile-base.json      — 个人基础信息（姓名、联系方式、社交链接）
  profiles/
    general.json         — 简历配置（position、sections、summaryBullets）
  work.json              — 工作经历
  skills.json            — 技能
  education.json         — 教育经历
  projects-github.json   — 开源项目
  projects/
    index.json           — 项目注册表（顺序 / 分类 / 图标 / path / githubUrl；id 已废弃不必填写）
    <公司>/<项目>/
      meta.json          — 项目元信息（name / period / tags / oneLiner / background / work / tech / result）
      project-doc.md     — 项目详细文档
      images/            — 项目配图
scripts/
  data.js                — 共享数据访问层（fetch + index/meta 合并，全页只加载一次）
  homepage.js            — 主页渲染
  ats.js                 — 简历页渲染与纯文本导出
  validate.py            — 数据校验脚本
  dev_server.py          — Python 开发服务器（禁缓存）
  start-server.bat       — Windows 启动脚本
  start-server.sh        — Linux/Mac 启动脚本
css/
  style.css              — 主页样式
  ats.css                — 简历页样式
images/                  — 头像等公共图片
```

## 如何维护

- 修改文字内容：编辑 `data/` 下对应的 JSON 文件
- 修改个人信息：编辑 `data/profile-base.json`（头像、联系方式）
- 简历展示哪些章节：编辑 `data/profiles/general.json` 的 `sections`
  - 可用值：`summary` / `work` / `projects` / `skills` / `github` / `education`
- 多份简历配置：在 `data/profiles/` 下新建 JSON，访问 `html/ats.html?profile=<key>` 切换
- 新增项目：
  1. 建目录 `data/projects/<公司>/<项目>/`
  2. 写 `meta.json` 与 `project-doc.md`（**`project-doc.md` 不要留空**，否则点「内容」会打开空白页）
  3. 在 `data/projects/index.json` 注册，`path` 填 `<公司>/<项目>`

## 数据校验

提交前跑一次：

```bash
python scripts/validate.py
```

检查项：JSON 可解析、`index.json` 的 path 能落到真实目录、`meta.json` 必填字段齐全、`period` 格式为 `YYYY.MM` 或 `YYYY.MM - YYYY.MM`、`profiles/*.json` 的 sections 都被 `ats.js` 支持、项目文档是否为空、图片体积、以及**私人草稿是否误入发布目录**。

退出码非 0 表示存在 ERROR。

## 数据流

`scripts/data.js` 是唯一的数据访问层：`fetchJson` / `fetchText` 负责取文件，
`loadProjects()` 把 `projects/index.json`（注册表）与各项目 `meta.json`（内容）
合并成一份列表，并在单次页面生命周期内缓存。主页、简历页、纯文本导出都调用它，
新增页面前请复用它，不要再各自写一遍 fetch + 合并。

字段重叠时以 `index.json` 为准（注册表管顺序与展示，`meta.json` 管内容）。

## 注意：GitHub Pages 会公开仓库根目录下所有文件

GitHub Pages 按仓库内容原样发布，不会只发布 `html/`。因此 **`data/`、`scripts/` 及根目录下任何文件都是公网可读的**，不要把草稿、笔记、含同事真实姓名或个人评价的内容放进这个仓库。

私人草稿统一存放在私有仓库 `PersonalDocs/resume-drafts/` 下。`.gitignore` 已拦截 `caogao*.md`，`validate.py` 也会做二次检查。
