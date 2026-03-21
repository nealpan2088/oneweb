#!/bin/bash
# 云信旺店 - 添加店铺脚本

DB_PATH="$HOME/yunxinwangdian/database/shop.db"

echo "🏪 云信旺店 - 添加新店铺"
echo "================================"
echo ""

# 输入店铺信息
read -p "店名：" NAME
read -p "店铺简介：" DESCRIPTION
read -p "地址：" ADDRESS
read -p "电话：" PHONE
read -p "营业时间（如 09:00-22:00）：" HOURS_INPUT
read -p "微信号：" WECHAT_ID
read -p "WiFi 名称：" WIFI_SSID
read -p "WiFi 密码：" WIFI_PASSWORD

# 解析营业时间
OPEN_TIME=$(echo $HOURS_INPUT | cut -d'-' -f1)
CLOSE_TIME=$(echo $HOURS_INPUT | cut -d'-' -f2)

# 插入数据库
sqlite3 "$DB_PATH" <<EOF
INSERT INTO shops (name, description, address, phone, business_hours, wechat_id, wifi_ssid, wifi_password, show_wechat_button, show_wifi_button, show_map, show_reviews, status) 
VALUES (
    '$NAME',
    '$DESCRIPTION',
    '$ADDRESS',
    '$PHONE',
    '{"open": "$OPEN_TIME", "close": "$CLOSE_TIME", "description": "周一至周日 $HOURS_INPUT"}',
    '$WECHAT_ID',
    '$WIFI_SSID',
    '$WIFI_PASSWORD',
    1, 1, 1, 1, 1
);
EOF

echo ""
echo "✅ 店铺添加成功！"
echo ""

# 显示刚添加的店铺
echo "📋 店铺信息："
sqlite3 "$DB_PATH" "SELECT 'ID: ' || id || '\n店名：' || name || '\n地址：' || address || '\n电话：' || phone FROM shops ORDER BY id DESC LIMIT 1;"
