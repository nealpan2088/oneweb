#!/bin/bash
# 新版API启动脚本

cd /home/admin/yunxinwangdian/backend

# 检查是否已运行
PID_FILE="../logs/new-api.pid"
LOG_FILE="../logs/new-api.log"

if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 $OLD_PID 2>/dev/null; then
        echo "新版API已在运行 (PID: $OLD_PID)"
        exit 0
    else
        echo "清理旧的PID文件"
        rm -f "$PID_FILE"
    fi
fi

# 启动服务
echo "启动新版API服务 (端口: 3002)"
nohup node server-simple-refactor.js > "$LOG_FILE" 2>&1 &
NEW_PID=$!

# 保存PID
echo $NEW_PID > "$PID_FILE"
echo "新版API已启动 (PID: $NEW_PID)"

# 等待启动完成
sleep 3

# 测试连接
echo "测试API连接..."
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ 新版API启动成功"
    echo "访问地址: http://localhost:3002/test_new_api.html"
else
    echo "❌ 新版API启动失败，检查日志: $LOG_FILE"
    exit 1
fi
