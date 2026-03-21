# 云信旺店 - 版本管理规范

> 创建时间：2026-03-21  
> 当前版本：v1.0.0

---

## 📋 版本号规则

**语义化版本：** `v主版本。次版本。修订号`

| 版本类型 | 说明 | 示例 |
|----------|------|------|
| 主版本 | 不兼容的重大更新 | v1.0.0 → v2.0.0 |
| 次版本 | 向后兼容的新功能 | v1.0.0 → v1.1.0 |
| 修订号 | 向后兼容的问题修复 | v1.0.0 → v1.0.1 |

---

## 🎯 当前版本

**v1.0.0** (2026-03-21) - MVP 版本

### 功能清单
- ✅ 店铺信息展示
- ✅ 地图定位导航
- ✅ WiFi 密码模块
- ✅ 顾客评价墙
- ✅ 访问统计
- ✅ 分享功能
- ✅ 营业状态显示
- ✅ 特色服务展示

---

## 📦 Git 分支管理

```
main (生产分支)
  ↑
develop (开发分支)
  ↑
feature/xxx (功能分支)
```

### 分支说明

| 分支 | 说明 | 保护级别 |
|------|------|----------|
| `main` | 生产环境，稳定版本 | 保护，需 Review |
| `develop` | 开发分支，集成功能 | 保护 |
| `feature/*` | 功能分支，临时开发 | 无保护 |

### 开发流程

```bash
# 1. 创建功能分支
git checkout develop
git checkout -b feature/new-feature

# 2. 开发并提交
git add .
git commit -m "feat: 添加新功能"

# 3. 合并回 develop
git checkout develop
git merge feature/new-feature

# 4. 测试后发布
git checkout main
git merge develop
git tag -a v1.1.0 -m "发布 v1.1.0"
git push origin --tags
```

---

## 📝 提交信息规范

**格式：** `类型：简短描述`

### 类型说明

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加优惠券功能` |
| `fix` | Bug 修复 | `fix: 修复登录问题` |
| `docs` | 文档更新 | `docs: 更新 API 文档` |
| `style` | 代码格式 | `style: 格式化代码` |
| `refactor` | 重构 | `refactor: 优化数据库连接` |
| `perf` | 性能优化 | `perf: 提升查询速度` |
| `chore` | 构建/工具 | `chore: 更新依赖版本` |

### 完整示例

```bash
git commit -m "feat: 添加优惠券系统

- 新增优惠券表
- 添加领取接口
- 前端展示优惠券列表

关联 Issue: #123"
```

---

## 💾 数据库版本管理

### 迁移脚本目录

```
database/
├── schema.sql              # 完整结构
├── migrations/             # 迁移脚本
│   ├── 001_init.sql
│   ├── 002_add_features.sql
│   └── ...
└── VERSION                 # 当前版本号
```

### 迁移脚本命名

`NNN_描述.sql`

示例：
- `001_init.sql` - 初始结构
- `002_add_features.sql` - 添加特色服务
- `003_add_coupons.sql` - 添加优惠券

### 执行迁移

```bash
# 查看当前版本
sqlite3 database/shop.db "SELECT * FROM schema_version;"

# 执行迁移
./scripts/db-migrate.sh
```

---

## 🔄 发布流程

### 发布前检查

- [ ] 所有功能测试通过
- [ ] 代码已提交到 Git
- [ ] 数据库迁移脚本已准备
- [ ] 文档已更新
- [ ] 备份已完成

### 发布步骤

```bash
# 1. 更新版本号
# 编辑 package.json、README.md

# 2. 提交代码
git add .
git commit -m "chore: 准备发布 v1.1.0"

# 3. 打标签
git tag -a v1.1.0 -m "发布 v1.1.0"

# 4. 推送
git push origin main --tags

# 5. 部署
./scripts/deploy.sh
```

---

## 📊 版本历史记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0.0 | 2026-03-21 | MVP 版本发布 |

---

## 🛠️ 相关脚本

| 脚本 | 用途 |
|------|------|
| `scripts/git-init.sh` | 初始化 Git 仓库 |
| `scripts/db-migrate.sh` | 数据库迁移 |
| `scripts/release.sh` | 发布新版本 |
| `scripts/backup.sh` | 备份数据 |

---

## 📚 参考文档

- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [约定式提交](https://www.conventionalcommits.org/zh-hans/)
- [Git Flow 工作流](https://nvie.com/posts/a-successful-git-branching-model/)

---

**最后更新：** 2026-03-21
