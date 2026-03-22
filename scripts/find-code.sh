#!/bin/bash
# 云信旺店 - 代码搜索工具

echo "🔍 云信旺店 - 代码搜索"
echo "================================"
echo ""

if [ -z "$1" ]; then
    echo "用法：./find-code.sh <搜索关键词>"
    echo ""
    echo "示例："
    echo "  ./find-code.sh shopName"
    echo "  ./find-code.sh WiFi"
    echo "  ./find-code.sh 营业时间"
    exit 1
fi

KEYWORD=$1
PROJECT_DIR="$HOME/yunxinwangdian"

echo "搜索关键词：$KEYWORD"
echo ""

# 搜索代码
grep -rn "$KEYWORD" "$PROJECT_DIR" \
  --include="*.html" \
  --include="*.js" \
  --include="*.sql" \
  --include="*.sh" \
  --exclude-dir="node_modules" \
  --exclude-dir=".git" \
  --color=always \
  | head -20

echo ""
echo "================================"
echo "最多显示 20 条结果"
