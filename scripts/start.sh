#!/bin/bash
# 云信旺店 - 快速启动脚本

echo "🚀 云信旺店小程序 1.0 - 启动中..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装"
    exit 1
fi

# 进入后端目录
cd "$(dirname "$0")/backend"

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 启动服务
echo "✅ 启动后端服务..."
npm start &

# 等待服务启动
sleep 3

echo ""
echo "================================"
echo "✅ 服务已启动！"
echo "================================"
echo "📍 后端 API: http://localhost:3000"
echo "🏥 健康检查：http://localhost:3000/health"
echo "📱 前端页面：打开 frontend/index.html"
echo ""
echo "按 Ctrl+C 停止服务"
echo "================================"

# 等待用户中断
wait
