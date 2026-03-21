#!/bin/bash
# 云信旺店 - 数据库备份脚本

set -e

# 配置
BACKUP_DIR="$HOME/yunxinwangdian-backups"
DB_PATH="$HOME/yunxinwangdian/database/shop.db"
DATE=$(date +%Y%m%d-%H%M)
BACKUP_FILE="$BACKUP_DIR/shop-db-$DATE.sqlite"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 执行备份
echo "📦 开始备份数据库..."
cp "$DB_PATH" "$BACKUP_FILE"

# 压缩备份
echo "🗜️  压缩备份文件..."
gzip "$BACKUP_FILE"

# 保留最近 30 天的备份
echo "🧹 清理旧备份..."
find "$BACKUP_DIR" -name "shop-db-*.sqlite.gz" -mtime +30 -delete

# 输出结果
SIZE=$(ls -lh "$BACKUP_FILE.gz" | awk '{print $5}')
echo "✅ 备份完成：$BACKUP_FILE.gz ($SIZE)"

# 列出所有备份
echo ""
echo "📋 当前备份列表："
ls -lh "$BACKUP_DIR"/*.gz
