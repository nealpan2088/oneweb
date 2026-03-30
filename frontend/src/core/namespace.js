/**
 * 统一命名空间模块
 * 版本: 1.0.0
 * 日期: 2026-03-30
 * 
 * 功能: 管理全局命名空间，避免全局变量污染
 * 原则: 单一入口，命名清晰，易于扩展
 */

class NamespaceManager {
    constructor() {
        // 主命名空间
        this.namespace = {
            // 版本信息
            version: '1.0.0',
            buildDate: '2026-03-30',
            
            // 核心模块占位符
            modules: {},
            
            // 工具函数
            utils: {},
            
            // 配置
            config: null,
            
            // 状态
            initialized: false,
            
            // 错误处理
            errors: [],
            
            // 事件系统
            events: {
                listeners: {},
                emit(event, data) {
                    const listeners = this.listeners[event] || [];
                    listeners.forEach(callback => callback(data));
                },
                on(event, callback) {
                    if (!this.listeners[event]) this.listeners[event] = [];
                    this.listeners[event].push(callback);
                },
                off(event, callback) {
                    if (!this.listeners[event]) return;
                    const index = this.listeners[event].indexOf(callback);
                    if (index > -1) this.listeners[event].splice(index, 1);
                }
            }
        };
        
        this.init();
    }
    
    /**
     * 初始化命名空间
     */
    init() {
        console.log('🔧 初始化命名空间管理系统');
        
        // 设置全局变量（唯一允许的全局变量）
        if (typeof window !== 'undefined') {
            // 检查是否已存在（避免冲突）
            if (window.WangDian && window.WangDian !== this.namespace) {
                console.warn('⚠️ WangDian命名空间已存在，可能发生冲突');
                this.namespace.conflict = true;
            }
            
            window.WangDian = this.namespace;
            Object.freeze(window.WangDian); // 防止外部修改
            
            // 添加版本信息到控制台
            console.log(`🏪 云信旺店 v${this.namespace.version} (${this.namespace.buildDate})`);
        }
    }
    
    /**
     * 注册模块
     */
    registerModule(name, module) {
        if (this.namespace.modules[name]) {
            console.warn(`模块 "${name}" 已存在，将被覆盖`);
        }
        
        this.namespace.modules[name] = module;
        console.log(`✅ 模块注册: ${name}`);
        
        // 触发模块注册事件
        this.namespace.events.emit('module:registered', { name, module });
        
        return module;
    }
    
    /**
     * 获取模块
     */
    getModule(name) {
        const module = this.namespace.modules[name];
        if (!module) {
            console.warn(`模块 "${name}" 不存在`);
            return null;
        }
        return module;
    }
    
    /**
     * 检查模块是否存在
     */
    hasModule(name) {
        return !!this.namespace.modules[name];
    }
    
    /**
     * 注册工具函数
     */
    registerUtil(name, util) {
        if (typeof util !== 'function') {
            throw new Error(`工具 "${name}" 必须是一个函数`);
        }
        
        this.namespace.utils[name] = util;
        console.log(`🔧 工具注册: ${name}`);
        
        return util;
    }
    
    /**
     * 获取工具函数
     */
    getUtil(name) {
        const util = this.namespace.utils[name];
        if (!util) {
            console.warn(`工具 "${name}" 不存在`);
            return null;
        }
        return util;
    }
    
    /**
     * 设置配置
     */
    setConfig(config) {
        this.namespace.config = config;
        console.log('⚙️ 配置已设置');
        
        // 触发配置更新事件
        this.namespace.events.emit('config:updated', { config });
    }
    
    /**
     * 获取配置
     */
    getConfig() {
        if (!this.namespace.config) {
            console.warn('配置未设置');
            return null;
        }
        return this.namespace.config;
    }
    
    /**
     * 记录错误
     */
    recordError(error, context = {}) {
        const errorEntry = {
            id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            resolved: false
        };
        
        this.namespace.errors.push(errorEntry);
        
        // 限制错误记录数量
        if (this.namespace.errors.length > 100) {
            this.namespace.errors = this.namespace.errors.slice(-100);
        }
        
        // 触发错误事件
        this.namespace.events.emit('error:recorded', errorEntry);
        
        console.error('❌ 错误记录:', errorEntry);
        
        return errorEntry;
    }
    
    /**
     * 获取错误记录
     */
    getErrors(limit = 20) {
        return this.namespace.errors.slice(-limit).reverse();
    }
    
    /**
     * 标记错误为已解决
     */
    resolveError(errorId) {
        const error = this.namespace.errors.find(e => e.id === errorId);
        if (error) {
            error.resolved = true;
            error.resolvedAt = new Date().toISOString();
            this.namespace.events.emit('error:resolved', error);
            return true;
        }
        return false;
    }
    
    /**
     * 获取命名空间状态
     */
    getStatus() {
        return {
            version: this.namespace.version,
            buildDate: this.namespace.buildDate,
            moduleCount: Object.keys(this.namespace.modules).length,
            utilCount: Object.keys(this.namespace.utils).length,
            errorCount: this.namespace.errors.length,
            unresolvedErrors: this.namespace.errors.filter(e => !e.resolved).length,
            initialized: this.namespace.initialized,
            conflict: this.namespace.conflict || false
        };
    }
    
    /**
     * 初始化完成
     */
    markInitialized() {
        this.namespace.initialized = true;
        this.namespace.events.emit('namespace:initialized', this.getStatus());
        console.log('🎉 命名空间初始化完成');
    }
    
    /**
     * 销毁命名空间（清理）
     */
    destroy() {
        // 清理事件监听器
        this.namespace.events.listeners = {};
        
        // 清理模块
        Object.keys(this.namespace.modules).forEach(name => {
            const module = this.namespace.modules[name];
            if (module && typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        
        this.namespace.modules = {};
        this.namespace.utils = {};
        
        // 从window移除
        if (typeof window !== 'undefined' && window.WangDian === this.namespace) {
            delete window.WangDian;
        }
        
        console.log('🧹 命名空间已清理');
    }
    
    /**
     * 安全检查
     */
    securityCheck() {
        const checks = {
            globalPollution: this.checkGlobalPollution(),
            moduleSecurity: this.checkModuleSecurity(),
            configSecurity: this.checkConfigSecurity()
        };
        
        const issues = Object.entries(checks)
            .filter(([_, result]) => !result.passed)
            .map(([name, result]) => ({ name, ...result }));
        
        if (issues.length > 0) {
            console.warn('⚠️ 安全检查发现问题:', issues);
            this.namespace.events.emit('security:issues', issues);
        } else {
            console.log('✅ 安全检查通过');
        }
        
        return { checks, issues };
    }
    
    /**
     * 检查全局污染
     */
    checkGlobalPollution() {
        const allowedGlobals = ['WangDian', 'console', 'window', 'document', 'navigator'];
        const unexpectedGlobals = [];
        
        // 检查是否有意外的全局变量
        for (const key in window) {
            if (key.startsWith('WangDian') && !allowedGlobals.includes(key)) {
                unexpectedGlobals.push(key);
            }
        }
        
        return {
            passed: unexpectedGlobals.length === 0,
            unexpectedGlobals
        };
    }
    
    /**
     * 检查模块安全
     */
    checkModuleSecurity() {
        const modules = Object.keys(this.namespace.modules);
        const insecureModules = [];
        
        modules.forEach(name => {
            const module = this.namespace.modules[name];
            // 检查模块是否有潜在的安全问题
            if (module && typeof module === 'object') {
                // 这里可以添加更多的安全检查
                if (module._insecure) {
                    insecureModules.push(name);
                }
            }
        });
        
        return {
            passed: insecureModules.length === 0,
            insecureModules
        };
    }
    
    /**
     * 检查配置安全
     */
    checkConfigSecurity() {
        const config = this.namespace.config;
        if (!config) {
            return { passed: true, message: '配置未设置' };
        }
        
        const issues = [];
        
        // 检查硬编码密码
        if (config.wifi && config.wifi.defaultPassword === '88888888') {
            issues.push('使用默认WiFi密码');
        }
        
        // 检查API端点安全性
        if (config.api && config.api.baseUrl && !config.api.baseUrl.startsWith('https://')) {
            issues.push('API未使用HTTPS');
        }
        
        return {
            passed: issues.length === 0,
            issues
        };
    }
}

// 创建命名空间管理器实例
let namespaceInstance = null;

/**
 * 获取命名空间管理器（单例模式）
 */
function getNamespace() {
    if (!namespaceInstance) {
        namespaceInstance = new NamespaceManager();
    }
    return namespaceInstance;
}

/**
 * 快捷方式函数
 */
function registerModule(name, module) {
    return getNamespace().registerModule(name, module);
}

function getModule(name) {
    return getNamespace().getModule(name);
}

function registerUtil(name, util) {
    return getNamespace().registerUtil(name, util);
}

function getUtil(name) {
    return getNamespace().getUtil(name);
}

// 导出
if (typeof window !== 'undefined') {
    // 只暴露必要的函数
    window.getNamespace = getNamespace;
    window.registerModule = registerModule;
    window.getModule = getModule;
    window.registerUtil = registerUtil;
    window.getUtil = getUtil;
}

export {
    NamespaceManager,
    getNamespace,
    registerModule,
    getModule,
    registerUtil,
    getUtil
};