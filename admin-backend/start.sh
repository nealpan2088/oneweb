#!/bin/bash
# 云信旺店管理后台 - 启动脚本

cd "$(dirname "$0")"

echo "🚀 启动云信旺店管理后台..."

# 加载环境变量
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ 已加载 .env 配置"
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install --production
fi

# 启动服务
echo "🚀 启动服务..."
nohup node server.js > ../logs/admin-backend.log 2>&1 &
PID=$!

sleep 3

if ps -p $PID > /dev/null; then
    echo "✅ 管理后台启动成功！(PID: $PID)"
    echo ""
    echo "📍 访问地址：http://localhost:${ADMIN_PORT:-3001}"
    echo "🏥 健康检查：http://localhost:${ADMIN_PORT:-3001}/health"
    echo "📝 查看日志：tail -f ../logs/admin-backend.log"
    echo "🛑 停止服务：kill $PID"
    echo ""
else
    echo "❌ 启动失败，请查看日志：../logs/admin-backend.log"
    exit 1
fi
