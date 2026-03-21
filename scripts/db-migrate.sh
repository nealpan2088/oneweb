#!/bin/bash
# 云信旺店 - 数据库迁移工具

DB_PATH="$HOME/yunxinwangdian/database/shop.db"
MIGRATIONS_DIR="$HOME/yunxinwangdian/database/migrations"

echo "🔄 云信旺店 - 数据库迁移工具"
echo "================================"
echo ""

# 检查数据库是否存在
if [ ! -f "$DB_PATH" ]; then
    echo "❌ 数据库不存在，先初始化..."
    sqlite3 "$DB_PATH" < "$HOME/yunxinwangdian/database/schema.sql"
    echo "✅ 数据库初始化完成"
fi

# 获取当前版本
CURRENT_VERSION=$(sqlite3 "$DB_PATH" "SELECT COALESCE(MAX(version), 0) FROM schema_version;" 2>/dev/null || echo "0")
echo "📊 当前数据库版本：v$CURRENT_VERSION"
echo ""

# 获取待应用的迁移
echo "📋 待应用的迁移："
for migration in $(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
    VERSION=$(basename "$migration" | cut -d'_' -f1)
    if [ "$VERSION" -gt "$CURRENT_VERSION" ]; then
        echo "  - $migration"
    fi
done
echo ""

# 执行迁移
read -p "是否执行迁移？(y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "❌ 已取消"
    exit 0
fi

for migration in $(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
    VERSION=$(basename "$migration" | cut -d'_' -f1)
    if [ "$VERSION" -gt "$CURRENT_VERSION" ]; then
        echo "🔄 应用迁移：$migration"
        sqlite3 "$DB_PATH" < "$migration"
        if [ $? -eq 0 ]; then
            echo "  ✅ 成功"
        else
            echo "  ❌ 失败"
            exit 1
        fi
    fi
done

echo ""
echo "✅ 迁移完成！"

# 显示新版本
NEW_VERSION=$(sqlite3 "$DB_PATH" "SELECT MAX(version) FROM schema_version;")
echo "📊 新数据库版本：v$NEW_VERSION"
