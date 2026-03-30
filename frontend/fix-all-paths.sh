#!/bin/bash

# 修复所有HTML文件的路径问题
# 版本: 1.0.0
# 日期: 2026-03-30

echo "🔧 开始修复所有HTML文件的路径问题..."
echo "=========================================="

# 工作目录
WORK_DIR="/home/admin/yunxinwangdian/frontend"
cd "$WORK_DIR"

# 备份原始文件
echo "📦 备份原始文件..."
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 1. 修复主页 (index-personal-homepage.html)
echo "1. 修复主页..."
cp index-personal-homepage.html "$BACKUP_DIR/index-personal-homepage.html.orig"

# 使用相对路径（让路径解析器处理）
sed -i 's|href="it-tech-service/css/|href="css/|g' index-personal-homepage.html
sed -i 's|src="it-tech-service/js/|src="js/|g' index-personal-homepage.html
sed -i 's|href="it-tech-service/about.html"|href="about.html"|g' index-personal-homepage.html
sed -i 's|href="it-tech-service/gallery.html"|href="gallery.html"|g' index-personal-homepage.html
sed -i 's|href="it-tech-service/beian.html"|href="beian.html"|g' index-personal-homepage.html

# 添加路径解析器
if ! grep -q "path-resolver.js" index-personal-homepage.html; then
    # 在最后一个script标签前添加
    sed -i '/<\/body>/i\    <script src="js/path-resolver.js" defer></script>' index-personal-homepage.html
fi

echo "   ✅ 主页修复完成"

# 2. 修复it-tech-service目录下的所有HTML文件
echo "2. 修复it-tech-service目录下的文件..."
cd it-tech-service

# 备份
mkdir -p "../$BACKUP_DIR/it-tech-service"
cp *.html "../$BACKUP_DIR/it-tech-service/"

# 修复所有HTML文件
for file in *.html; do
    echo "   📄 修复 $file..."
    
    # 移除it-tech-service前缀（这些文件在it-tech-service目录中）
    sed -i 's|href="it-tech-service/css/|href="css/|g' "$file"
    sed -i 's|src="it-tech-service/js/|src="js/|g' "$file"
    sed -i 's|href="it-tech-service/about.html"|href="about.html"|g' "$file"
    sed -i 's|href="it-tech-service/gallery.html"|href="gallery.html"|g' "$file"
    sed -i 's|href="it-tech-service/beian.html"|href="beian.html"|g' "$file"
    sed -i 's|href="it-tech-service/admin.html"|href="admin.html"|g' "$file"
    sed -i 's|href="it-tech-service/admin-backend.html"|href="admin-backend.html"|g' "$file"
    sed -i 's|href="it-tech-service/test.html"|href="test.html"|g' "$file"
    sed -i 's|href="it-tech-service/test-api.html"|href="test-api.html"|g' "$file"
    
    # 添加路径解析器
    if ! grep -q "path-resolver.js" "$file"; then
        # 在最后一个script标签前添加，或者在</body>前添加
        if grep -q "</body>" "$file"; then
            sed -i '/<\/body>/i\    <script src="js/path-resolver.js" defer></script>' "$file"
        elif grep -q "</html>" "$file"; then
            sed -i '/<\/html>/i\    <script src="js/path-resolver.js" defer></script>' "$file"
        else
            echo "    ⚠️  $file 没有找到合适的插入位置"
        fi
    fi
    
    echo "   ✅ $file 修复完成"
done

cd ..

# 3. 创建符号链接，让资源可以从根目录访问
echo "3. 创建资源符号链接..."
mkdir -p css js images

# CSS链接
if [ ! -L "css/style.min.css" ]; then
    ln -sf ../it-tech-service/css/style.min.css css/style.min.css
    ln -sf ../it-tech-service/css/style.css css/style.css
fi

# JavaScript链接
if [ ! -L "js/main.js" ]; then
    ln -sf ../it-tech-service/js/main.js js/main.js
    ln -sf ../it-tech-service/js/api.js js/api.js
    ln -sf ../it-tech-service/js/api-backend.js js/api-backend.js
    ln -sf ../it-tech-service/js/path-resolver.js js/path-resolver.js
    ln -sf ../it-tech-service/js/admin.js js/admin.js
    ln -sf ../it-tech-service/js/admin-backend.js js/admin-backend.js
fi

# 图片链接
if [ ! -L "images" ]; then
    ln -sf it-tech-service/images images
fi

echo "   ✅ 符号链接创建完成"

# 4. 更新主页的符号链接
echo "4. 更新主页符号链接..."
if [ -L "index.html" ]; then
    rm index.html
fi
ln -sf index-personal-homepage.html index.html

echo "   ✅ 主页链接更新完成"

# 5. 创建测试页面验证修复
echo "5. 创建验证测试..."
cat > test-path-fix.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>路径修复验证测试</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .test { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background: #d4edda; border-color: #c3e6cb; }
        .error { background: #f8d7da; border-color: #f5c6cb; }
        .warning { background: #fff3cd; border-color: #ffeaa7; }
    </style>
</head>
<body>
    <h1>路径修复验证测试</h1>
    
    <div class="test">
        <h2>当前访问信息</h2>
        <p id="currentPath"></p>
    </div>
    
    <div class="test">
        <h2>资源加载测试</h2>
        <button onclick="testResource('css/style.min.css')">测试CSS加载</button>
        <button onclick="testResource('js/main.js')">测试JS加载</button>
        <div id="resourceResult"></div>
    </div>
    
    <div class="test">
        <h2>页面跳转测试</h2>
        <p><a href="gallery.html">跳转到图片展示</a></p>
        <p><a href="about.html">跳转到关于我</a></p>
        <p><a href="beian.html">跳转到备案信息</a></p>
    </div>
    
    <script>
        // 显示当前路径
        document.getElementById('currentPath').innerHTML = 
            `当前URL: ${window.location.href}<br>
             路径名: ${window.location.pathname}<br>
             从根目录访问: ${window.location.pathname === '/'}`;
        
        // 测试资源加载
        function testResource(path) {
            const result = document.getElementById('resourceResult');
            result.innerHTML = `测试加载: ${path}...`;
            result.className = 'test warning';
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = path;
            link.onload = function() {
                result.innerHTML = `✅ ${path} 加载成功`;
                result.className = 'test success';
            };
            link.onerror = function() {
                result.innerHTML = `❌ ${path} 加载失败`;
                result.className = 'test error';
            };
            
            if (path.endsWith('.css')) {
                document.head.appendChild(link);
            } else if (path.endsWith('.js')) {
                const script = document.createElement('script');
                script.src = path;
                script.onload = link.onload;
                script.onerror = link.onerror;
                document.head.appendChild(script);
            }
        }
        
        // 自动测试CSS
        setTimeout(() => testResource('css/style.min.css'), 1000);
    </script>
</body>
</html>
EOF

echo "   ✅ 验证测试页面创建完成"

echo ""
echo "🎉 所有修复完成！"
echo "=========================================="
echo ""
echo "📊 修复总结："
echo "1. ✅ 所有HTML文件的资源路径已统一"
echo "2. ✅ 添加了智能路径解析器"
echo "3. ✅ 创建了资源符号链接"
echo "4. ✅ 更新了主页链接"
echo "5. ✅ 创建了验证测试页面"
echo ""
echo "🌐 测试地址："
echo "- 主页: http://47.110.156.11/"
echo "- 验证测试: http://47.110.156.11/test-path-fix.html"
echo "- 图片展示: http://47.110.156.11/gallery.html"
echo "- 关于我: http://47.110.156.11/about.html"
echo ""
echo "🔧 备份文件保存在: $BACKUP_DIR"
echo ""
echo "💡 使用提示："
echo "- 页面现在使用相对路径"
echo "- 路径解析器会自动修正资源加载"
echo "- 从任何位置访问都能正确加载资源"
echo "- 如果还有问题，请清除浏览器缓存（Ctrl+F5）"