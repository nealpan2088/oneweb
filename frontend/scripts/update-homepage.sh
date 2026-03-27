#!/bin/bash
# 个人主页修改工具
# 用法: ./update-homepage.sh [选项]

HOME_DIR="/home/admin/yunxinwangdian/frontend"
HTML_FILE="$HOME_DIR/index.html"
BACKUP_DIR="$HOME_DIR/backups"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 备份函数
backup_file() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="$BACKUP_DIR/index.html.$timestamp"
    cp "$HTML_FILE" "$backup_file"
    echo "$backup_file"
}

# 显示帮助
show_help() {
    echo "个人主页修改工具"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --backup              创建备份"
    echo "  --restore <备份文件>  恢复备份"
    echo "  --list-backups        列出所有备份"
    echo "  --update-title <新标题> 修改页面标题"
    echo "  --update-hero <主标题> <副标题> 修改英雄区域"
    echo "  --update-demo <编号> <标题> <描述> <链接> 修改DEMO"
    echo "  --update-tech <编号> <名称> <熟练度> <图标> 修改技术栈"
    echo "  --update-about <标题> <描述1> <描述2> <描述3> 修改关于我"
    echo "  --update-contact <邮箱> <GitHub> <Twitter> <LinkedIn> 修改联系信息"
    echo "  --preview             预览当前页面"
    echo "  --validate            验证HTML语法"
    echo "  --help                显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --backup"
    echo "  $0 --update-title \"我的技术作品集\""
    echo "  $0 --update-demo 1 \"智能电商\" \"电商平台解决方案\" \"/saas-customer/\""
    echo "  $0 --update-tech 1 \"Python\" \"精通 · 6年经验\" \"fab fa-python\""
}

# 创建备份
create_backup() {
    print_info "正在创建备份..."
    local backup_file=$(backup_file)
    print_success "备份已创建: $backup_file"
}

# 恢复备份
restore_backup() {
    local backup_file="$1"
    if [ ! -f "$backup_file" ]; then
        print_error "备份文件不存在: $backup_file"
        exit 1
    fi
    
    print_info "正在恢复备份: $backup_file"
    cp "$backup_file" "$HTML_FILE"
    print_success "备份已恢复"
}

# 列出备份
list_backups() {
    print_info "备份文件列表:"
    ls -lt "$BACKUP_DIR" 2>/dev/null | head -10
}

# 修改页面标题
update_title() {
    local new_title="$1"
    print_info "修改页面标题为: $new_title"
    
    local backup_file=$(backup_file)
    
    # 修改<title>标签
    sed -i "s|<title>[^<]*</title>|<title>$new_title</title>|" "$HTML_FILE"
    
    # 修改页脚中的标题
    sed -i "s|潘海平 · 开发者作品集|$new_title|" "$HTML_FILE"
    
    print_success "页面标题已修改"
    print_info "备份文件: $backup_file"
}

# 修改英雄区域
update_hero() {
    local main_title="$1"
    local sub_title="$2"
    
    print_info "修改英雄区域"
    print_info "主标题: $main_title"
    print_info "副标题: $sub_title"
    
    local backup_file=$(backup_file)
    
    # 修改主标题
    sed -i "s|<h1 class=\"hero-title animate\">[^<]*</h1>|<h1 class=\"hero-title animate\">$main_title</h1>|" "$HTML_FILE"
    
    # 修改副标题
    sed -i "s|<p class=\"hero-subtitle animate delay-1\">[^<]*</p>|<p class=\"hero-subtitle animate delay-1\">$sub_title</p>|" "$HTML_FILE"
    
    print_success "英雄区域已修改"
    print_info "备份文件: $backup_file"
}

# 修改DEMO项目
update_demo() {
    local demo_num="$1"
    local title="$2"
    local description="$3"
    local link="$4"
    
    print_info "修改DEMO项目 #$demo_num"
    print_info "标题: $title"
    print_info "描述: $description"
    print_info "链接: $link"
    
    local backup_file=$(backup_file)
    
    # 根据DEMO编号确定行数范围
    case $demo_num in
        1) start=280; end=320 ;;
        2) start=330; end=370 ;;
        3) start=380; end=420 ;;
        4) start=430; end=470 ;;
        5) start=480; end=520 ;;
        6) start=530; end=570 ;;
        *) print_error "DEMO编号必须是1-6"; exit 1 ;;
    esac
    
    # 修改标题
    if [ -n "$title" ]; then
        sed -i "${start},${end}s|<h3 class=\"demo-title\">[^<]*</h3>|<h3 class=\"demo-title\">$title</h3>|" "$HTML_FILE"
    fi
    
    # 修改描述
    if [ -n "$description" ]; then
        sed -i "${start},${end}s|<p class=\"demo-description\">[^<]*</p>|<p class=\"demo-description\">$description</p>|" "$HTML_FILE"
    fi
    
    # 修改链接
    if [ -n "$link" ]; then
        sed -i "${start},${end}s|href=\"[^\"]*\"|href=\"$link\"|2" "$HTML_FILE"
    fi
    
    print_success "DEMO项目 #$demo_num 已修改"
    print_info "备份文件: $backup_file"
}

# 修改技术栈
update_tech() {
    local tech_num="$1"
    local name="$2"
    local level="$3"
    local icon="$4"
    
    print_info "修改技术栈 #$tech_num"
    print_info "名称: $name"
    print_info "熟练度: $level"
    print_info "图标: $icon"
    
    local backup_file=$(backup_file)
    
    # 根据技术编号确定行数
    case $tech_num in
        1) line=640 ;;
        2) line=650 ;;
        3) line=660 ;;
        4) line=670 ;;
        5) line=680 ;;
        6) line=690 ;;
        7) line=700 ;;
        8) line=710 ;;
        *) print_error "技术编号必须是1-8"; exit 1 ;;
    esac
    
    # 修改技术名称
    if [ -n "$name" ]; then
        sed -i "${line}s|<h3 class=\"tech-name\">[^<]*</h3>|<h3 class=\"tech-name\">$name</h3>|" "$HTML_FILE"
    fi
    
    # 修改熟练度
    if [ -n "$level" ]; then
        sed -i "${line}s|<p class=\"tech-level\">[^<]*</p>|<p class=\"tech-level\">$level</p>|" "$HTML_FILE"
    fi
    
    # 修改图标
    if [ -n "$icon" ]; then
        sed -i "${line}s|<i class=\"[^\"]*\"></i>|<i class=\"$icon\"></i>|" "$HTML_FILE"
    fi
    
    print_success "技术栈 #$tech_num 已修改"
    print_info "备份文件: $backup_file"
}

# 修改关于我
update_about() {
    local title="$1"
    local desc1="$2"
    local desc2="$3"
    local desc3="$4"
    
    print_info "修改关于我区域"
    
    local backup_file=$(backup_file)
    
    # 修改标题
    if [ -n "$title" ]; then
        sed -i "s|<h3 class=\"animate\">潘海平 · 全栈开发者</h3>|<h3 class=\"animate\">$title</h3>|" "$HTML_FILE"
    fi
    
    # 修改描述1
    if [ -n "$desc1" ]; then
        sed -i "s|<p class=\"animate delay-1\">拥有8年Web开发经验[^<]*</p>|<p class=\"animate delay-1\">$desc1</p>|" "$HTML_FILE"
    fi
    
    # 修改描述2
    if [ -n "$desc2" ]; then
        sed -i "s|<p class=\"animate delay-2\">擅长从前端到后端的全栈开发[^<]*</p>|<p class=\"animate delay-2\">$desc2</p>|" "$HTML_FILE"
    fi
    
    # 修改描述3
    if [ -n "$desc3" ]; then
        sed -i "s|<p class=\"animate delay-3\">除了编码，我也热衷于技术分享[^<]*</p>|<p class=\"animate delay-3\">$desc3</p>|" "$HTML_FILE"
    fi
    
    print_success "关于我区域已修改"
    print_info "备份文件: $backup_file"
}

# 修改联系信息
update_contact() {
    local email="$1"
    local github="$2"
    local twitter="$3"
    local linkedin="$4"
    
    print_info "修改联系信息"
    
    local backup_file=$(backup_file)
    
    # 修改邮箱
    if [ -n "$email" ]; then
        sed -i "s|mailto:panhaiping@example.com|mailto:$email|" "$HTML_FILE"
    fi
    
    # 修改GitHub
    if [ -n "$github" ]; then
        sed -i "s|https://github.com/yourusername|$github|g" "$HTML_FILE"
    fi
    
    # 修改Twitter
    if [ -n "$twitter" ]; then
        sed -i "s|https://twitter.com/yourusername|$twitter|" "$HTML_FILE"
    fi
    
    # 修改LinkedIn
    if [ -n "$linkedin" ]; then
        sed -i "s|https://linkedin.com/in/yourusername|$linkedin|" "$HTML_FILE"
    fi
    
    print_success "联系信息已修改"
    print_info "备份文件: $backup_file"
}

# 预览页面
preview_page() {
    print_info "页面预览信息:"
    echo ""
    
    # 获取标题
    local title=$(grep -o '<title>[^<]*</title>' "$HTML_FILE" | sed 's/<title>//;s/<\/title>//')
    echo "📄 页面标题: $title"
    
    # 获取主标题
    local hero_title=$(grep -o '<h1 class="hero-title animate">[^<]*</h1>' "$HTML_FILE" | sed 's/<h1 class="hero-title animate">//;s/<\/h1>//')
    echo "🎯 主标题: $hero_title"
    
    # 获取DEMO数量
    local demo_count=$(grep -c 'class="demo-title"' "$HTML_FILE")
    echo "🚀 DEMO数量: $demo_count 个"
    
    # 获取技术栈数量
    local tech_count=$(grep -c 'class="tech-name"' "$HTML_FILE")
    echo "🔧 技术栈: $tech_count 项"
    
    # 获取文件大小
    local file_size=$(du -h "$HTML_FILE" | cut -f1)
    echo "📦 文件大小: $file_size"
    
    # 获取最后修改时间
    local last_modified=$(stat -c %y "$HTML_FILE" | cut -d'.' -f1)
    echo "🕐 最后修改: $last_modified"
    
    echo ""
    print_info "访问地址: http://47.110.156.11/"
}

# 验证HTML
validate_html() {
    print_info "验证HTML语法..."
    
    if command -v tidy &> /dev/null; then
        tidy -q -errors "$HTML_FILE" 2>&1 | head -20
        if [ $? -eq 0 ]; then
            print_success "HTML语法验证通过"
        else
            print_warning "HTML语法存在警告"
        fi
    else
        print_warning "tidy命令未安装，跳过HTML验证"
        print_info "可以安装: sudo apt-get install tidy"
    fi
}

# 主程序
main() {
    case "$1" in
        --backup)
            create_backup
            ;;
        --restore)
            if [ -z "$2" ]; then
                print_error "请指定备份文件"
                exit 1
            fi
            restore_backup "$2"
            ;;
        --list-backups)
            list_backups
            ;;
        --update-title)
            if [ -z "$2" ]; then
                print_error "请指定新标题"
                exit 1
            fi
            update_title "$2"
            ;;
        --update-hero)
            if [ -z "$2" ] || [ -z "$3" ]; then
                print_error "请指定主标题和副标题"
                exit 1
            fi
            update_hero "$2" "$3"
            ;;
        --update-demo)
            if [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ] || [ -z "$5" ]; then
                print_error "请指定DEMO编号、标题、描述和链接"
                exit 1
            fi
            update_demo "$2" "$3" "$4" "$5"
            ;;
        --update-tech)
            if [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ] || [ -z "$5" ]; then
                print_error "请指定技术编号、名称、熟练度和图标"
                exit 1
            fi
            update_tech "$2" "$3" "$4" "$5"
            ;;
        --update-about)
            if [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ] || [ -z "$5" ]; then
                print_error "请指定标题和三个描述"
                exit 1
            fi
            update_about "$2" "$3" "$4" "$5"
            ;;
        --update-contact)
            if [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ] || [ -z "$5" ]; then
                print_error "请指定邮箱、GitHub、Twitter和LinkedIn"
                exit 1
            fi
            update_contact "$2" "$3" "$4" "$5"
            ;;
        --preview)
            preview_page
            ;;
        --validate)
            validate_html
            ;;
        --help|*)
            show_help
            ;;
    esac
}

# 运行主程序
main "$@"