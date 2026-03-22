# Nginx 配置完成 - 云信旺店

## ✅ 配置状态

**配置时间：** 2026-03-22 10:16  
**配置方式：** Nginx 反向代理（方案 A）

---

## 📋 服务状态

| 服务 | 端口 | 状态 | 说明 |
|------|------|------|------|
| **Nginx** | 80 | ✅ 运行中 | 前端静态文件 + API 代理 |
| **后端 API** | 3000 | ✅ 运行中 | Node.js Express 服务 |
| **开机自启** | - | ✅ 已启用 | Nginx 开机自动启动 |

---

## 🌐 访问地址

### 公网访问
```
http://47.110.156.11/
```

### 本机访问
```
http://localhost/
```

### API 接口
```
http://47.110.156.11/health
http://47.110.156.11/api/shop/1
http://47.110.156.11/api/shop/1/reviews
```

---

## 🔧 Nginx 配置详情

### 配置文件位置
```
/etc/nginx/conf.d/yunxinwangdian.conf
```

### 配置内容
```nginx
server {
    listen 80;
    server_name _;
    
    # 前端静态文件
    location / {
        root /home/admin/yunxinwangdian/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # 后端 API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3000;
        access_log off;
    }
}
```

---

## 🛠️ 常用命令

### 查看 Nginx 状态
```bash
systemctl status nginx
```

### 重启 Nginx
```bash
sudo systemctl restart nginx
```

### 重新加载配置（不中断服务）
```bash
sudo nginx -s reload
```

### 查看 Nginx 日志
```bash
# 访问日志
sudo tail -f /var/log/nginx/access.log

# 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 测试配置语法
```bash
sudo nginx -t
```

---

## 📁 后端服务管理

### 查看后端进程
```bash
ps aux | grep "node.*server.js"
```

### 停止后端服务
```bash
pkill -f "node server.js"
```

### 启动后端服务
```bash
cd ~/yunxinwangdian/backend
nohup node server.js > ../logs/app.log 2>&1 &
```

### 查看后端日志
```bash
tail -f ~/yunxinwangdian/logs/app.log
```

---

## 🔒 安全建议

### 1. 配置阿里云安全组
确保阿里云控制台开放了 **80 端口**（HTTP）

### 2. 启用 HTTPS（推荐）
```bash
# 使用 Let's Encrypt 免费证书
sudo yum install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### 3. 防火墙配置
```bash
# 检查防火墙状态
sudo systemctl status firewalld

# 如果启用了防火墙，开放 80 端口
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## ✅ 测试清单

- [x] Nginx 安装成功
- [x] 配置文件语法正确
- [x] 前端页面可访问
- [x] 后端 API 可访问
- [x] 健康检查通过
- [x] Nginx 开机自启已启用
- [x] 公网访问测试通过

---

## 🐛 故障排查

### 问题 1：502 Bad Gateway
**原因：** 后端服务未运行  
**解决：**
```bash
# 检查后端进程
ps aux | grep "node.*server.js"

# 如果没运行，启动后端
cd ~/yunxinwangdian/backend
nohup node server.js > ../logs/app.log 2>&1 &
```

### 问题 2：403 Forbidden
**原因：** 文件权限问题  
**解决：**
```bash
sudo chmod -R o+rx /home/admin/yunxinwangdian/frontend
```

### 问题 3：404 Not Found
**原因：** 前端文件不存在或路径错误  
**解决：**
```bash
# 检查文件是否存在
ls -la /home/admin/yunxinwangdian/frontend/index.html

# 检查 Nginx 配置
cat /etc/nginx/conf.d/yunxinwangdian.conf
```

### 问题 4：无法公网访问
**原因：** 阿里云安全组未开放 80 端口  
**解决：**
1. 登录阿里云控制台
2. 轻量应用服务器 → 防火墙
3. 添加规则：端口 80，TCP，授权对象 0.0.0.0/0

---

## 📝 配置日志

### 2026-03-22 10:16
- ✅ 安装 Nginx 1.20.1
- ✅ 复制配置文件到 `/etc/nginx/conf.d/yunxinwangdian.conf`
- ✅ 注释掉 nginx.conf 默认 server 块
- ✅ 修复前端目录权限
- ✅ 启动 Nginx 并设置开机自启
- ✅ 测试通过（前端、API、健康检查）

---

**配置人：** 旺财 🐕  
**配置时间：** 2026-03-22 10:16
