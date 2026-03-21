#!/bin/bash
# 云信旺店 - 一键启动所有服务

echo "🚀 云信旺店 - 启动服务中..."
echo "================================"

# 创建日志目录
mkdir -p ~/yunxinwangdian/logs

# 停止旧服务
echo "🛑 停止旧服务..."
pkill -f "node server.js" 2>/dev/null
pkill -f "http.server 8081" 2>/dev/null
sleep 1

# 启动后端
echo "📦 启动后端服务..."
cd ~/yunxinwangdian/backend && nohup node server.js > ../logs/app.log 2>&1 &
sleep 2

# 启动前端
echo "📱 启动前端服务..."
cd ~/yunxinwangdian/frontend && nohup python3 -m http.server 8081 > ../logs/frontend.log 2>&1 &
sleep 2

# 检查状态
echo ""
echo "📋 服务状态："
ps aux | grep -E "node server.js|http.server 8081" | grep -v grep | awk '{print "  ✅ " $11 " (PID: " $2 ")"}'

echo ""
echo "📋 端口监听："
netstat -tlnp 2>/dev/null | grep -E "3000|8081" | awk '{print "  📍 " $4}'

echo ""
echo "📋 访问测试："
curl -s -o /dev/null -w "  后端 API: HTTP %{http_code}\n" http://127.0.0.1:3000/health
curl -s -o /dev/null -w "  前端页面：HTTP %{http_code}\n" http://127.0.0.1:8081/

echo ""
echo "================================"
echo "✅ 服务启动完成！"
echo "================================"
echo ""
echo "📍 访问地址："
echo "  本地：http://localhost:8081/index.html"
echo "  外网：http://$(curl -s ifconfig.me):8081/index.html"
echo ""
echo "📋 查看日志："
echo "  tail -f ~/yunxinwangdian/logs/app.log"
echo "  tail -f ~/yunxinwangdian/logs/frontend.log"
echo ""
echo "🛑 停止服务："
echo "  pkill -f 'node server.js'"
echo "  pkill -f 'http.server 8081'"
echo ""
