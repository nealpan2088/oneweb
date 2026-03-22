# 云信旺店服务监控与自动重启配置

**配置时间：** 2026-03-22 13:44  
**状态：** ✅ 已完成

---

## 📊 架构概览

```
┌─────────────────────────────────────────────────────┐
│              systemd 服务管理                        │
│  ┌──────────────────┐     ┌────────────────────┐   │
│  │ yunxin-wangdian  │     │ yunxin-wangdian-   │   │
│  │ (前端 API 后端)    │     │ admin(管理后台)     │   │
│  │ 端口：3000       │     │ 端口：3001         │   │
│  │ 自动重启：✅     │     │ 自动重启：✅       │   │
│  │ 开机自启：✅     │     │ 开机自启：✅       │   │
│  └──────────────────┘     └────────────────────┘   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│           Cron 定时监控（每 5 分钟）                    │
│  /home/admin/yunxinwangdian/scripts/                │
│  service-monitor.sh                                 │
│  - 检查服务状态                                      │
│  - 检查端口监听                                      │
│  - 检查健康状态                                      │
│  - 检查磁盘空间                                      │
│  - 检查内存使用                                      │
│  - 自动重启失败服务                                  │
│  - 记录告警日志                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 systemd 服务配置

### 前端 API 后端服务

**服务名：** `yunxin-wangdian`  
**配置文件：** `/etc/systemd/system/yunxin-wangdian.service`

**关键配置：**
```ini
[Service]
Restart=always          # 总是自动重启
RestartSec=10           # 重启间隔 10 秒
User=admin              # 以 admin 用户运行
WorkingDirectory=/home/admin/yunxinwangdian/backend
ExecStart=/usr/bin/node server.js
```

### 管理后台后端服务

**服务名：** `yunxin-wangdian-admin`  
**配置文件：** `/etc/systemd/system/yunxin-wangdian-admin.service`

**关键配置：**
```ini
[Service]
Restart=always          # 总是自动重启
RestartSec=10           # 重启间隔 10 秒
User=admin              # 以 admin 用户运行
WorkingDirectory=/home/admin/yunxinwangdian/admin-backend
ExecStart=/usr/bin/node server.js
```

---

## 📋 常用命令

### 服务管理

```bash
# 查看服务状态
sudo systemctl status yunxin-wangdian
sudo systemctl status yunxin-wangdian-admin

# 启动服务
sudo systemctl start yunxin-wangdian
sudo systemctl start yunxin-wangdian-admin

# 停止服务
sudo systemctl stop yunxin-wangdian
sudo systemctl stop yunxin-wangdian-admin

# 重启服务
sudo systemctl restart yunxin-wangdian
sudo systemctl restart yunxin-wangdian-admin

# 查看日志
sudo journalctl -u yunxin-wangdian -f
sudo journalctl -u yunxin-wangdian-admin -f
```

### 开机自启管理

```bash
# 启用开机自启
sudo systemctl enable yunxin-wangdian
sudo systemctl enable yunxin-wangdian-admin

# 禁用开机自启
sudo systemctl disable yunxin-wangdian
sudo systemctl disable yunxin-wangdian-admin
```

---

## 📊 监控脚本

### 脚本位置

**文件：** `/home/admin/yunxinwangdian/scripts/service-monitor.sh`  
**权限：** 可执行（+x）  
**运行频率：** 每 5 分钟（Cron）

### 监控内容

| 检查项 | 说明 | 告警阈值 |
|--------|------|----------|
| **服务状态** | systemd 服务是否运行 | 未运行 |
| **端口监听** | 端口是否可连接 | 3000, 3001, 80 |
| **健康检查** | API 健康检查 | HTTP != 200 |
| **磁盘空间** | 根分区使用率 | > 90% |
| **内存使用** | 可用内存 | < 100MB |

### 日志文件

| 日志 | 路径 | 说明 |
|------|------|------|
| **监控日志** | `~/yunxinwangdian/logs/service-monitor.log` | 每次检查记录 |
| **告警日志** | `~/yunxinwangdian/logs/service-alerts.log` | 仅记录告警 |

### 手动运行

```bash
# 手动执行监控
/home/admin/yunxinwangdian/scripts/service-monitor.sh

# 查看监控日志
tail -f ~/yunxinwangdian/logs/service-monitor.log

# 查看告警日志
tail -f ~/yunxinwangdian/logs/service-alerts.log
```

---

## 🔔 告警处理

### 自动修复流程

```
服务异常 → 监控脚本检测 → 尝试重启 → 检查是否恢复 → 记录日志
                                    ↓
                              未恢复 → 记录告警 → 等待人工介入
```

### 常见故障处理

#### 1️⃣ 服务无法启动

```bash
# 查看详细错误
sudo journalctl -u yunxin-wangdian -n 50 --no-pager

# 常见原因：
# - 端口被占用：pkill -f "node server.js"
# - 权限问题：检查文件权限
# - 数据库锁定：检查 shop.db
```

#### 2️⃣ 端口被占用

```bash
# 查找占用端口的进程
netstat -tlnp | grep :3000
lsof -i :3000

# 杀掉占用进程
kill -9 <PID>

# 重启服务
sudo systemctl restart yunxin-wangdian
```

#### 3️⃣ 内存不足

```bash
# 查看内存使用
free -h

# 查看占用内存的进程
ps aux --sort=-%mem | head -10

# 清理内存（谨慎使用）
sync && echo 3 > /proc/sys/vm/drop_caches
```

#### 4️⃣ 磁盘空间不足

```bash
# 查看磁盘使用
df -h

# 查找大文件
du -ah /home | sort -rh | head -20

# 清理日志
find ~/yunxinwangdian/logs -name "*.log" -mtime +7 -delete
```

---

## 📈 监控指标

### 服务可用性

| 指标 | 目标 | 当前 |
|------|------|------|
| **服务运行时间** | > 99.9% | - |
| **自动重启成功率** | > 95% | - |
| **平均恢复时间** | < 30 秒 | - |

### 资源使用

| 指标 | 告警阈值 | 当前 |
|------|----------|------|
| **CPU 使用率** | > 80% | - |
| **内存使用** | < 100MB 可用 | - |
| **磁盘使用** | < 90% | - |

---

## 🛡️ 安全加固

### systemd 安全配置

```ini
# 限制权限
NoNewPrivileges=true    # 不允许提升权限
PrivateTmp=true         # 私有临时目录

# 资源限制
LimitNOFILE=65535       # 最大文件描述符
Nice=-5                 # 进程优先级
```

### 监控脚本安全

- ✅ 以 admin 用户运行（非 root）
- ✅ 日志文件权限 644
- ✅ 脚本权限 755
- ✅ 无敏感信息硬编码

---

## 📝 维护计划

### 每日检查

```bash
# 查看服务状态
sudo systemctl status yunxin-wangdian yunxin-wangdian-admin

# 查看告警日志
cat ~/yunxinwangdian/logs/service-alerts.log | tail -20
```

### 每周维护

```bash
# 清理旧日志
find ~/yunxinwangdian/logs -name "*.log" -mtime +7 -delete

# 检查磁盘空间
df -h /home

# 重启服务（可选，释放内存）
sudo systemctl restart yunxin-wangdian
sudo systemctl restart yunxin-wangdian-admin
```

### 每月检查

```bash
# 查看 systemd 日志
sudo journalctl -u yunxin-wangdian --since "1 month ago" | grep -i error
sudo journalctl -u yunxin-wangdian-admin --since "1 month ago" | grep -i error

# 检查监控有效性
cat ~/yunxinwangdian/logs/service-monitor.log | grep "检查完成" | wc -l
```

---

## 🎯 配置验证

### 验证步骤

```bash
# 1. 检查服务配置
sudo systemctl cat yunxin-wangdian
sudo systemctl cat yunxin-wangdian-admin

# 2. 检查服务状态
sudo systemctl is-active yunxin-wangdian
sudo systemctl is-active yunxin-wangdian-admin

# 3. 检查开机自启
sudo systemctl is-enabled yunxin-wangdian
sudo systemctl is-enabled yunxin-wangdian-admin

# 4. 检查 Cron 任务
crontab -l | grep monitor

# 5. 运行监控脚本
/home/admin/yunxinwangdian/scripts/service-monitor.sh
```

### 当前状态

```
✅ systemd 服务配置完成
✅ 服务已启动并运行
✅ 开机自启已启用
✅ 监控脚本已部署
✅ Cron 任务已配置
✅ 监控测试通过（0 个问题）
```

---

## 📞 故障上报

如果自动重启失败，需要人工介入：

1. **查看告警日志** - `~/yunxinwangdian/logs/service-alerts.log`
2. **查看系统日志** - `sudo journalctl -u yunxin-wangdian -n 100`
3. **检查资源使用** - `top`, `df -h`, `free -m`
4. **联系技术支持** - 旺财 🐕

---

**配置人：** 旺财 🐕  
**配置时间：** 2026-03-22 13:44  
**状态：** ✅ 已完成并验证
