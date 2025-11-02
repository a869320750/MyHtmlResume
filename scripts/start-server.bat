@echo off
REM Windows 本地开发服务器启动脚本

cd /d "%~dp0\.."

set PORT=%1
if "%PORT%"=="" set PORT=8000

echo ==========================================
echo   个人简历本地开发服务器
echo ==========================================
echo 项目目录: %CD%
echo 访问地址: http://localhost:%PORT%/index.html
echo 按 Ctrl+C 停止服务器
echo ==========================================
echo.

REM 检查Python是否安装
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 使用 Python 启动服务器...
    python -m http.server %PORT%
) else (
    where python3 >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo 使用 Python3 启动服务器...
        python3 -m http.server %PORT%
    ) else (
        echo 错误: 未找到 Python，请先安装 Python
        pause
        exit /b 1
    )
)
