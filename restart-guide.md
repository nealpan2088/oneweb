# 🔄 云信旺店服务重启指南

## 📍 你的公网IP
**`47.110.156.11`**

## 🚀 快速重启命令

### 1. 查看当前状态
```bash
cd /home/admin/yunxinwangdian
./service-manager.sh status
```

### 2. 安全重启单个服务
```bash
# 重启旧版API（端口3000）
./service-manager.sh restart old-api

# 重启新版API（端口3002）
./service-manager.sh restart new-api

# 重启Nginx
./service-manager.sh restart nginx
```

### 3. 重启所有服务（推荐）
```bash
./service-manager.sh restart all
```

## 🌐 公网访问地址

### 前端页面
- **个人作品集**: http://47.110.156.11/
- **传统店铺页面**: http://47.110.156.11/shop_index.html
- **现代店铺页面**: http://47.110.156.11/shop_index_modern.html
- **API测试页面**: http://47.110.156.11/test_new_api.html
- **状态监控面板**: http://47.110.156.11/status-dashboard.html

### API端点
#### 旧版API（生产环境）
- 店铺信息: http://47.110.156.11/api/shop/3
- 评价列表: http://47.110.156.11/api/shop/3/reviews
- 统计信息: http://47.110.156.11/api/shop/3/stats

#### 新版API（规范化版本）
- 店铺信息: http://47.110.156.11/api/v1/shops/3
- 评价列表: http://47.110.156.11/api/v1/shops/3/reviews
- 统计信息: http://47.110.156.11/api/v1/shops/3/stats
- API文档: http://47.110.156.11/api/v1/docs

### 健康检查
- 旧版API: http://47.110.156.11/health
- 新版API: http://47.110.156.11/health-new

## 🛡️ 安全重启流程

### 为什么需要安全重启？
当通过公网IP访问时，直接重启服务会导致：
1. **连接中断**: 用户看到 "连接被拒绝"
2. **数据丢失**: 正在进行的请求可能失败
3. **体验差**: 页面加载失败或显示错误

### 安全重启的好处
1. **最小化中断**: 使用优雅停止和快速启动
2. **保持连接**: Nginx会缓冲请求
3. **自动恢复**: 监控脚本确保服务稳定

## 🔧 手动重启步骤（备用）

如果服务管理器脚本不可用：

### 1. 重启旧版API
```bash
cd /home/admin/yunxinwangdian/backend

# 查找并停止进程
pkill -f "node server.js"

# 等待2秒
sleep 2

# 启动服务
nohup node server.js > ../logs/server.log 2>&1 &

# 检查状态
curl http://localhost:3000/health
```

### 2. 重启新版API
```bash
cd /home/admin/yunxinwangdian/backend

# 使用监控脚本
./monitor-new-api.sh
```

### 3. 重启Nginx
```bash
# 测试配置
sudo nginx -t

# 重载配置（不中断服务）
sudo systemctl reload nginx

# 或完全重启
sudo systemctl restart nginx
```

## 📊 监控和日志

### 查看日志
```bash
# 旧版API日志
tail -f /home/admin/yunxinwangdian/logs/server.log

# 新版API日志
tail -f /home/admin/yunxinwangdian/logs/new-api.log

# Nginx访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx错误日志
sudo tail -f /var/log/nginx/error.log
```

### 启动监控
```bash
cd /home/admin/yunxinwangdian
./service-manager.sh monitor
```

## ⚠️ 常见问题

### Q: 重启后还是无法访问？
1. 检查防火墙: `sudo ufw status`
2. 检查端口监听: `sudo netstat -tlnp | grep -E ":80|:3000|:3002"`
3. 检查Nginx配置: `sudo nginx -t`

### Q: 如何查看公网访问是否正常？
```bash
# 从外部测试
curl -I http://47.110.156.11/
curl http://47.110.156.11/health
```

### Q: 服务频繁重启怎么办？
1. 检查内存使用: `free -h`
2. 检查进程: `top`
3. 查看错误日志: `tail -100 /home/admin/yunxinwangdian/logs/*.log`

## 🎯 最佳实践

1. **非高峰时段重启**: 尽量在凌晨或使用量少的时候重启
2. **先通知后重启**: 如果有用户，提前通知维护时间
3. **分批重启**: 不要同时重启所有服务
4. **监控重启后**: 重启后检查所有功能是否正常

## 📞 紧急联系

如果遇到无法解决的问题：
1. 查看状态面板: http://47.110.156.11/status-dashboard.html
2. 检查所有日志文件
3. 使用 `./service-manager.sh status` 诊断问题

---

**记住**: 使用 `./service-manager.sh restart all` 是最安全的重启方式！