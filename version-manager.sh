#!/bin/bash

# 版本管理脚本
# 功能: 版本创建、标签管理、发布流程

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Git状态
check_git_status() {
    log_info "检查Git状态..."
    
    # 检查是否有未提交的修改
    if [[ -n $(git status --porcelain) ]]; then
        log_warning "发现未提交的修改:"
        git status --short
        read -p "是否继续？(y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "操作取消"
            exit 1
        fi
    fi
    
    # 检查是否在正确的分支
    CURRENT_BRANCH=$(git branch --show-current)
    log_info "当前分支: $CURRENT_BRANCH"
}

# 获取当前版本
get_current_version() {
    # 从package.json获取版本（如果存在）
    if [[ -f "package.json" ]]; then
        VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
    fi
    
    # 从Git标签获取最新版本
    LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
    
    if [[ -n "$VERSION" && "$VERSION" != "$LATEST_TAG" ]]; then
        log_warning "package.json版本 ($VERSION) 与Git标签 ($LATEST_TAG) 不一致"
    fi
    
    echo "$LATEST_TAG"
}

# 解析版本号
parse_version() {
    local version=$1
    if [[ $version =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
        MAJOR=${BASH_REMATCH[1]}
        MINOR=${BASH_REMATCH[2]}
        PATCH=${BASH_REMATCH[3]}
        echo "$MAJOR $MINOR $PATCH"
    else
        log_error "版本号格式错误: $version，应为 vX.Y.Z 格式"
        exit 1
    fi
}

# 创建新版本
create_version() {
    local version_type=$1
    local current_version=$(get_current_version)
    
    log_info "当前版本: $current_version"
    
    # 解析当前版本
    read MAJOR MINOR PATCH <<< $(parse_version "$current_version")
    
    # 根据类型递增版本号
    case $version_type in
        "major")
            MAJOR=$((MAJOR + 1))
            MINOR=0
            PATCH=0
            ;;
        "minor")
            MINOR=$((MINOR + 1))
            PATCH=0
            ;;
        "patch")
            PATCH=$((PATCH + 1))
            ;;
        *)
            log_error "版本类型错误: $version_type，应为 major/minor/patch"
            exit 1
            ;;
    esac
    
    NEW_VERSION="v${MAJOR}.${MINOR}.${PATCH}"
    log_info "新版本: $NEW_VERSION"
    
    # 确认创建
    read -p "确认创建版本 $NEW_VERSION？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "操作取消"
        exit 0
    fi
    
    # 更新package.json版本（如果存在）
    if [[ -f "package.json" ]]; then
        log_info "更新 package.json 版本..."
        npm version $version_type --no-git-tag-version
    fi
    
    # 提交版本更新
    log_info "提交版本更新..."
    git add .
    git commit -m "chore: 版本更新到 $NEW_VERSION"
    
    # 创建Git标签
    log_info "创建Git标签: $NEW_VERSION"
    git tag -a "$NEW_VERSION" -m "版本 $NEW_VERSION"
    
    log_success "版本 $NEW_VERSION 创建成功"
    
    # 显示下一步操作
    echo ""
    echo "下一步操作:"
    echo "1. 推送标签到远程仓库: git push origin $NEW_VERSION"
    echo "2. 创建发布说明: 更新 RELEASES.md"
    echo "3. 部署新版本: 执行部署脚本"
}

# 列出所有版本
list_versions() {
    log_info "版本列表:"
    git tag -l | sort -V
    echo ""
    
    # 显示当前版本
    CURRENT=$(get_current_version)
    log_info "当前版本: $CURRENT"
    
    # 显示版本统计
    TOTAL_TAGS=$(git tag -l | wc -l)
    log_info "总共 $TOTAL_TAGS 个版本"
}

# 查看版本详情
show_version() {
    local version=$1
    
    if [[ -z "$version" ]]; then
        version=$(get_current_version)
    fi
    
    log_info "版本 $version 详情:"
    echo ""
    
    # 显示标签信息
    git show "$version" --quiet --stat
    echo ""
    
    # 显示提交信息
    git log --oneline "$version" -5
}

# 创建发布分支
create_release_branch() {
    local version=$1
    
    if [[ -z "$version" ]]; then
        version=$(get_current_version)
        # 假设下一个版本是修订版本
        read MAJOR MINOR PATCH <<< $(parse_version "$version")
        PATCH=$((PATCH + 1))
        version="v${MAJOR}.${MINOR}.${PATCH}"
    fi
    
    BRANCH_NAME="release/$version"
    
    log_info "创建发布分支: $BRANCH_NAME"
    
    # 从develop分支创建（如果存在）
    if git branch --list | grep -q "develop"; then
        git checkout develop
        git checkout -b "$BRANCH_NAME"
    else
        git checkout -b "$BRANCH_NAME"
    fi
    
    log_success "发布分支 $BRANCH_NAME 创建成功"
}

# 合并发布分支
merge_release_branch() {
    local version=$1
    
    if [[ -z "$version" ]]; then
        log_error "请指定版本号"
        exit 1
    fi
    
    BRANCH_NAME="release/$version"
    
    log_info "合并发布分支 $BRANCH_NAME 到 master..."
    
    # 切换到master分支
    git checkout master
    
    # 合并发布分支
    git merge --no-ff "$BRANCH_NAME" -m "chore: 发布版本 $version"
    
    # 创建标签
    git tag -a "$version" -m "版本 $version"
    
    log_success "版本 $version 发布完成"
    
    # 显示推送命令
    echo ""
    echo "下一步操作:"
    echo "1. 推送master分支: git push origin master"
    echo "2. 推送标签: git push origin $version"
    echo "3. 删除发布分支: git branch -d $BRANCH_NAME"
}

# 回滚到指定版本
rollback_version() {
    local version=$1
    
    if [[ -z "$version" ]]; then
        log_error "请指定要回滚的版本号"
        exit 1
    fi
    
    log_warning "⚠️  警告: 即将回滚到版本 $version"
    log_warning "这将丢弃当前的所有修改"
    echo ""
    
    read -p "确认回滚到版本 $version？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "操作取消"
        exit 0
    fi
    
    log_info "回滚到版本 $version..."
    git checkout "$version"
    
    log_success "已回滚到版本 $version"
    
    # 显示当前状态
    echo ""
    log_info "当前状态:"
    git status
}

# 显示帮助信息
show_help() {
    cat << EOF
版本管理脚本

用法: ./version-manager.sh [命令] [参数]

命令:
  create <type>       创建新版本 (major/minor/patch)
  list                列出所有版本
  show [version]      显示版本详情
  release [version]   创建发布分支
  merge [version]     合并发布分支到master
  rollback <version>  回滚到指定版本
  current             显示当前版本
  help                显示帮助信息

示例:
  ./version-manager.sh create minor     # 创建次版本
  ./version-manager.sh list             # 列出所有版本
  ./version-manager.sh show v1.2.0      # 显示版本详情
  ./version-manager.sh release v1.3.0   # 创建v1.3.0发布分支
  ./version-manager.sh merge v1.3.0     # 合并发布分支
  ./version-manager.sh rollback v1.1.0  # 回滚到v1.1.0

版本类型说明:
  major: 主版本 (不兼容的API修改)
  minor: 次版本 (向下兼容的功能新增)
  patch: 修订版本 (问题修复)

EOF
}

# 主函数
main() {
    cd "$PROJECT_ROOT"
    
    local command=$1
    local arg=$2
    
    case $command in
        "create")
            check_git_status
            create_version "$arg"
            ;;
        "list")
            list_versions
            ;;
        "show")
            show_version "$arg"
            ;;
        "release")
            check_git_status
            create_release_branch "$arg"
            ;;
        "merge")
            check_git_status
            merge_release_branch "$arg"
            ;;
        "rollback")
            check_git_status
            rollback_version "$arg"
            ;;
        "current")
            get_current_version
            ;;
        "help"|"")
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"