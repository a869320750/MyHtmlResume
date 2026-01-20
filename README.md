# MyHtmlResume

这个简历页面会通过 `fetch()` 动态加载 `data/*` 与 `sections/*`。

如果你直接双击用 `file://` 打开 `index.html`，浏览器会把页面视为 `origin=null`，并阻止读取本地文件（CORS/安全策略），因此会出现 `Failed to fetch`。

## 本地打开（推荐）

### Windows

- 双击运行 `scripts\start-server.bat`
- 浏览器访问：`http://localhost:8000/index.html`

### Linux / Mac / WSL

```bash
./scripts/start-server.sh
```

然后访问：`http://localhost:8000/index.html`

## 其他方式

- VS Code 安装 Live Server 插件，对 `index.html` 右键选择 "Open with Live Server"

更多说明见 `scripts/README.md`。
