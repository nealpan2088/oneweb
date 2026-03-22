# 云信旺店 - 开发日志

> 记录与旺财（AI 助手）的重要对话和决策

---

## 📅 2026-03-21 - 项目启动日

### 项目信息
- **项目名称：** 云信旺店小程序 1.0
- **项目路径：** `/home/admin/yunxinwangdian`
- **当前版本：** v1.0.0
- **Git 提交：** cbdd926

### 完成事项

#### 1. 项目开发
- ✅ 后端 API 开发完成（Node.js + Express + SQLite）
- ✅ 前端页面开发完成（HTML + CSS + JS）
- ✅ 安全加固（限流、加密、XSS 防护）
- ✅ 部署脚本工具

#### 2. 功能模块
- ✅ 店铺信息展示
- ✅ 地图定位导航
- ✅ WiFi 密码模块（加微信后显示）
- ✅ 顾客评价墙
- ✅ 访问统计
- ✅ 分享功能
- ✅ 营业状态显示
- ✅ 特色服务展示

#### 3. Git 版本管理
```bash
cd ~/yunxinwangdian
git init
git add .
git commit -m "v1.0.0 云信旺店初始版本"
git tag -a v1.0.0 -m "云信旺店 v1.0.0 MVP 版本"
```

#### 4. 数据库设计
- `shops` 表 - 店铺信息
- `reviews` 表 - 顾客评价
- `visit_logs` 表 - 访问日志

#### 5. 脚本工具
| 脚本 | 用途 |
|------|------|
| `scripts/start-all.sh` | 一键启动服务 |
| `scripts/add-shop.sh` | 添加店铺 |
| `scripts/add-review.sh` | 添加评价 |
| `scripts/import-demo.sh` | 批量导入 DEMO |
| `scripts/backup.sh` | 备份数据库 |
| `scripts/db-migrate.sh` | 数据库迁移 |
| `scripts/release.sh` | 发布新版本 |

### 重要决策

1. **技术栈选择**
   - 后端：Node.js + Express
   - 前端：原生 HTML（零构建）
   - 数据库：SQLite

2. **安全策略**
   - WiFi 密码 AES-256 加密
   - IP 地址脱敏存储
   - 限流保护（100 次/15 分钟）
   - XSS 防护（HTML 转义）

3. **版本管理**
   - 语义化版本号（v 主版本。次版本。修订号）
   - Git 分支管理（master/develop/feature）
   - 提交信息规范（feat/fix/docs/style/refactor/perf/chore）

### 访问地址

| 环境 | 地址 |
|------|------|
| 本地 | http://localhost:8081/index.html |
| 外网 | http://47.110.156.11:8081/index.html |
| 后端 API | http://47.110.156.11:3000/health |

### 待办事项

- [ ] 阿里云防火墙确认（端口 8081 和 3000）
- [ ] 数据库首次备份
- [ ] 管理后台开发
- [ ] 图片上传功能
- [ ] 优惠券系统

---

## 📝 常用命令速查

### 服务管理
```bash
# 启动所有服务
cd ~/yunxinwangdian && ./scripts/start-all.sh

# 查看服务状态
ps aux | grep -E "node|http.server"

# 查看日志
tail -f ~/yunxinwangdian/logs/app.log
tail -f ~/yunxinwangdian/logs/frontend.log
```

### Git 操作
```bash
# 日常提交
git add . && git commit -m "描述改了啥"

# 打标签
git tag -a vx.x.x -m "版本说明"

# 查看历史
git log --oneline

# 回滚
git reset --hard HEAD~1
```

### 数据库操作
```bash
# 进入数据库
sqlite3 ~/yunxinwangdian/database/shop.db

# 查看店铺
SELECT id, name, address FROM shops;

# 查看评价
SELECT * FROM reviews WHERE shop_id = 1;

# 退出
.quit
```

---

## 📚 相关文档

- `README.md` - 项目说明
- `docs/DEPLOY.md` - 部署文档
- `docs/VERSIONING.md` - 版本管理规范
- `database/schema.sql` - 数据库结构

---

**最后更新：** 2026-03-21  
**记录人：** 潘哥 & 旺财 🐕
