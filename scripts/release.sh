#!/bin/bash
# 云信旺店 - 发布脚本

echo "🚀 云信旺店 - 发布新版本"
echo "================================"
echo ""

# 输入版本号
read -p "请输入新版本号 (如 1.1.0): " VERSION

if [[ ! $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "❌ 版本号格式错误，应为 x.y.z"
    exit 1
fi

echo ""
echo "📋 发布检查清单："
echo ""

# 检查项
CHECKS=(
    "所有功能已测试通过"
    "代码已提交到 Git"
    "数据库迁移脚本已准备"
    "README.md 已更新"
    "备份已完成"
)

for check in "${CHECKS[@]}"; do
    read -p "✓ $check ? (y/n): " result
    if [ "$result" != "y" ]; then
        echo "❌ 发布中止"
        exit 1
    fi
done

echo ""
echo "📦 执行发布..."

# Git 标签
cd ~/yunxinwangdian
git tag -a v$VERSION -m "发布 v$VERSION"
git push origin v$VERSION

echo ""
echo "✅ 发布完成！"
echo ""
echo "📊 新版本：v$VERSION"
echo "🏷️  Git 标签：v$VERSION"
