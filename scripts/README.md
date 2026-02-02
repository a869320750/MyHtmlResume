# 本地开发脚本说明

## 快速开始

### Linux/Mac/WSL 用户

```bash
# 默认在8000端口启动
./scripts/start-server.sh

# 指定端口启动
./scripts/start-server.sh 3000
```

首次使用需要添加执行权限：
```bash
chmod +x scripts/start-server.sh
```

### Windows 用户

双击运行 `scripts/start-server.bat` 或在命令行中执行：

```cmd
scripts\start-server.bat

REM 指定端口
scripts\start-server.bat 3000
```

## 访问地址

服务器启动后，在浏览器中访问：
- **默认地址**: http://localhost:8000/index.html
- **自定义端口**: http://localhost:端口号/index.html

## 停止服务器

在终端中按 `Ctrl + C` 停止服务器。

## 常见问题

### 端口被占用

如果8000端口已被占用，可以使用其他端口：
```bash
./scripts/start-server.sh 8080
```

### Python 未安装

请先安装 Python 3.x：
- Windows: https://www.python.org/downloads/
- Linux: `sudo apt install python3` (Ubuntu/Debian) 或 `sudo yum install python3` (CentOS/RHEL)
- Mac: `brew install python3`

### 文件修改后未更新

浏览器可能缓存了旧文件，按 `Ctrl + F5` (Windows/Linux) 或 `Cmd + Shift + R` (Mac) 强制刷新。

## 其他启动方式

### 使用 Node.js (如果已安装)

```bash
npx http-server -p 8000
```

### 使用 VSCode Live Server

1. 安装 "Live Server" 插件
2. 右键点击 `index.html`
3. 选择 "Open with Live Server"
