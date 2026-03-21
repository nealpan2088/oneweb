-- 云信旺店小程序 1.0 - 数据库结构
-- 创建时间：2026-03-21

-- 店铺表
CREATE TABLE IF NOT EXISTS shops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                    -- 店名
    description TEXT,                       -- 店铺简介
    address TEXT,                           -- 地址
    phone TEXT,                             -- 电话
    business_hours TEXT,                    -- 营业时间 (JSON: {"open": "09:00", "close": "22:00"})
    latitude DECIMAL(10, 8),                -- 纬度
    longitude DECIMAL(11, 8),               -- 经度
    wechat_qr TEXT,                         -- 微信二维码 URL
    wechat_id TEXT,                         -- 微信号
    wifi_ssid TEXT,                         -- WiFi 名称
    wifi_password TEXT,                     -- WiFi 密码（加密存储）
    show_wechat_button BOOLEAN DEFAULT 0,   -- 是否显示加微信按钮
    show_wifi_button BOOLEAN DEFAULT 0,     -- 是否显示 WiFi 密码按钮
    show_map BOOLEAN DEFAULT 0,             -- 是否显示地图定位
    show_reviews BOOLEAN DEFAULT 1,         -- 是否显示评价墙
    status BOOLEAN DEFAULT 1,               -- 店铺状态：1 营业中，0 暂停营业
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 评价表
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    customer_name TEXT,                     -- 顾客昵称
    avatar_url TEXT,                        -- 头像 URL
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),  -- 评分 1-5
    content TEXT,                           -- 评价内容
    reply TEXT,                             -- 店主回复
    is_visible BOOLEAN DEFAULT 1,           -- 是否公开显示
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- 访问统计表
CREATE TABLE IF NOT EXISTS visit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    visitor_ip TEXT,                        -- 访问者 IP（脱敏）
    user_agent TEXT,                        -- 设备信息
    visit_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    action TEXT,                            -- 行为：view, click_wechat, click_wifi
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status);
CREATE INDEX IF NOT EXISTS idx_reviews_shop ON reviews(shop_id, is_visible, created_at);
CREATE INDEX IF NOT EXISTS idx_visits_shop ON visit_logs(shop_id, visit_time);

-- 插入 DEMO 数据
INSERT INTO shops (name, description, address, phone, business_hours, latitude, longitude, wechat_id, wifi_ssid, wifi_password, show_wechat_button, show_wifi_button, show_map, show_reviews, status) 
VALUES (
    '旺财咖啡馆',
    '一家温馨的社区咖啡馆，提供现磨咖啡和手工甜点。欢迎来坐坐～',
    '北京市朝阳区建国路 88 号 SOHO 现代城 1 层',
    '010-88888888',
    '{"open": "09:00", "close": "22:00", "description": "周一至周日 09:00-22:00"}',
    39.9042,
    116.4074,
    'wangcai_cafe',
    'WangCafe_Guest',
    '88888888',
    1,
    1,
    1,
    1,
    1
);

INSERT INTO reviews (shop_id, customer_name, avatar_url, rating, content, is_visible) VALUES
(1, '张三', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan', 5, '咖啡味道很棒，环境也很舒适！', 1),
(1, '李四', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi', 4, '甜点不错，就是人有点多', 1),
(1, '王五', 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu', 5, '老板人很好，WiFi 也快', 1),
(1, '赵六', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu', 5, '经常来办公，推荐！', 1),
(1, '匿名顾客', '', 3, '还可以吧', 1);
