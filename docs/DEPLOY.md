# 云信旺店小程序 1.0 - 部署文档

## 🚀 快速部署

### 方案 A：直接部署（最简单）

```bash
# 1. 运行部署脚本
cd ~/yunxinwangdian
./scripts/deploy.sh

# 2. 访问服务
curl http://localhost:3000/health
```

### 方案 B：Docker 部署（推荐生产环境）

```bash
# 1. 构建镜像
docker build -t yunxin-wangdian .

# 2. 运行容器
docker run -d \
  --name yunxin-wangdian \
  -p 3000:3000 \
  -v $(pwd)/database:/app/database \
  -v $(pwd)/logs:/app/logs \
  -e ENCRYPTION_KEY="your-secret-key-32-chars-long" \
  yunxin-wangdian

# 3. 查看状态
docker logs yunxin-wangdian
```

### 方案 C：Docker Compose（最方便）

```bash
# 1. 启动服务
docker-compose up -d

# 2. 查看状态
docker-compose ps

# 3. 查看日志
docker-compose logs -f
```

---

## 🔧 配置说明

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | 3000 |
| `DB_PATH` | 数据库路径 | `/app/database/shop.db` |
| `ENCRYPTION_KEY` | 加密密钥（32 字符） | 默认值（生产环境请修改） |
| `TRUST_PROXY` | 信任代理（Nginx 后用） | false |
| `ALLOWED_ORIGINS` | 允许的域名（逗号分隔） | * |

### 生产环境配置示例

```bash
# .env 文件
NODE_ENV=production
PORT=3000
ENCRYPTION_KEY=my-super-secret-key-32chars!
TRUST_PROXY=true
ALLOWED_ORIGINS=https://your-domain.com
```

---

## 🔒 安全加固（已实现）

### 1. SQL 注入防护
✅ 参数化查询  
✅ 输入验证

### 2. XSS 防护
✅ HTML 转义  
✅ 输出过滤

### 3. 限流保护
✅ 通用限流：100 次/15 分钟  
✅ 敏感操作：10 次/15 分钟

### 4. 数据加密
✅ WiFi 密码 AES-256 加密  
✅ IP 地址脱敏

### 5. 其他
✅ CORS 配置  
✅ 请求大小限制  
✅ 优雅关闭  
✅ 健康检查

---

## 📊 监控与日志

### 查看日志
```bash
# 实时日志
tail -f ~/yunxinwangdian/logs/app.log

# 最近 100 行
tail -n 100 ~/yunxinwangdian/logs/app.log
```

### 健康检查
```bash
curl http://localhost:3000/health
```

### 访问统计
```bash
curl http://localhost:3000/api/shop/1/stats
```

---

## 💾 备份与恢复

### 备份数据库
```bash
# 手动备份
./scripts/backup.sh

# 自动备份（添加到 crontab）
0 2 * * * /home/admin/yunxinwangdian/scripts/backup.sh
```

### 恢复数据库
```bash
# 解压备份
gunzip ~/yunxinwangdian-backups/shop-db-20260321-0200.sqlite.gz

# 覆盖数据库
cp ~/yunxinwangdian-backups/shop-db-20260321-0200.sqlite ~/yunxinwangdian/database/shop.db

# 重启服务
./scripts/deploy.sh
```

---

## 🔄 升级流程

```bash
# 1. 备份数据库
./scripts/backup.sh

# 2. 拉取新代码
cd ~/yunxinwangdian
git pull  # 如果是 git 管理

# 3. 安装依赖
cd backend
npm install --production

# 4. 重启服务
cd ..
./scripts/deploy.sh
```

---

## 🛡️ Nginx 反向代理配置

### 1. 安装 Nginx
```bash
sudo apt-get install nginx  # Ubuntu/Debian
sudo yum install nginx      # CentOS
```

### 2. 配置 Nginx
```bash
sudo cp docs/nginx.conf /etc/nginx/sites-available/yunxin-wangdian
sudo ln -s /etc/nginx/sites-available/yunxin-wangdian /etc/nginx/sites-enabled/
```

### 3. 修改配置
```bash
# 编辑配置文件
sudo nano /etc/nginx/sites-available/yunxin-wangdian

# 修改域名
server_name your-domain.com;
```

### 4. 申请 SSL 证书（Let's Encrypt）
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 5. 重启 Nginx
```bash
sudo systemctl restart nginx
```

---

## 📈 性能优化建议

### 1. 启用 Gzip 压缩
```nginx
gzip on;
gzip_types text/plain application/json text/css application/javascript;
```

### 2. 添加缓存
```nginx
location /api/ {
    proxy_cache_valid 200 1m;
    proxy_cache_valid 404 1s;
}
```

### 3. 静态资源 CDN
- 前端页面部署到 CDN
- 图片等资源走 CDN 加速

---

## 🐛 故障排查

### 服务无法启动
```bash
# 查看日志
tail -f ~/yunxinwangdian/logs/app.log

# 检查端口占用
netstat -tlnp | grep 3000

# 检查 Node.js 版本
node -v  # 需要 >= 14.0.0
```

### 数据库错误
```bash
# 检查数据库文件
ls -la ~/yunxinwangdian/database/

# 重新初始化
sqlite3 ~/yunxinwangdian/database/shop.db < ~/yunxinwangdian/database/schema.sql
```

### 内存占用过高
```bash
# 查看进程
ps aux | grep node

# 重启服务
pkill -f "node server.js"
./scripts/deploy.sh
```

---

## 📞 技术支持

- **项目文档**：README.md
- **API 文档**：查看 server.js 注释
- **数据库结构**：database/schema.sql

---

**最后更新**：2026-03-21
