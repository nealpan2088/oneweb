/**
 * 统一配置管理模块
 * 版本: 1.0.0
 * 日期: 2026-03-30
 * 
 * 功能: 集中管理所有配置，避免硬编码敏感信息
 * 原则: 安全第一，环境隔离，易于维护
 */

class ConfigManager {
    constructor() {
        // 默认配置（开发环境）
        this.defaultConfig = {
            // API配置
            api: {
                baseUrl: 'http://localhost:3000',
                timeout: 10000,
                maxRetries: 3,
                retryDelay: 1000
            },
            
            // WiFi配置（生产环境应该从环境变量读取）
            wifi: {
                defaultSsid: 'WangCafe_Guest',
                defaultPassword: this.getWifiPassword(), // 动态获取
                showButton: true
            },
            
            // 店铺默认配置
            shop: {
                defaultId: 3,
                defaultName: '旺财咖啡馆',
                defaultIndustry: '餐饮',
                defaultPhone: '138-0013-8000',
                defaultWechat: 'wangcai_coffee'
            },
            
            // 安全配置
            security: {
                enableCsp: false, // 内容安全策略
                enableHsts: false, // HTTP严格传输安全
                sanitizeInput: true // 输入过滤
            },
            
            // 性能配置
            performance: {
                cacheDuration: 3600000, // 1小时
                maxQueueSize: 100,
                cleanupInterval: 60000 // 1分钟清理一次
            },
            
            // 调试配置
            debug: {
                enabled: false,
                logLevel: 'warn', // error, warn, info, debug
                showMonitor: false
            }
        };
        
        // 环境特定配置
        this.environmentConfigs = {
            development: {
                api: { baseUrl: 'http://localhost:3000' },
                debug: { enabled: true, logLevel: 'debug', showMonitor: true }
            },
            staging: {
                api: { baseUrl: 'http://staging.example.com' },
                debug: { enabled: true, logLevel: 'info' }
            },
            production: {
                api: { baseUrl: 'https://api.yunxinwangdian.com' },
                security: { enableCsp: true, enableHsts: true },
                debug: { enabled: false, logLevel: 'error' }
            }
        };
        
        this.currentConfig = null;
        this.init();
    }
    
    /**
     * 初始化配置
     */
    init() {
        // 1. 确定当前环境
        const env = this.detectEnvironment();
        
        // 2. 合并配置
        this.currentConfig = this.mergeConfigs(
            this.defaultConfig,
            this.environmentConfigs[env] || {}
        );
        
        // 3. 应用环境变量覆盖
        this.applyEnvironmentVariables();
        
        // 4. 验证配置
        this.validateConfig();
        
        console.log(`🔧 配置初始化完成 - 环境: ${env}`);
    }
    
    /**
     * 检测当前环境
     */
    detectEnvironment() {
        // 从URL参数检测
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('env') === 'production') return 'production';
        if (urlParams.get('env') === 'staging') return 'staging';
        
        // 从主机名检测
        const hostname = window.location.hostname;
        if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
            return 'development';
        }
        if (hostname.includes('staging.')) {
            return 'staging';
        }
        if (hostname.includes('yunxinwangdian.com')) {
            return 'production';
        }
        
        // 默认开发环境
        return 'development';
    }
    
    /**
     * 合并配置
     */
    mergeConfigs(base, override) {
        const result = JSON.parse(JSON.stringify(base));
        
        const mergeDeep = (target, source) => {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    mergeDeep(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
            return target;
        };
        
        return mergeDeep(result, override);
    }
    
    /**
     * 应用环境变量
     */
    applyEnvironmentVariables() {
        // 从全局变量读取环境配置
        if (window.__ENV__) {
            Object.assign(this.currentConfig, window.__ENV__);
        }
        
        // 从data属性读取
        const configElement = document.getElementById('app-config');
        if (configElement && configElement.dataset.config) {
            try {
                const dataConfig = JSON.parse(configElement.dataset.config);
                Object.assign(this.currentConfig, dataConfig);
            } catch (e) {
                console.warn('解析data-config失败:', e);
            }
        }
    }
    
    /**
     * 验证配置
     */
    validateConfig() {
        const requiredFields = [
            'api.baseUrl',
            'wifi.defaultPassword'
        ];
        
        const errors = [];
        
        requiredFields.forEach(field => {
            const value = this.get(field);
            if (value === undefined || value === null || value === '') {
                errors.push(`缺少必要配置: ${field}`);
            }
        });
        
        // 检查密码安全性
        const wifiPassword = this.get('wifi.defaultPassword');
        if (wifiPassword === '88888888' || wifiPassword === 'password' || wifiPassword.length < 8) {
            console.warn('⚠️ WiFi密码安全性不足，建议在生产环境修改');
        }
        
        if (errors.length > 0) {
            console.error('配置验证失败:', errors);
            throw new Error(`配置验证失败: ${errors.join(', ')}`);
        }
    }
    
    /**
     * 获取WiFi密码（安全方式）
     */
    getWifiPassword() {
        // 优先级: 环境变量 > localStorage > 默认值
        if (window.__ENV__ && window.__ENV__.WIFI_PASSWORD) {
            return window.__ENV__.WIFI_PASSWORD;
        }
        
        try {
            const storedPassword = localStorage.getItem('wifi_password');
            if (storedPassword) {
                // 简单解密（实际生产环境应该使用更安全的加密）
                return this.simpleDecrypt(storedPassword);
            }
        } catch (e) {
            console.warn('读取存储的WiFi密码失败:', e);
        }
        
        // 开发环境默认值（生产环境必须配置）
        return this.isProduction() ? '' : '88888888';
    }
    
    /**
     * 简单加密（仅示例，生产环境应使用强加密）
     */
    simpleEncrypt(text) {
        return btoa(unescape(encodeURIComponent(text)));
    }
    
    /**
     * 简单解密（仅示例）
     */
    simpleDecrypt(encrypted) {
        try {
            return decodeURIComponent(escape(atob(encrypted)));
        } catch (e) {
            return encrypted; // 解密失败返回原值
        }
    }
    
    /**
     * 检查是否为生产环境
     */
    isProduction() {
        return this.detectEnvironment() === 'production';
    }
    
    /**
     * 获取配置值
     */
    get(path, defaultValue = null) {
        const parts = path.split('.');
        let value = this.currentConfig;
        
        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }
    
    /**
     * 设置配置值
     */
    set(path, value) {
        const parts = path.split('.');
        let config = this.currentConfig;
        
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!(part in config)) {
                config[part] = {};
            }
            config = config[part];
        }
        
        config[parts[parts.length - 1]] = value;
        
        // 触发配置变更事件
        this.triggerChange(path, value);
    }
    
    /**
     * 触发配置变更事件
     */
    triggerChange(path, value) {
        const event = new CustomEvent('config:change', {
            detail: { path, value }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * 获取完整配置
     */
    getAll() {
        return JSON.parse(JSON.stringify(this.currentConfig));
    }
    
    /**
     * 重置为默认配置
     */
    reset() {
        this.currentConfig = JSON.parse(JSON.stringify(this.defaultConfig));
        console.log('配置已重置为默认值');
    }
    
    /**
     * 导出配置供其他模块使用
     */
    exportForModules() {
        return {
            api: this.get('api'),
            wifi: this.get('wifi'),
            shop: this.get('shop'),
            security: this.get('security'),
            performance: this.get('performance'),
            debug: this.get('debug')
        };
    }
}

// 创建全局配置实例
let configInstance = null;

/**
 * 获取配置实例（单例模式）
 */
function getConfig() {
    if (!configInstance) {
        configInstance = new ConfigManager();
        
        // 暴露到window（仅一个全局变量）
        if (typeof window !== 'undefined') {
            window.WangDianConfig = configInstance;
        }
    }
    return configInstance;
}

/**
 * 快捷方式函数
 */
function config(path, defaultValue) {
    return getConfig().get(path, defaultValue);
}

// 导出
if (typeof window !== 'undefined') {
    window.getConfig = getConfig;
    window.config = config;
}

export {
    ConfigManager,
    getConfig,
    config
};