#!/bin/bash
# 云信旺店服务监控脚本
# 功能：检查服务状态，发送告警，自动修复

LOG_FILE="/home/admin/yunxinwangdian/logs/service-monitor.log"
ALERT_LOG="/home/admin/yunxinwangdian/logs/service-alerts.log"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

alert() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1" | tee -a "$ALERT_LOG"
}

# 检查服务状态
check_service() {
    local service_name=$1
    local port=$2
    local health_url=$3
    
    # 检查 systemd 服务状态
    if ! sudo systemctl is-active --quiet "$service_name"; then
        alert "服务 $service_name 未运行，尝试重启..."
        sudo systemctl restart "$service_name"
        sleep 5
        
        if ! sudo systemctl is-active --quiet "$service_name"; then
            alert "服务 $service_name 重启失败！需要人工介入"
            return 1
        else
            log "✅ 服务 $service_name 已自动恢复"
        fi
    fi
    
    # 检查端口监听
    if ! netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        alert "服务 $service_name 端口 $port 未监听"
        return 1
    fi
    
    # 检查健康状态
    health_response=$(curl -s -o /dev/null -w "%{http_code}" "$health_url" 2>/dev/null)
    if [ "$health_response" != "200" ]; then
        alert "服务 $service_name 健康检查失败 (HTTP $health_response)"
        return 1
    fi
    
    return 0
}

# 检查磁盘空间
check_disk() {
    local usage=$(df /home | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$usage" -gt 90 ]; then
        alert "磁盘空间不足：${usage}%"
        return 1
    fi
    return 0
}

# 检查内存使用
check_memory() {
    local available=$(free -m | awk '/^Mem:/ {print $7}')
    if [ "$available" -lt 100 ]; then
        alert "内存不足：${available}MB 可用"
        return 1
    fi
    return 0
}

# 主函数
main() {
    log "=== 开始服务检查 ==="
    
    local errors=0
    
    # 检查前端 API 服务
    if check_service "yunxin-wangdian" "3000" "http://localhost:3000/health"; then
        log "✅ 前端 API 服务正常"
    else
        ((errors++))
    fi
    
    # 检查管理后台服务
    if check_service "yunxin-wangdian-admin" "3001" "http://localhost:3001/health"; then
        log "✅ 管理后台服务正常"
    else
        ((errors++))
    fi
    
    # 检查 Nginx
    if check_service "nginx" "80" "http://localhost/health"; then
        log "✅ Nginx 服务正常"
    else
        ((errors++))
    fi
    
    # 检查磁盘
    if check_disk; then
        log "✅ 磁盘空间正常"
    else
        ((errors++))
    fi
    
    # 检查内存
    if check_memory; then
        log "✅ 内存充足"
    else
        ((errors++))
    fi
    
    log "=== 检查完成：$errors 个问题 ==="
    
    return $errors
}

# 执行
main
exit $?
