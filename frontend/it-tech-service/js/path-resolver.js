// 路径解析器 - 智能处理资源路径
// 版本: 1.0.0
// 日期: 2026-03-30

(function() {
    'use strict';
    
    // 路径配置
    const PathResolver = {
        // 基础路径映射
        basePaths: {
            // 从根目录访问时的路径映射
            '/': {
                css: 'it-tech-service/css/',
                js: 'it-tech-service/js/',
                images: 'it-tech-service/images/',
                pages: 'it-tech-service/'
            },
            // 从it-tech-service目录访问时的路径映射
            '/it-tech-service/': {
                css: 'css/',
                js: 'js/',
                images: 'images/',
                pages: ''
            }
        },
        
        // 当前访问路径
        currentBase: null,
        
        // 初始化
        init: function() {
            this.detectBasePath();
            this.fixResourcePaths();
            this.fixNavigationLinks();
            console.log('路径解析器初始化完成，当前基础路径:', this.currentBase);
        },
        
        // 检测基础路径
        detectBasePath: function() {
            const pathname = window.location.pathname;
            
            if (pathname.startsWith('/it-tech-service/') || pathname === '/it-tech-service') {
                this.currentBase = '/it-tech-service/';
            } else {
                this.currentBase = '/';
            }
            
            return this.currentBase;
        },
        
        // 修复资源路径
        fixResourcePaths: function() {
            const baseConfig = this.basePaths[this.currentBase];
            if (!baseConfig) return;
            
            // 修复CSS链接
            const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
            cssLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('data:')) {
                    if (href.startsWith('css/') || href.includes('style.css') || href.includes('style.min.css')) {
                        link.setAttribute('href', baseConfig.css + href.replace(/^(\.\.\/)*css\//, ''));
                    }
                }
            });
            
            // 修复JavaScript链接
            const jsScripts = document.querySelectorAll('script[src]');
            jsScripts.forEach(script => {
                const src = script.getAttribute('src');
                if (src && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
                    if (src.startsWith('js/') || src.includes('.js')) {
                        script.setAttribute('src', baseConfig.js + src.replace(/^(\.\.\/)*js\//, ''));
                    }
                }
            });
            
            // 修复图片路径
            const images = document.querySelectorAll('img[src]');
            images.forEach(img => {
                const src = img.getAttribute('src');
                if (src && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
                    if (src.startsWith('images/') || src.includes('.jpg') || src.includes('.png') || src.includes('.gif')) {
                        img.setAttribute('src', baseConfig.images + src.replace(/^(\.\.\/)*images\//, ''));
                    }
                }
            });
        },
        
        // 修复导航链接
        fixNavigationLinks: function() {
            const baseConfig = this.basePaths[this.currentBase];
            if (!baseConfig) return;
            
            // 修复页面链接（不包括锚点链接）
            const pageLinks = document.querySelectorAll('a[href]:not([href^="#"]):not([href^="http"]):not([href^="//"]):not([href^="mailto:"]):not([href^="tel:"])');
            pageLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('//')) {
                    // 排除资源文件
                    if (!href.match(/\.(css|js|jpg|png|gif|svg|ico|pdf)$/i)) {
                        // 如果是页面链接，添加基础路径
                        if (href.includes('.html') || !href.includes('.')) {
                            const fixedHref = baseConfig.pages + href.replace(/^(\.\.\/)*/, '');
                            link.setAttribute('href', fixedHref);
                        }
                    }
                }
            });
        },
        
        // 获取资源完整路径
        getResourcePath: function(relativePath) {
            const baseConfig = this.basePaths[this.currentBase];
            if (!baseConfig) return relativePath;
            
            // 根据文件类型确定基础路径
            if (relativePath.match(/\.css$/i)) {
                return baseConfig.css + relativePath.replace(/^(\.\.\/)*css\//, '');
            } else if (relativePath.match(/\.js$/i)) {
                return baseConfig.js + relativePath.replace(/^(\.\.\/)*js\//, '');
            } else if (relativePath.match(/\.(jpg|png|gif|svg|ico)$/i)) {
                return baseConfig.images + relativePath.replace(/^(\.\.\/)*images\//, '');
            } else if (relativePath.match(/\.html?$/i)) {
                return baseConfig.pages + relativePath.replace(/^(\.\.\/)*/, '');
            }
            
            return relativePath;
        },
        
        // 动态加载CSS
        loadCSS: function(cssPath) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = this.getResourcePath(cssPath);
            document.head.appendChild(link);
            return link;
        },
        
        // 动态加载JavaScript
        loadJS: function(jsPath, callback) {
            const script = document.createElement('script');
            script.src = this.getResourcePath(jsPath);
            script.defer = true;
            
            if (callback) {
                script.onload = callback;
            }
            
            document.head.appendChild(script);
            return script;
        }
    };
    
    // 导出到全局
    window.PathResolver = PathResolver;
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            PathResolver.init();
        });
    } else {
        PathResolver.init();
    }
})();