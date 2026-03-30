#!/bin/bash

# IT技术服务站留言API启动脚本
cd "$(dirname "$0")"

echo "🚀 启动IT技术服务站留言API服务"
echo "========================================"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

# 安装依赖
echo "📦 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "安装依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已安装"
fi

# 检查是否已在运行
PID=$(lsof -ti:3007)
if [ ! -z "$PID" ]; then
    echo "⚠️ 服务已在运行 (PID: $PID)，正在停止..."
    kill -9 $PID 2>/dev/null
    sleep 2
fi

# 启动服务
echo "🚀 启动留言API服务..."
nohup node message-api.js > message-api.log 2>&1 &

# 等待启动
sleep 3

# 检查是否启动成功
if curl -s http://localhost:3007/health > /dev/null; then
    echo "✅ 留言API服务启动成功！"
    echo ""
    echo "📊 服务信息:"
    echo "  端口: 3007"
    echo "  管理密码: admin123"
    echo "  数据文件: $(pwd)/messages.json"
    echo "  日志文件: $(pwd)/message-api.log"
    echo ""
    echo "🌐 API端点:"
    echo "  健康检查: http://localhost:3007/health"
    echo "  提交留言: POST http://localhost:3007/api/messages"
    echo "  查看留言: GET http://localhost:3007/api/messages?password=admin123"
    echo "  查看统计: GET http://localhost:3007/api/messages/stats?password=admin123"
    echo ""
    echo "📱 前端配置:"
    echo "  需要更新前端代码，将留言提交到后端API"
    echo "  而不是保存到localStorage"
    echo ""
    echo "🔧 管理命令:"
    echo "  查看日志: tail -f $(pwd)/message-api.log"
    echo "  停止服务: kill \$(lsof -ti:3007)"
    echo "  重启服务: ./start.sh"
else
    echo "❌ 服务启动失败，请检查日志:"
    tail -n 20 message-api.log
    exit 1
fi

echo "========================================"
echo "启动完成时间: $(date)"