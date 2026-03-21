#!/bin/bash
# 云信旺店 - 批量导入 DEMO 数据

DB_PATH="$HOME/yunxinwangdian/database/shop.db"

echo "📦 云信旺店 - 批量导入 DEMO 数据"
echo "================================"
echo ""

# 添加 3 个 DEMO 店铺
sqlite3 "$DB_PATH" <<EOF
-- 店铺 2：川菜馆
INSERT INTO shops (name, description, address, phone, business_hours, latitude, longitude, wechat_id, wifi_ssid, wifi_password, show_wechat_button, show_wifi_button, show_map, show_reviews, status) 
VALUES (
    '旺财川菜馆',
    '正宗川味，麻辣鲜香。招牌菜：水煮鱼、麻婆豆腐、夫妻肺片。',
    '北京市朝阳区三里屯路 19 号院',
    '010-66668888',
    '{"open": "11:00", "close": "22:00", "description": "周一至周日 11:00-22:00"}',
    39.9329,
    116.4544,
    'wangcai_sichuan',
    'Sichuan_Guest',
    '12345678',
    1, 1, 1, 1, 1
);

-- 店铺 3：健身房
INSERT INTO shops (name, description, address, phone, business_hours, latitude, longitude, wechat_id, wifi_ssid, wifi_password, show_wechat_button, show_wifi_button, show_map, show_reviews, status) 
VALUES (
    '旺财健身',
    '24 小时智能健身房，器械齐全，环境舒适。月卡 299 元起。',
    '北京市朝阳区工体北路 8 号院',
    '010-88886666',
    '{"open": "00:00", "close": "23:59", "description": "24 小时营业"}',
    39.9261,
    116.4432,
    'wangcai_gym',
    'Gym_WiFi',
    '88886666',
    1, 1, 1, 1, 1
);

-- 为店铺 2 添加评价
INSERT INTO reviews (shop_id, customer_name, rating, content, is_visible) VALUES
(2, '吃货小王', 5, '水煮鱼太正宗了！辣得过瘾！', 1),
(2, '李女士', 4, '味道不错，就是有点咸', 1),
(2, '张先生', 5, '经常来，推荐麻婆豆腐', 1),
(2, '赵小姐', 5, '分量足，价格实惠', 1),
(2, '匿名顾客', 3, '还可以吧', 1);

-- 为店铺 3 添加评价
INSERT INTO reviews (shop_id, customer_name, rating, content, is_visible) VALUES
(3, '健身达人', 5, '器械很新，环境好！', 1),
(3, '王同学', 4, '24 小时很方便，就是周末人多', 1),
(3, '刘女士', 5, '教练专业，推荐！', 1),
(3, '陈先生', 5, '性价比高，月卡很划算', 1),
(3, '周先生', 4, '不错，就是淋浴间有点少', 1);
EOF

echo "✅ DEMO 数据导入完成！"
echo ""
echo "📋 当前店铺列表："
sqlite3 "$DB_PATH" "SELECT 'ID:' || id || ' | ' || name || ' | ' || address FROM shops;"
echo ""
echo "💬 评价总数："
sqlite3 "$DB_PATH" "SELECT COUNT(*) || '条' FROM reviews;"
