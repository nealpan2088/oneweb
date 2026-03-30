#!/bin/bash

# IT技术服务站 - 部署脚本
# 快速部署到各种静态托管服务

set -e

echo "🚀 IT技术服务站部署脚本"
echo "========================"

# 检查必要命令
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ 未找到命令: $1"
        echo "请先安装 $1"
        exit 1
    fi
}

# 显示菜单
show_menu() {
    echo ""
    echo "请选择部署方式:"
    echo "1) 本地测试"
    echo "2) GitHub Pages"
    echo "3) Netlify"
    echo "4) Vercel"
    echo "5) 阿里云OSS"
    echo "6) 腾讯云COS"
    echo "7) 自定义FTP"
    echo "8) 退出"
    echo ""
    read -p "请输入选择 (1-8): " choice
}

# 本地测试
local_test() {
    echo ""
    echo "🔧 本地测试"
    echo "----------"
    
    # 检查文件
    if [ ! -f "index.html" ]; then
        echo "❌ 未找到 index.html"
        return 1
    fi
    
    echo "✅ 文件检查通过"
    echo ""
    echo "📁 项目结构:"
    find . -type f -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.md" | sort
    
    echo ""
    echo "🌐 本地预览地址:"
    echo "   file://$(pwd)/index.html"
    echo ""
    echo "💡 提示: 可以直接在浏览器中打开 index.html"
    
    # 启动Python简单服务器（可选）
    if command -v python3 &> /dev/null; then
        echo ""
        read -p "是否启动本地服务器? (y/n): " start_server
        if [[ $start_server == "y" || $start_server == "Y" ]]; then
            echo "启动本地服务器在 http://localhost:8000"
            python3 -m http.server 8000 &
            SERVER_PID=$!
            echo "服务器PID: $SERVER_PID"
            echo "按 Ctrl+C 停止服务器"
            wait $SERVER_PID
        fi
    fi
}

# GitHub Pages部署
github_pages() {
    echo ""
    echo "🐙 GitHub Pages部署"
    echo "------------------"
    
    check_command git
    
    # 检查是否在git仓库中
    if [ ! -d ".git" ]; then
        echo "初始化Git仓库..."
        git init
        git add .
        git commit -m "Initial commit - IT技术服务站"
    fi
    
    echo "✅ Git仓库就绪"
    
    # 检查远程仓库
    if ! git remote | grep -q origin; then
        echo ""
        echo "📦 请设置GitHub仓库:"
        read -p "GitHub仓库URL (例如: https://github.com/username/repo.git): " repo_url
        if [ -n "$repo_url" ]; then
            git remote add origin "$repo_url"
        fi
    fi
    
    echo ""
    echo "推送代码到GitHub..."
    git push -u origin main || git push -u origin master
    
    echo ""
    echo "✅ 代码已推送到GitHub"
    echo ""
    echo "💡 接下来:"
    echo "1. 访问 https://github.com/你的用户名/仓库名/settings/pages"
    echo "2. 在 'Source' 部分选择分支 (main/master)"
    echo "3. 选择 '/ (root)' 文件夹"
    echo "4. 点击 Save"
    echo "5. 等待几分钟，访问提供的URL"
}

# Netlify部署
netlify_deploy() {
    echo ""
    echo "🌐 Netlify部署"
    echo "-------------"
    
    check_command npm
    
    if ! command -v netlify &> /dev/null; then
        echo "安装Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    echo "登录Netlify..."
    netlify login
    
    echo "初始化部署..."
    netlify init
    
    echo "部署到Netlify..."
    netlify deploy --prod
    
    echo ""
    echo "✅ 部署完成!"
    echo "💡 可以在Netlify控制台管理站点"
}

# 主函数
main() {
    echo "项目目录: $(pwd)"
    echo ""
    
    while true; do
        show_menu
        
        case $choice in
            1)
                local_test
                ;;
            2)
                github_pages
                ;;
            3)
                netlify_deploy
                ;;
            4)
                echo "Vercel部署 - 请参考: https://vercel.com/docs"
                echo "安装Vercel CLI: npm i -g vercel"
                echo "运行: vercel"
                ;;
            5)
                echo "阿里云OSS部署 - 请参考阿里云文档"
                echo "需要: ossutil 工具和OSS bucket"
                ;;
            6)
                echo "腾讯云COS部署 - 请参考腾讯云文档"
                echo "需要: coscmd 工具和COS bucket"
                ;;
            7)
                echo "自定义FTP部署"
                read -p "FTP服务器: " ftp_server
                read -p "用户名: " ftp_user
                read -p "密码: " ftp_pass
                read -p "远程目录: " ftp_dir
                
                echo "使用lftp上传..."
                lftp -e "set ftp:ssl-allow no; open $ftp_server; user $ftp_user $ftp_pass; mirror -R . $ftp_dir; quit"
                ;;
            8)
                echo "再见! 👋"
                exit 0
                ;;
            *)
                echo "❌ 无效选择"
                ;;
        esac
        
        echo ""
        read -p "按回车键继续..."
    done
}

# 运行主函数
main "$@"