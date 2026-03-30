#!/bin/bash
# 新版API监控脚本

API_URL="http://localhost:3002/health"
PID_FILE="../logs/new-api.pid"
LOG_FILE="../logs/new-api-monitor.log"
MAX_RETRIES=3
RETRY_DELAY=5

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_api() {
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -s --max-time 10 "$API_URL" > /dev/null 2>&1; then
            return 0
        fi
        retries=$((retries + 1))
        if [ $retries -lt $MAX_RETRIES ]; then
            log "API检查失败，第${retries}次重试..."
            sleep $RETRY_DELAY
        fi
    done
    return 1
}

restart_api() {
    log "尝试重启新版API..."
    
    # 停止现有进程
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if kill -0 $OLD_PID 2>/dev/null; then
            log "停止进程 $OLD_PID"
            kill $OLD_PID
            sleep 2
        fi
        rm -f "$PID_FILE"
    fi
    
    # 启动新进程
    cd /home/admin/yunxinwangdian/backend
    nohup node server-simple-refactor.js > ../logs/new-api-restart-$(date +%Y%m%d_%H%M%S).log 2>&1 &
    NEW_PID=$!
    echo $NEW_PID > "$PID_FILE"
    
    log "新版API重启完成 (PID: $NEW_PID)"
    sleep 3
    
    # 检查是否启动成功
    if check_api; then
        log "✅ 新版API重启成功"
        return 0
    else
        log "❌ 新版API重启失败"
        return 1
    fi
}

# 主监控循环
log "开始监控新版API..."
while true; do
    if check_api; then
        # API正常，等待下一次检查
        sleep 60
    else
        log "❌ 新版API无响应，开始重启流程..."
        if restart_api; then
            log "✅ 重启成功，继续监控..."
        else
            log "⚠️ 重启失败，等待5分钟后重试..."
            sleep 300
        fi
    fi
done