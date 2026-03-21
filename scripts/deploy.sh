#!/bin/bash
# 云信旺店 - 生产环境部署脚本

set -e

echo "🚀 云信旺店 - 生产环境部署"
echo "================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装"
    exit 1
fi

echo "✅ Node.js 版本：$(node -v)"

# 进入项目目录
cd "$(dirname "$0")/.."

# 安装依赖
echo ""
echo "📦 安装后端依赖..."
cd backend
npm install --production

# 初始化数据库
echo ""
echo "💾 初始化数据库..."
cd ..
if [ ! -f "database/shop.db" ]; then
    sqlite3 database/shop.db < database/schema.sql
    echo "✅ 数据库创建成功"
else
    echo "⚠️  数据库已存在，跳过初始化"
fi

# 设置权限
echo ""
echo "🔒 设置文件权限..."
chmod 600 database/shop.db
chmod +x scripts/*.sh

# 创建备份目录
mkdir -p ../yunxinwangdian-backups

# 配置检查
echo ""
echo "📋 配置检查："
echo "  - 数据库路径：$(pwd)/database/shop.db"
echo "  - 备份目录：$(pwd)/../yunxinwangdian-backups"
echo "  - 服务端口：3000"

# 启动服务
echo ""
echo "🚀 启动服务..."
cd backend
nohup node server.js > ../logs/app.log 2>&1 &
PID=$!

sleep 3

# 检查服务状态
if ps -p $PID > /dev/null; then
    echo "✅ 服务启动成功！(PID: $PID)"
    echo ""
    echo "================================"
    echo "📍 访问地址：http://localhost:3000"
    echo "🏥 健康检查：http://localhost:3000/health"
    echo "📱 前端页面：打开 frontend/index.html"
    echo ""
    echo "💡 提示："
    echo "  - 查看日志：tail -f ../logs/app.log"
    echo "  - 停止服务：kill $PID"
    echo "  - 备份数据库：../scripts/backup.sh"
    echo "================================"
else
    echo "❌ 服务启动失败，请查看日志：../logs/app.log"
    exit 1
fi
