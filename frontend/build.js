#!/usr/bin/env node

/**
 * 构建脚本
 * 版本: 1.0.0
 * 日期: 2026-03-30
 * 
 * 功能: 自动化构建、版本管理、资源优化
 * 使用: node build.js [command]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
    // 输入输出目录
    srcDir: './src',
    distDir: './dist',
    
    // 版本配置
    version: {
        major: 1,
        minor: 0,
        patch: 0,
        build: null // 自动生成
    },
    
    // 构建配置
    build: {
        minify: true,
        sourcemaps: false,
        cacheBusting: true
    },
    
    // 文件类型配置
    fileTypes: {
        js: {
            extensions: ['.js'],
            outputDir: 'js'
        },
        css: {
            extensions: ['.css'],
            outputDir: 'css'
        },
        html: {
            extensions: ['.html'],
            outputDir: ''
        }
    }
};

// 工具函数
class BuildUtils {
    /**
     * 生成构建版本号
     */
    static generateBuildNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        
        return `${year}${month}${day}_${hour}${minute}`;
    }
    
    /**
     * 读取文件
     */
    static readFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            console.error(`读取文件失败: ${filePath}`, error);
            return null;
        }
    }
    
    /**
     * 写入文件
     */
    static writeFile(filePath, content) {
        try {
            // 确保目录存在
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ 写入文件: ${filePath}`);
            return true;
        } catch (error) {
            console.error(`写入文件失败: ${filePath}`, error);
            return false;
        }
    }
    
    /**
     * 复制文件
     */
    static copyFile(src, dest) {
        try {
            const dir = path.dirname(dest);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.copyFileSync(src, dest);
            console.log(`📋 复制文件: ${src} → ${dest}`);
            return true;
        } catch (error) {
            console.error(`复制文件失败: ${src} → ${dest}`, error);
            return false;
        }
    }
    
    /**
     * 递归获取文件列表
     */
    static getFiles(dir, extensions = []) {
        let results = [];
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                results = results.concat(this.getFiles(filePath, extensions));
            } else {
                if (extensions.length === 0 || 
                    extensions.some(ext => file.endsWith(ext))) {
                    results.push(filePath);
                }
            }
        }
        
        return results;
    }
    
    /**
     * 简单JS压缩
     */
    static minifyJS(code) {
        // 移除注释
        code = code.replace(/\/\*[\s\S]*?\*\//g, '');
        code = code.replace(/\/\/.*$/gm, '');
        
        // 移除多余的空格和换行
        code = code.replace(/\s+/g, ' ');
        code = code.replace(/\s*([{}()\[\]<>+=*\/%!&|^~?:;,.-])\s*/g, '$1');
        
        return code.trim();
    }
    
    /**
     * 简单CSS压缩
     */
    static minifyCSS(code) {
        // 移除注释
        code = code.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // 移除多余的空格和换行
        code = code.replace(/\s+/g, ' ');
        code = code.replace(/\s*([{}:;,])\s*/g, '$1');
        code = code.replace(/;}/g, '}');
        
        return code.trim();
    }
    
    /**
     * 添加版本号到URL
     */
    static addVersionToUrls(content, version) {
        // 匹配script、link、img等标签的src/href属性
        const urlPatterns = [
            /(src|href)=["']([^"']+\.(js|css))["']/g,
            /url\(["']?([^"')]+\.(js|css))["']?\)/g
        ];
        
        let result = content;
        
        urlPatterns.forEach(pattern => {
            result = result.replace(pattern, (match, attr, url) => {
                // 跳过外部URL
                if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
                    return match;
                }
                
                // 添加版本号
                const separator = url.includes('?') ? '&' : '?';
                return match.replace(url, `${url}${separator}v=${version}`);
            });
        });
        
        return result;
    }
    
    /**
     * 执行命令
     */
    static executeCommand(command, options = {}) {
        try {
            const result = execSync(command, {
                stdio: 'inherit',
                ...options
            });
            return { success: true, result };
        } catch (error) {
            console.error(`命令执行失败: ${command}`, error);
            return { success: false, error };
        }
    }
}

// 构建器类
class Builder {
    constructor(config) {
        this.config = config;
        this.version = this.generateVersion();
        this.utils = BuildUtils;
    }
    
    /**
     * 生成版本号
     */
    generateVersion() {
        const buildNumber = this.utils.generateBuildNumber();
        return {
            ...this.config.version,
            build: buildNumber,
            full: `${this.config.version.major}.${this.config.version.minor}.${this.config.version.patch}+${buildNumber}`
        };
    }
    
    /**
     * 清理构建目录
     */
    clean() {
        console.log('🧹 清理构建目录...');
        
        if (fs.existsSync(this.config.distDir)) {
            fs.rmSync(this.config.distDir, { recursive: true, force: true });
            console.log(`✅ 已清理: ${this.config.distDir}`);
        }
        
        fs.mkdirSync(this.config.distDir, { recursive: true });
        console.log(`✅ 已创建: ${this.config.distDir}`);
    }
    
    /**
     * 构建JavaScript文件
     */
    buildJS() {
        console.log('🔧 构建JavaScript文件...');
        
        const jsFiles = this.utils.getFiles(this.config.srcDir, this.config.fileTypes.js.extensions);
        let processedCount = 0;
        
        jsFiles.forEach(srcFile => {
            // 读取源文件
            const content = this.utils.readFile(srcFile);
            if (!content) return;
            
            // 计算相对路径
            const relativePath = path.relative(this.config.srcDir, srcFile);
            let destFile = path.join(this.config.distDir, this.config.fileTypes.js.outputDir, relativePath);
            
            // 处理内容
            let processedContent = content;
            
            // 1. 替换版本占位符
            processedContent = processedContent.replace(/{{VERSION}}/g, this.version.full);
            processedContent = processedContent.replace(/{{BUILD_DATE}}/g, new Date().toISOString());
            
            // 2. 压缩（如果启用）
            if (this.config.build.minify) {
                processedContent = this.utils.minifyJS(processedContent);
            }
            
            // 3. 写入文件
            if (this.utils.writeFile(destFile, processedContent)) {
                processedCount++;
            }
        });
        
        console.log(`✅ JavaScript构建完成: ${processedCount}/${jsFiles.length} 个文件`);
        return processedCount;
    }
    
    /**
     * 构建CSS文件
     */
    buildCSS() {
        console.log('🎨 构建CSS文件...');
        
        const cssFiles = this.utils.getFiles(this.config.srcDir, this.config.fileTypes.css.extensions);
        let processedCount = 0;
        
        cssFiles.forEach(srcFile => {
            const content = this.utils.readFile(srcFile);
            if (!content) return;
            
            const relativePath = path.relative(this.config.srcDir, srcFile);
            let destFile = path.join(this.config.distDir, this.config.fileTypes.css.outputDir, relativePath);
            
            let processedContent = content;
            
            // 替换版本占位符
            processedContent = processedContent.replace(/{{VERSION}}/g, this.version.full);
            
            // 压缩（如果启用）
            if (this.config.build.minify) {
                processedContent = this.utils.minifyCSS(processedContent);
            }
            
            if (this.utils.writeFile(destFile, processedContent)) {
                processedCount++;
            }
        });
        
        console.log(`✅ CSS构建完成: ${processedCount}/${cssFiles.length} 个文件`);
        return processedCount;
    }
    
    /**
     * 构建HTML文件
     */
    buildHTML() {
        console.log('📄 构建HTML文件...');
        
        const htmlFiles = this.utils.getFiles('.', this.config.fileTypes.html.extensions)
            .filter(file => !file.includes('node_modules') && !file.includes(this.config.distDir));
        
        let processedCount = 0;
        
        htmlFiles.forEach(srcFile => {
            const content = this.utils.readFile(srcFile);
            if (!content) return;
            
            const destFile = path.join(this.config.distDir, path.basename(srcFile));
            let processedContent = content;
            
            // 1. 替换版本占位符
            processedContent = processedContent.replace(/{{VERSION}}/g, this.version.full);
            processedContent = processedContent.replace(/{{BUILD_DATE}}/g, new Date().toISOString());
            
            // 2. 添加版本号到资源URL（如果启用缓存破坏）
            if (this.config.build.cacheBusting) {
                processedContent = this.utils.addVersionToUrls(processedContent, this.version.build);
            }
            
            // 3. 更新资源路径（指向dist目录）
            processedContent = this.updateResourcePaths(processedContent);
            
            if (this.utils.writeFile(destFile, processedContent)) {
                processedCount++;
            }
        });
        
        console.log(`✅ HTML构建完成: ${processedCount}/${htmlFiles.length} 个文件`);
        return processedCount;
    }
    
    /**
     * 更新资源路径
     */
    updateResourcePaths(content) {
        // 将相对路径更新为指向dist目录
        const patterns = [
            /(src|href)=["'](\.\/src\/[^"']+)["']/g,
            /url\(["']?(\.\/src\/[^"')]+)["']?\)/g
        ];
        
        let result = content;
        
        patterns.forEach(pattern => {
            result = result.replace(pattern, (match, attr, url) => {
                // 计算新的路径
                const newUrl = url.replace('./src/', `./${this.config.fileTypes.js.outputDir}/`);
                return match.replace(url, newUrl);
            });
        });
        
        return result;
    }
    
    /**
     * 复制静态资源
     */
    copyAssets() {
        console.log('📦 复制静态资源...');
        
        const assetDirs = ['images', 'fonts', 'assets'];
        let copiedCount = 0;
        
        assetDirs.forEach(dir => {
            if (fs.existsSync(dir)) {
                const destDir = path.join(this.config.distDir, dir);
                const files = this.utils.getFiles(dir);
                
                files.forEach(srcFile => {
                    const relativePath = path.relative(dir, srcFile);
                    const destFile = path.join(destDir, relativePath);
                    
                    if (this.utils.copyFile(srcFile, destFile)) {
                        copiedCount++;
                    }
                });
            }
        });
        
        console.log(`✅ 静态资源复制完成: ${copiedCount} 个文件`);
        return copiedCount;
    }
    
    /**
     * 生成版本文件
     */
    generateVersionFile() {
        console.log('🏷️ 生成版本文件...');
        
        const versionInfo = {
            version: this.version,
            build: {
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                config: this.config.build
            },
            git: this.getGitInfo()
        };
        
        const versionFile = path.join(this.config.distDir, 'version.json');
        const content = JSON.stringify(versionInfo, null, 2);
        
        if (this.utils.writeFile(versionFile, content)) {
            console.log(`✅ 版本文件已生成: ${versionFile}`);
            return true;
        }
        
        return false;
    }
    
    /**
     * 获取Git信息
     */
    getGitInfo() {
        try {
            const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
            const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
            const commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
            
            return {
                commitHash,
                branch,
                commitMessage,
                hasChanges: execSync('git status --porcelain', { encoding: 'utf8' }).length > 0
            };
        } catch (error) {
            console.warn('获取Git信息失败:', error.message);
            return null;
        }
    }
    
    /**
     * 运行代码检查
     */
    runLint() {
        console.log('🔍 运行代码检查...');
        
        // 检查是否有ESLint
        try {
            execSync('which eslint', { stdio: 'ignore' });
            
            const result = this.utils.executeCommand(
                `npx eslint ${this.config.srcDir} --ext .js --fix`
            );
            
            if (result.success) {
                console.log('✅ 代码检查完成');
            } else {
                console.warn('⚠️ 代码检查发现问题');
            }
            
            return result.success;
        } catch (error) {
            console.warn('ESLint未安装，跳过代码检查');
            return true;
        }
    }
    
    /**
     * 运行测试
     */
    runTests() {
        console.log('🧪 运行测试...');
        
        // 检查是否有测试文件
        const testFiles = this.utils.getFiles(this.config.srcDir, ['.test.js', '.spec.js']);
        
        if (testFiles.length === 0) {
            console.log('📭 未找到测试文件，跳过测试');
            return true;
        }
        
        try {
            execSync('which jest', { stdio: 'ignore' });
            
            const result = this.utils.executeCommand('npx jest --passWithNoTests');
            
            if (result.success) {
                console.log('✅ 测试通过');
            } else {
                console.error('❌ 测试失败');
            }
            
            return result.success;
        } catch (error) {
            console.warn('Jest未安装，跳过测试');
            return true;
        }
    }
    
    /**
     * 执行完整构建流程
     */
    build() {
        console.log('🚀 开始构建...');
        console.log(`版本: ${this.version.full}`);
        console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
        console.log('='.repeat(50));
        
        const startTime = Date.now();
        
        try {
            // 1. 清理
            this.clean();
            
            // 2. 代码检查
            if (!this.runLint()) {
                console.warn('⚠️ 代码检查发现问题，继续构建...');
            }
            
            // 3. 运行测试
            if (!this.runTests()) {
                throw new Error('测试失败，构建中止');
            }
            
            // 4. 构建各类型文件
            const jsCount = this.buildJS();
            const cssCount = this.buildCSS();
            const htmlCount = this.buildHTML();
            const assetCount = this.copyAssets();
            
            // 5. 生成版本文件
            this.generateVersionFile();
            
            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);
            
            console.log('='.repeat(50));
            console.log('🎉 构建完成!');
            console.log(`耗时: ${duration}秒`);
            console.log(`文件统计:`);
            console.log(`  JavaScript: ${jsCount} 个文件`);
            console.log(`  CSS: ${cssCount} 个文件`);
            console.log(`  HTML: ${htmlCount} 个文件`);
            console.log(`  资源: ${assetCount} 个文件`);
            console.log(`输出目录: ${path.resolve(this.config.distDir)}`);
            console.log(`版本: ${this.version.full}`);
            
            return {
                success: true,
                duration,
                counts: { jsCount, cssCount, htmlCount, assetCount },
                version: this.version
            };
            
        } catch (error) {
            console.error('❌ 构建失败:', error.message);
            console.error(error.stack);
            
            return {
                success: false,
                error: error.message,
                duration: ((Date.now() - startTime) / 1000).toFixed(2)
            };
        }
    }
    
    /**
     * 开发模式（监听文件变化）
     */
    watch() {
        console.log('👀 启动开发模式（文件监听）...');
        
        // 这里可以实现文件监听和热重载
        console.log('开发模式功能待实现');
        console.log('提示: 可以使用 nodemon 或 chokidar 实现文件监听');
        
        return { success: true, mode: 'watch' };
    }
    
    /**
     * 部署到服务器
     */
    deploy(target = 'production') {
        console.log(`🚀 部署到 ${target} 环境...`);
        
        // 这里可以实现部署逻辑
        console.log('部署功能待实现');
        console.log('提示: 可以使用 rsync、scp 或 FTP 实现部署');
        
        return { success: true, target };
    }
}

// 命令行接口
function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'build';
    
    const builder = new Builder(CONFIG);
    
    switch (command) {
        case 'build':
            return builder.build();
            
        case 'clean':
            builder.clean();
            return { success: true };
            
        case 'watch':
            return builder.watch();
            
        case 'deploy':
            const target = args[1] || 'production';
            return builder.deploy(target);
            
        case 'lint':
            return { success: builder.runLint() };
            
        case 'test':
            return { success: builder.runTests() };
            
        case 'version':
            console.log(`当前版本: ${builder.version.full}`);
            console.log(`构建号: ${builder.version.build}`);
            return { success: true, version: builder.version };
            
        case 'help':
        default:
            console.log(`
云信旺店构建工具

用法: node build.js [command]

命令:
  build     执行完整构建（默认）
  clean     清理构建目录
  watch     启动开发模式（监听文件变化）
  deploy    部署到服务器
  lint      运行代码检查
  test      运行测试
  version   显示版本信息
  help      显示帮助信息

示例:
  node build.js           # 执行完整构建
  node build.js clean     # 清理构建目录
  node build.js deploy staging  # 部署到staging环境

环境变量:
  NODE_ENV=production node build.js  # 生产环境构建
            `);
            return { success: true };
    }
}

// 执行
if (require.main === module) {
    const result = main();
    process.exit(result.success ? 0 : 1);
}

module.exports = {
    Builder,
    BuildUtils,
    CONFIG
};