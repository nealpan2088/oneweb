#!/bin/bash
# 简单公网访问配置脚本

echo "🌐 配置公网访问 (IP: 47.110.156.11)"

# 备份当前配置
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%s)

# 创建新的nginx配置
sudo tee /etc/nginx/nginx.conf > /dev/null << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    types_hash_max_size 4096;

    include /etc/nginx/conf.d/*.conf;
    
    # 云信旺店公网访问配置
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        server_name 47.110.156.11 localhost 127.0.0.1 _;
        
        # 前端文件目录
        root /home/admin/yunxinwangdian/frontend;
        index index.html shop_index.html;
        
        # 静态文件缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # 旧版API代理 (端口3000)
        location /api/ {
            proxy_pass http://127.0.0.1:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # 新版API代理 (端口3002)
        location /api/v1/ {
            proxy_pass http://127.0.0.1:3002;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # 健康检查端点
        location /health {
            proxy_pass http://127.0.0.1:3000/health;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location /health-new {
            proxy_pass http://127.0.0.1:3002/health;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # 错误页面
        error_page 404 /404.html;
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
}
EOF

# 测试配置
echo "测试Nginx配置..."
if sudo nginx -t; then
    echo "✅ Nginx配置测试通过"
    
    # 重载Nginx
    echo "重载Nginx..."
    sudo systemctl reload nginx
    
    echo ""
    echo "========================================="
    echo "🌐 公网访问配置完成！"
    echo "========================================="
    echo "公网IP: 47.110.156.11"
    echo ""
    echo "📱 访问地址:"
    echo "  前端页面: http://47.110.156.11/"
    echo "  店铺页面: http://47.110.156.11/shop_index.html"
    echo "  现代前端: http://47.110.156.11/shop_index_modern.html"
    echo "  API测试: http://47.110.156.11/test_new_api.html"
    echo "  状态面板: http://47.110.156.11/status-dashboard.html"
    echo ""
    echo "🔧 API端点:"
    echo "  旧版: http://47.110.156.11/api/shop/3"
    echo "  新版: http://47.110.156.11/api/v1/shops/3"
    echo ""
    echo "🩺 健康检查:"
    echo "  旧版: http://47.110.156.11/health"
    echo "  新版: http://47.110.156.11/health-new"
    echo "========================================="
    
    # 测试访问
    echo ""
    echo "测试公网访问..."
    sleep 2
    curl -s -I http://47.110.156.11/ 2>/dev/null | head -1
else
    echo "❌ Nginx配置测试失败"
    echo "恢复备份配置..."
    sudo cp /etc/nginx/nginx.conf.backup.* /etc/nginx/nginx.conf 2>/dev/null
    sudo nginx -t && sudo systemctl reload nginx
    exit 1
fi