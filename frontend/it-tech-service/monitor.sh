#!/bin/bash

# IT技术服务站 - 服务监控脚本
# 监控网站可用性和性能

set -e

# 配置
SITE_URL="http://localhost/it-tech-service/"
PUBLIC_URL="http://47.110.156.11/it-tech-service/"
LOG_FILE="/tmp/it-tech-service-monitor.log"
CHECK_INTERVAL=300  # 5分钟检查一次

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO") color=$BLUE ;;
        "SUCCESS") color=$GREEN ;;
        "WARNING") color=$YELLOW ;;
        "ERROR") color=$RED ;;
        *) color=$NC ;;
    esac
    
    echo -e "${color}[$timestamp] [$level] $message${NC}"
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# 检查网站可用性
check_availability() {
    local url=$1
    local name=$2
    
    log "INFO" "检查 $name 可用性..."
    
    # 检查HTTP状态码
    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")
    
    if [ "$status_code" -eq 200 ]; then
        log "SUCCESS" "$name 可用 (状态码: $status_code)"
        return 0
    else
        log "ERROR" "$name 不可用 (状态码: $status_code)"
        return 1
    fi
}

# 检查响应时间
check_response_time() {
    local url=$1
    local name=$2
    
    log "INFO" "检查 $name 响应时间..."
    
    local start_time
    local end_time
    local response_time
    
    start_time=$(date +%s%N)
    curl -s -o /dev/null --max-time 10 "$url"
    local curl_exit=$?
    end_time=$(date +%s%N)
    
    if [ $curl_exit -eq 0 ]; then
        response_time=$(( (end_time - start_time) / 1000000 ))  # 转换为毫秒
        log "INFO" "$name 响应时间: ${response_time}ms"
        
        if [ $response_time -lt 1000 ]; then
            log "SUCCESS" "$name 响应时间优秀 (<1s)"
        elif [ $response_time -lt 3000 ]; then
            log "WARNING" "$name 响应时间一般 (1-3s)"
        else
            log "ERROR" "$name 响应时间较慢 (>3s)"
        fi
    else
        log "ERROR" "$name 请求超时或失败"
    fi
}

# 检查页面内容
check_page_content() {
    local url=$1
    local name=$2
    
    log "INFO" "检查 $name 页面内容..."
    
    local content
    content=$(curl -s --max-time 10 "$url")
    
    # 检查关键元素
    local checks=(
        "个人电脑维修技术分享"
        "电脑维修"
        "技术经验"
        "个人网站"
        "非经营性"
    )
    
    local all_ok=true
    for check in "${checks[@]}"; do
        if echo "$content" | grep -q "$check"; then
            log "INFO" "✓ 找到: $check"
        else
            log "ERROR" "✗ 未找到: $check"
            all_ok=false
        fi
    done
    
    if $all_ok; then
        log "SUCCESS" "$name 页面内容完整"
    else
        log "ERROR" "$name 页面内容不完整"
    fi
}

# 检查Nginx状态
check_nginx_status() {
    log "INFO" "检查Nginx服务状态..."
    
    if systemctl is-active --quiet nginx; then
        log "SUCCESS" "Nginx服务运行正常"
        return 0
    else
        log "ERROR" "Nginx服务未运行"
        return 1
    fi
}

# 检查磁盘空间
check_disk_space() {
    log "INFO" "检查磁盘空间..."
    
    local usage
    usage=$(df -h /home | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt 80 ]; then
        log "SUCCESS" "磁盘空间充足: ${usage}%"
    elif [ "$usage" -lt 90 ]; then
        log "WARNING" "磁盘空间警告: ${usage}%"
    else
        log "ERROR" "磁盘空间严重不足: ${usage}%"
    fi
}

# 发送通知（示例）
send_notification() {
    local message=$1
    local level=$2
    
    # 这里可以集成邮件、短信、Webhook等通知方式
    log "INFO" "发送通知: $message"
    
    # 示例：记录到系统日志
    logger "IT-Tech-Service-Monitor: $level - $message"
}

# 生成报告
generate_report() {
    local report_file="/tmp/it-tech-service-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$report_file" << EOF
IT技术服务站监控报告
生成时间: $(date '+%Y-%m-%d %H:%M:%S')

=== 服务状态 ===
$(tail -20 "$LOG_FILE")

=== 系统信息 ===
服务器: $(hostname)
IP地址: 47.110.156.11
运行时间: $(uptime -p)
负载: $(uptime | awk -F'load average:' '{print $2}')

=== 最近访问日志 ===
$(tail -10 /var/log/nginx/access.log 2>/dev/null || echo "Nginx日志不可用")

=== 建议 ===
1. 定期检查日志文件: $LOG_FILE
2. 设置自动监控告警
3. 定期备份网站数据
4. 监控SSL证书有效期（如果启用HTTPS）
EOF
    
    log "INFO" "报告已生成: $report_file"
    echo "报告内容:"
    cat "$report_file"
}

# 单次检查
single_check() {
    log "INFO" "开始单次检查..."
    echo "========================================"
    
    # 检查Nginx
    if ! check_nginx_status; then
        send_notification "Nginx服务异常" "ERROR"
    fi
    
    # 检查本地访问
    check_availability "$SITE_URL" "本地站点"
    check_response_time "$SITE_URL" "本地站点"
    check_page_content "$SITE_URL" "本地站点"
    
    # 检查公网访问（可选，可能需要代理）
    # check_availability "$PUBLIC_URL" "公网站点"
    
    # 检查系统资源
    check_disk_space
    
    echo "========================================"
    log "INFO" "单次检查完成"
}

# 持续监控
continuous_monitor() {
    log "INFO" "启动持续监控 (间隔: ${CHECK_INTERVAL}秒)"
    
    while true; do
        single_check
        log "INFO" "等待 ${CHECK_INTERVAL} 秒后再次检查..."
        sleep "$CHECK_INTERVAL"
    done
}

# 显示帮助
show_help() {
    cat << EOF
IT技术服务站监控脚本

用法: $0 [选项]

选项:
  single    执行单次检查
  monitor   启动持续监控
  report    生成监控报告
  status    显示当前状态
  help      显示此帮助信息

示例:
  $0 single      # 单次检查
  $0 monitor     # 启动监控
  $0 report      # 生成报告
  $0 status      # 查看状态

监控项目:
  - 网站可用性 (HTTP 200)
  - 响应时间 (<3s)
  - 页面内容完整性
  - Nginx服务状态
  - 磁盘空间使用

日志文件: $LOG_FILE
EOF
}

# 显示状态
show_status() {
    echo "=== IT技术服务站状态 ==="
    echo "最后检查时间: $(tail -1 "$LOG_FILE" | cut -d' ' -f1-3 2>/dev/null || echo '未检查')"
    echo "日志文件: $LOG_FILE"
    echo "公网地址: $PUBLIC_URL"
    echo ""
    echo "最近5条日志:"
    tail -5 "$LOG_FILE" 2>/dev/null || echo "暂无日志"
}

# 主函数
main() {
    # 创建日志目录
    mkdir -p "$(dirname "$LOG_FILE")"
    
    case "${1:-single}" in
        "single")
            single_check
            ;;
        "monitor")
            continuous_monitor
            ;;
        "report")
            generate_report
            ;;
        "status")
            show_status
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"