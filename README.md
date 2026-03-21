# 云信旺店小程序 1.0

> 实体店铺微营销解决方案 - 扫码即达，营销无忧

## 📋 项目简介

云信旺店是一个轻量级的实体店铺营销小程序，支持：
- ✅ 店铺信息展示（店名、营业时间、地址、电话）
- ✅ 地图定位导航
- ✅ 加微信看 WiFi 密码（需确认已加微信）
- ✅ 顾客评价墙
- ✅ 访问统计

## 🚀 快速开始

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装步骤

```bash
# 1. 进入项目目录
cd ~/yunxinwangdian

# 2. 安装后端依赖
cd backend
npm install

# 3. 启动后端服务
npm start

# 4. 前端直接用浏览器打开
# 打开 frontend/index.html 或部署到 Web 服务器
```

### 访问方式

- **微信扫码**：部署后生成二维码
- **手机浏览器**：`http://服务器 IP:3000`
- **PC 浏览器**：`http://localhost:3000`

## 📁 项目结构

```
yunxinwangdian/
├── backend/           # 后端 API
│   ├── server.js      # 主服务
│   └── package.json   # 依赖配置
├── frontend/          # 前端页面
│   └── index.html     # 主页面
├── database/          # 数据库
│   └── schema.sql     # 数据库结构 + DEMO 数据
├── docs/              # 文档
└── scripts/           # 脚本工具
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
| business_hours | 营业时间（JSON） | `{"open":"09:00","close":"22:00"}` |
| latitude | 纬度 | 39.9042 |
| longitude | 经度 | 116.4074 |
| wechat_id | 微信号 | wangcai_cafe |
| wifi_ssid | WiFi 名称 | WangCafe_Guest |
| wifi_password | WiFi 密码 | 88888888 |
| show_wechat_button | 显示加微信按钮 | 1=显示，0=隐藏 |
| show_wifi_button | 显示 WiFi 按钮 | 1=显示，0=隐藏 |
| show_map | 显示地图 | 1=显示，0=隐藏 |
| show_reviews | 显示评价墙 | 1=显示，0=隐藏 |

### 显示逻辑

- **WiFi 模块**：`show_wechat_button=1` 且 `show_wifi_button=1` 时显示
- **地图模块**：`show_map=1` 且 有经纬度时显示
- **评价墙**：`show_reviews=1` 时显示（默认显示）

## 📊 API 接口

### 获取店铺信息
```
GET /api/shop/:id
```

### 获取 WiFi 密码
```
POST /api/shop/:id/wifi
Body: { "action": "confirm" }
```

### 获取评价列表
```
GET /api/shop/:id/reviews?limit=20
```

### 提交评价
```
POST /api/shop/:id/reviews
Body: { "customer_name": "张三", "rating": 5, "content": "很好" }
```

### 记录访问
```
POST /api/shop/:id/visit
Body: { "action": "view|click_wechat|click_wifi" }
```

### 健康检查
```
GET /health
```

## 🛡️ 安全建议

1. **生产环境启用 HTTPS**
2. **WiFi 密码加密存储**
3. **添加访问频率限制**
4. **评价需要审核**
5. **定期备份数据库**

## 🔧 部署建议

### Docker 部署（推荐）

```bash
# 构建镜像
docker build -t yunxin-wangdian .

# 运行容器
docker run -d -p 3000:3000 \
  -v $(pwd)/database:/app/database \
  yunxin-wangdian
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📝 DEMO 数据

项目已包含 DEMO 店铺数据：

- **店名**：旺财咖啡馆
- **地址**：北京市朝阳区建国路 88 号
- **微信**：wangcai_cafe
- **WiFi**：WangCafe_Guest / 88888888

可以直接访问测试！

## 🤝 后续扩展

- [ ] 多店铺支持
- [ ] 管理员后台
- [ ] 评价审核功能
- [ ] 数据统计看板
- [ ] 模板消息推送
- [ ] 会员系统

## 📄 License

MIT

---

**开发团队**：旺财 🐕  
**创建时间**：2026-03-21
