#!/bin/bash
# 公网访问Nginx配置脚本

NGINX_CONF="/etc/nginx/sites-enabled/yunxinwangdian-public"
BACKUP_DIR="/home/admin/nginx-backups"
PUBLIC_IP="47.110.156.11"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份当前配置
backup_config() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    sudo cp /etc/nginx/sites-enabled/default "$BACKUP_DIR/default-backup-$timestamp" 2>/dev/null
    echo "✅ 配置已备份到: $BACKUP_DIR/default-backup-$timestamp"
}

# 创建公网专用配置
create_public_config() {
    cat > /tmp/yunxinwangdian-public.conf << 'EOF'
# 云信旺店 - 公网访问专用配置
# 公网IP: 47.110.156.11

# 单店版后端 API (旧版)
upstream wangdian_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

# 单店版新版 API (规范化版本)
upstream wangdian_new_backend {
    server 127.0.0.1:3002;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    
    # 公网IP和域名
    server_name 47.110.156.11 localhost 127.0.0.1;
    
    # 根目录 - 前端文件
    root /home/admin/yunxinwangdian/frontend;
    index index.html shop_index.html;
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 新版API路由 (v1规范化API)
    location /api/v1/ {
        proxy_pass http://wangdian_new_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 连接优化
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # 旧版API路由 (保持兼容)
    location /api/ {
        proxy_pass http://wangdian_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 健康检查端点 (公开)
    location /health {
        proxy_pass http://wangdian_backend/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # 新版健康检查
    location /health-new {
        proxy_pass http://wangdian_new_backend/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # 状态监控面板
    location /status {
        alias /home/admin/yunxinwangdian/frontend/status-dashboard.html;
    }
    
    # 错误页面
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root /usr/share/nginx/html;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}

# 重定向HTTP到HTTPS (未来启用)
# server {
#     listen 80;
#     server_name 47.110.156.11;
#     return 301 https://$server_name$request_uri;
# }
EOF
    
    sudo cp /tmp/yunxinwangdian-public.conf "$NGINX_CONF"
    echo "✅ 公网配置已创建: $NGINX_CONF"
}

# 测试并重载Nginx
reload_nginx() {
    echo "测试Nginx配置..."
    if sudo nginx -t; then
        echo "✅ Nginx配置测试通过"
        echo "重载Nginx配置..."
        sudo systemctl reload nginx
        echo "✅ Nginx配置已重载"
    else
        echo "❌ Nginx配置测试失败，请检查错误"
        exit 1
    fi
}

# 显示访问信息
show_access_info() {
    echo ""
    echo "========================================="
    echo "🌐 公网访问信息"
    echo "========================================="
    echo "公网IP: $PUBLIC_IP"
    echo ""
    echo "📱 前端页面:"
    echo "  http://$PUBLIC_IP/"
    echo "  http://$PUBLIC_IP/shop_index.html"
    echo "  http://$PUBLIC_IP/shop_index_modern.html"
    echo "  http://$PUBLIC_IP/test_new_api.html"
    echo "  http://$PUBLIC_IP/status-dashboard.html"
    echo ""
    echo "🔧 API端点:"
    echo "  旧版API: http://$PUBLIC_IP/api/shop/3"
    echo "  新版API: http://$PUBLIC_IP/api/v1/shops/3"
    echo ""
    echo "🩺 健康检查:"
    echo "  旧版: http://$PUBLIC_IP/health"
    echo "  新版: http://$PUBLIC_IP/health-new"
    echo "========================================="
}

# 主流程
main() {
    echo "🔄 开始配置公网访问..."
    
    backup_config
    create_public_config
    reload_nginx
    show_access_info
    
    echo ""
    echo "✅ 公网访问配置完成！"
    echo "现在可以通过 http://47.110.156.11/ 访问所有服务"
}

# 执行主流程
main "$@"