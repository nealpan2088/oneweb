#!/bin/bash
# 云信旺店 - 添加评价脚本

DB_PATH="$HOME/yunxinwangdian/database/shop.db"

echo "💬 云信旺店 - 添加评价"
echo "================================"
echo ""

# 显示店铺列表
echo "📋 店铺列表："
sqlite3 "$DB_PATH" "SELECT id || '. ' || name FROM shops;"
echo ""

read -p "选择店铺 ID：" SHOP_ID
read -p "顾客昵称：" CUSTOMER_NAME
read -p "评分（1-5）：" RATING
read -p "评价内容：" CONTENT
read -p "是否公开（y/n）：" VISIBLE

if [ "$VISIBLE" = "y" ]; then
    IS_VISIBLE=1
else
    IS_VISIBLE=0
fi

sqlite3 "$DB_PATH" <<EOF
INSERT INTO reviews (shop_id, customer_name, rating, content, is_visible) 
VALUES ($SHOP_ID, '$CUSTOMER_NAME', $RATING, '$CONTENT', $IS_VISIBLE);
EOF

echo ""
echo "✅ 评价添加成功！"
