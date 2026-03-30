# 🏪 云信旺店单店版

## 🎯 项目概述

**云信旺店单店版**是一个实体店铺微营销解决方案，通过扫码即达的方式为单个店铺提供数字化展示和客户互动功能。

### 项目信息
- **项目代号**: 旺财小店
- **项目序号**: P001
- **版本**: 1.1.0 (万象更新)
- **状态**: ✅ 生产运行
- **类型**: 实体店铺营销小程序
- **负责人**: 潘哥
- **技术栈**: Node.js + Express + SQLite + HTML/CSS/JS

## 🚀 快速开始

### 环境要求
- Node.js 14+
- SQLite 3
- Nginx (生产环境)

### 安装与运行

```bash
# 进入项目目录
cd /home/admin/yunxinwangdian

# 启动前端API服务 (端口3000)
cd backend
node server.js

# 启动管理后台API服务 (端口3001)
cd ../admin-backend
node server.js

# 配置Nginx反向代理
sudo cp docs/NGINX-CONFIG.md /etc/nginx/conf.d/yunxinwangdian.conf
sudo nginx -t && sudo systemctl reload nginx
```

### 访问地址
- **顾客端**: `http://服务器IP/`
- **管理后台**: `http://服务器IP/admin/`
- **前端API**: `http://localhost:3000/`
- **管理API**: `http://localhost:3001/`

## 📊 系统架构

### 服务架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx反向代理  │    │   前端API服务    │    │  管理后台API服务  │
│   (端口80)      │◄──►│   (端口3000)    │◄──►│   (端口3001)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   静态文件服务    │    │   SQLite数据库   │    │   管理后台页面    │
│  (frontend/)    │    │  (database/)    │    │ (admin-frontend/)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 数据库结构
```sql
-- 主要数据表
shops           -- 店铺信息
reviews         -- 顾客评价
visit_logs      -- 访问统计
admin_users     -- 管理员用户
admin_sessions  -- 管理员会话
admin_logs      -- 操作日志
```

## 🛠️ 功能特性

### 顾客端功能
- ✅ **店铺信息展示**: 店名、地址、电话、营业时间
- ✅ **地图定位导航**: 高德地图跳转
- ✅ **WiFi密码功能**: 加微信确认后显示
- ✅ **顾客评价墙**: 5星评分 + 评价内容
- ✅ **访问统计**: 记录页面访问和按钮点击
- ✅ **响应式设计**: 适配手机和电脑

### 管理后台功能
- ✅ **管理员登录**: JWT token认证
- ✅ **店铺管理**: 信息编辑和配置
- ✅ **用户管理**: 管理员账户管理
- ✅ **操作日志**: 记录所有管理操作
- ✅ **数据统计**: 访问量和用户行为分析

### 技术特性
- ✅ **安全加固**: SQL注入防护、XSS防护、限流
- ✅ **数据加密**: WiFi密码AES-256加密存储
- ✅ **性能优化**: 数据库索引、缓存策略
- ✅ **监控告警**: 健康检查、错误日志

## 📁 项目结构

```
yunxinwangdian/
├── frontend/              # 顾客端页面
│   ├── index.html        # 个人作品集页面
│   ├── shop_index.html   # 店铺主页面 (默认首页)
│   └── scripts/          # 前端脚本
├── backend/              # 前端API服务
│   ├── server.js         # 服务器主文件
│   └── package.json      # 依赖配置
├── admin-frontend/       # 管理后台页面
│   ├── login.html        # 登录页面
│   ├── dashboard.html    # 管理主页
│   └── register.html     # 注册页面
├── admin-backend/        # 管理后台API服务
│   ├── server.js         # 管理服务器
│   └── package.json      # 依赖配置
├── database/             # 数据库文件
│   ├── shop.db           # SQLite数据库
│   ├── schema.sql        # 基础表结构
│   └── admin-schema.sql  # 管理后台表结构
├── docs/                 # 项目文档
│   ├── DEPLOY.md         # 部署指南
│   ├── NGINX-CONFIG.md   # Nginx配置
│   ├── LOG.md           # 更新日志
│   └── ADMIN-MVP-COMPLETE.md  # 管理功能说明
├── scripts/              # 工具脚本
└── temp/                 # 临时小程序目录
```

## 🔧 配置说明

### 店铺信息配置
数据库 `shops` 表控制所有店铺信息：

| 字段 | 说明 | 示例 |
|------|------|------|
| name | 店名 | 旺财咖啡馆 |
| description | 店铺简介 | 温馨的社区咖啡馆 |
| address | 地址 | 北京市朝阳区 xx 路 xx 号 |
| phone | 电话 | 010-88888888 |
| business_hours | 营业时间 | `{"open":"09:00","close":"22:00"}` |
| latitude | 纬度 | 39.9042 |
| longitude | 经度 | 116.4074 |
| wechat_id | 微信号 | wangcai_cafe |
| wifi_ssid | WiFi名称 | WangCafe_Guest |
| wifi_password | WiFi密码 | 88888888 (加密存储) |

### 环境变量配置
```bash
# 管理后台JWT密钥
export JWT_SECRET="your-secret-key-change-in-production"

# 数据库路径
export DB_PATH="/home/admin/yunxinwangdian/database/shop.db"

# 服务器端口
export PORT=3000  # 前端API
export ADMIN_PORT=3001  # 管理API
```

## 🚀 部署指南

### 开发环境部署
```bash
# 1. 克隆项目
git clone <repository-url>
cd yunxinwangdian

# 2. 安装依赖
cd backend && npm install
cd ../admin-backend && npm install

# 3. 初始化数据库
sqlite3 database/shop.db < database/schema.sql
sqlite3 database/shop.db < database/admin-schema.sql

# 4. 启动服务
cd backend && node server.js &
cd ../admin-backend && node server.js &
```

### 生产环境部署
```bash
# 1. 使用PM2管理进程
npm install -g pm2

# 2. 启动服务
pm2 start backend/server.js --name "yunxinwangdian-frontend"
pm2 start admin-backend/server.js --name "yunxinwangdian-admin"

# 3. 配置Nginx反向代理
sudo cp docs/NGINX-CONFIG.md /etc/nginx/conf.d/yunxinwangdian.conf
sudo nginx -t && sudo systemctl reload nginx

# 4. 设置开机自启
pm2 startup
pm2 save
```

### 版本升级
```bash
# 备份当前版本
cp -r frontend frontend-backup-$(date +%Y%m%d)

# 部署新版本
cp -r new-version/* frontend/

# 测试新版本
curl http://localhost:3000/health

# 回滚（如果需要）
rm -rf frontend && mv frontend-backup-* frontend
```

## 📈 数据管理

### 数据库维护
```sql
-- 查看店铺数据
SELECT * FROM shops;

-- 查看访问统计
SELECT date, COUNT(*) as visits FROM visit_logs GROUP BY date;

-- 清理旧数据
DELETE FROM visit_logs WHERE created_at < date('now', '-30 days');

-- 备份数据库
sqlite3 database/shop.db ".backup database/shop-backup-$(date +%Y%m%d).db"
```

### 数据导入导出
```bash
# 导出数据为CSV
sqlite3 -header -csv database/shop.db "SELECT * FROM shops;" > shops.csv

# 导入数据
sqlite3 database/shop.db ".mode csv" ".import shops.csv shops"
```

## 🔒 安全配置

### 生产环境安全
1. **HTTPS配置**: 申请SSL证书，配置Nginx
2. **防火墙设置**: 只开放必要端口 (80, 443)
3. **数据库加密**: 敏感字段AES加密
4. **访问控制**: IP白名单、访问频率限制
5. **日志监控**: 异常访问告警

### 安全最佳实践
- 定期更新依赖包
- 监控错误日志
- 定期备份数据
- 使用强密码策略
- 限制管理员权限

## 🐛 故障排除

### 常见问题

#### 服务无法启动
```
解决方案:
1. 检查端口占用: netstat -tlnp | grep -E ":3000|:3001"
2. 检查Node.js版本: node --version
3. 查看错误日志: tail -f /tmp/yunxinwangdian.log
4. 检查数据库权限: ls -la database/shop.db
```

#### 管理后台登录失败
```
解决方案:
1. 检查JWT_SECRET环境变量
2. 验证数据库密码哈希
3. 检查管理员用户状态
4. 查看登录日志
```

#### 页面访问404
```
解决方案:
1. 检查Nginx配置
2. 验证文件路径
3. 检查文件权限
4. 重启Nginx服务
```

#### 数据库连接失败
```
解决方案:
1. 检查数据库文件是否存在
2. 验证文件读写权限
3. 检查SQLite版本
4. 修复数据库: sqlite3 database/shop.db ".recover"
```

## 📊 监控与维护

### 健康检查
```bash
# 前端API健康检查
curl http://localhost:3000/health

# 管理API健康检查
curl http://localhost:3001/health

# Nginx健康检查
curl http://服务器IP/health
```

### 性能监控
```bash
# 查看服务状态
pm2 list
pm2 monit

# 查看系统资源
top -p $(pgrep -f "node.*server.js")

# 查看访问日志
tail -f /var/log/nginx/access.log
```

### 定期维护任务
1. **每日**: 检查服务状态，备份数据库
2. **每周**: 清理旧日志，分析访问数据
3. **每月**: 更新依赖包，安全扫描
4. **每季**: 性能优化，功能升级

## 🤝 贡献指南

### 开发流程
1. 阅读项目文档和代码规范
2. 创建功能分支进行开发
3. 编写测试用例
4. 提交代码审查
5. 合并到主分支

### 代码规范
- 遵循JavaScript最佳实践
- 使用ESLint进行代码检查
- 编写清晰的注释
- 保持代码简洁可读

### 提交规范
- `feat:` 新功能
- `fix:` Bug修复
- `docs:` 文档更新
- `style:` 代码格式
- `refactor:` 代码重构
- `perf:` 性能优化
- `test:` 测试相关

## 📞 支持与联系

### 技术支持
- **技术负责人**: 潘哥
- **AI助手**: 旺财
- **支持邮箱**: support@yunxinwangdian.com
- **问题反馈**: 项目Issue或邮件

### 相关资源
- [更新日志](./docs/LOG.md)
- [部署指南](./docs/DEPLOY.md)
- [Nginx配置](./docs/NGINX-CONFIG.md)
- [管理功能说明](./docs/ADMIN-MVP-COMPLETE.md)

### 项目状态
- **当前版本**: 1.1.0 (万象更新)
- **最后更新**: 2026-03-27
- **维护状态**: ✅ 生产运行
- **支持状态**: 活跃维护

---

**云信旺店 - 让每个小店都有数字名片**