#!/bin/bash
# 本地开发服务器启动脚本

# 进入项目根目录
cd "$(dirname "$0")/.."

# 默认端口
PORT=${1:-8000}

echo "=========================================="
echo "  个人简历本地开发服务器"
echo "=========================================="
echo "项目目录: $(pwd)"
echo "访问地址: http://localhost:$PORT/index.html"
echo "按 Ctrl+C 停止服务器"
echo "=========================================="
echo ""

# 检查Python版本并启动服务器
if command -v python3 &> /dev/null; then
    echo "使用 Python3 启动禁缓存开发服务器..."
    python3 scripts/dev_server.py $PORT
elif command -v python &> /dev/null; then
    echo "使用 Python 启动禁缓存开发服务器..."
    python scripts/dev_server.py $PORT
else
    echo "错误: 未找到 Python，请先安装 Python"
    exit 1
fi
