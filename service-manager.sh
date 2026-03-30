#!/bin/bash
# 云信旺店服务管理器
# 支持安全重启、状态监控、公网访问管理

PUBLIC_IP="47.110.156.11"
WORK_DIR="/home/admin/yunxinwangdian"
LOG_DIR="$WORK_DIR/logs"
BACKUP_DIR="$WORK_DIR/backups"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 检查服务状态
check_service() {
    local service=$1
    local port=$2
    
    log "检查 $service 状态..."
    
    case $service in
        "old-api")
            if curl -s "http://localhost:3000/health" > /dev/null 2>&1; then
                success "旧版API (端口3000) - 运行正常"
                return 0
            else
                error "旧版API (端口3000) - 服务停止"
                return 1
            fi
            ;;
        "new-api")
            if curl -s "http://localhost:3002/health" > /dev/null 2>&1; then
                success "新版API (端口3002) - 运行正常"
                return 0
            else
                error "新版API (端口3002) - 服务停止"
                return 1
            fi
            ;;
        "nginx")
            if systemctl is-active --quiet nginx; then
                success "Nginx - 运行正常"
                return 0
            else
                error "Nginx - 服务停止"
                return 1
            fi
            ;;
        *)
            error "未知服务: $service"
            return 1
            ;;
    esac
}

# 安全重启服务
safe_restart() {
    local service=$1
    
    log "安全重启 $service..."
    
    case $service in
        "old-api")
            # 先检查Nginx是否健康
            if ! check_service "nginx"; then
                error "Nginx不正常，无法安全重启API"
                return 1
            fi
            
            # 备份当前进程
            local pid=$(pgrep -f "node server.js" | head -1)
            if [ -n "$pid" ]; then
                log "备份进程 $pid 日志..."
                cp "$LOG_DIR/server.log" "$BACKUP_DIR/server-$(date +%s).log" 2>/dev/null
                
                # 优雅停止
                log "优雅停止旧版API..."
                kill -TERM "$pid"
                sleep 2
                
                # 强制停止（如果还在运行）
                if kill -0 "$pid" 2>/dev/null; then
                    warning "进程未正常停止，强制终止..."
                    kill -9 "$pid"
                    sleep 1
                fi
            fi
            
            # 启动新进程
            log "启动新版旧API..."
            cd "$WORK_DIR/backend"
            nohup node server.js > "$LOG_DIR/server-restart-$(date +%s).log" 2>&1 &
            sleep 3
            
            # 检查启动状态
            if check_service "old-api"; then
                success "旧版API重启成功"
                return 0
            else
                error "旧版API重启失败"
                return 1
            fi
            ;;
            
        "new-api")
            # 使用监控脚本重启
            log "通过监控脚本重启新版API..."
            cd "$WORK_DIR/backend"
            ./monitor-new-api.sh > /dev/null 2>&1 &
            sleep 5
            
            if check_service "new-api"; then
                success "新版API重启成功"
                return 0
            else
                error "新版API重启失败"
                return 1
            fi
            ;;
            
        "nginx")
            log "重启Nginx..."
            sudo systemctl reload nginx
            sleep 2
            
            if check_service "nginx"; then
                success "Nginx重启成功"
                return 0
            else
                error "Nginx重启失败"
                return 1
            fi
            ;;
            
        "all")
            log "重启所有服务..."
            
            # 顺序重启：Nginx -> 旧API -> 新API
            safe_restart "nginx"
            sleep 2
            safe_restart "old-api"
            sleep 2
            safe_restart "new-api"
            
            success "所有服务重启完成"
            ;;
            
        *)
            error "未知服务: $service"
            return 1
            ;;
    esac
}

# 显示服务状态
show_status() {
    echo ""
    echo "========================================="
    echo "🦞 云信旺店服务状态"
    echo "========================================="
    
    check_service "nginx"
    check_service "old-api"
    check_service "new-api"
    
    echo ""
    echo "🌐 公网访问地址:"
    echo "  IP: $PUBLIC_IP"
    echo "  前端: http://$PUBLIC_IP/"
    echo "  状态面板: http://$PUBLIC_IP/status-dashboard.html"
    echo ""
    echo "🔧 管理命令:"
    echo "  $0 status      # 查看状态"
    echo "  $0 restart <服务> # 重启服务"
    echo "  $0 monitor    # 启动监控"
    echo "  $0 public     # 公网访问信息"
    echo "========================================="
}

# 公网访问信息
show_public_info() {
    echo ""
    echo "========================================="
    echo "🌐 公网访问指南 (IP: $PUBLIC_IP)"
    echo "========================================="
    echo ""
    echo "📱 前端页面:"
    echo "  http://$PUBLIC_IP/                    # 个人作品集"
    echo "  http://$PUBLIC_IP/shop_index.html     # 传统店铺页面"
    echo "  http://$PUBLIC_IP/shop_index_modern.html # 现代店铺页面"
    echo "  http://$PUBLIC_IP/test_new_api.html   # API测试页面"
    echo "  http://$PUBLIC_IP/status-dashboard.html # 状态监控面板"
    echo ""
    echo "🔧 API端点:"
    echo "  旧版API:"
    echo "    http://$PUBLIC_IP/api/shop/3        # 店铺信息"
    echo "    http://$PUBLIC_IP/api/shop/3/reviews # 评价列表"
    echo "    http://$PUBLIC_IP/api/shop/3/stats  # 统计信息"
    echo ""
    echo "  新版API (规范化):"
    echo "    http://$PUBLIC_IP/api/v1/shops/3    # 店铺信息"
    echo "    http://$PUBLIC_IP/api/v1/shops/3/reviews # 评价列表"
    echo "    http://$PUBLIC_IP/api/v1/shops/3/stats # 统计信息"
    echo "    http://$PUBLIC_IP/api/v1/docs       # API文档"
    echo ""
    echo "🩺 健康检查:"
    echo "  http://$PUBLIC_IP/health              # 旧版API健康"
    echo "  http://$PUBLIC_IP/health-new          # 新版API健康"
    echo ""
    echo "⚠️ 注意事项:"
    echo "  1. 重启服务时，公网访问会短暂中断"
    echo "  2. 使用本脚本的 safe_restart 可最小化中断时间"
    echo "  3. 新版API有监控脚本，会自动恢复"
    echo "========================================="
}

# 启动监控
start_monitor() {
    log "启动服务监控..."
    
    # 检查是否已运行
    if pgrep -f "monitor-new-api.sh" > /dev/null; then
        warning "新版API监控已在运行"
    else
        cd "$WORK_DIR/backend"
        nohup ./monitor-new-api.sh > "$LOG_DIR/monitor.log" 2>&1 &
        success "新版API监控已启动"
    fi
    
    # 创建定时状态检查
    if ! crontab -l | grep -q "service-manager.sh status"; then
        (crontab -l 2>/dev/null; echo "*/5 * * * * cd $WORK_DIR && ./service-manager.sh status >> $LOG_DIR/cron-status.log 2>&1") | crontab -
        success "定时状态检查已配置 (每5分钟)"
    fi
}

# 初始化目录
init_dirs() {
    mkdir -p "$LOG_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$WORK_DIR/logs"
}

# 主函数
main() {
    init_dirs
    
    case "${1:-status}" in
        "status")
            show_status
            ;;
        "restart")
            if [ -z "$2" ]; then
                error "请指定要重启的服务: old-api, new-api, nginx, all"
                exit 1
            fi
            safe_restart "$2"
            ;;
        "monitor")
            start_monitor
            ;;
        "public")
            show_public_info
            ;;
        "help"|"-h"|"--help")
            echo "云信旺店服务管理器"
            echo "用法: $0 [命令]"
            echo ""
            echo "命令:"
            echo "  status      查看所有服务状态"
            echo "  restart <服务> 安全重启服务 (old-api|new-api|nginx|all)"
            echo "  monitor     启动服务监控"
            echo "  public      显示公网访问信息"
            echo "  help        显示帮助信息"
            ;;
        *)
            error "未知命令: $1"
            echo "使用: $0 help 查看可用命令"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"