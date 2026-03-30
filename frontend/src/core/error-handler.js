/**
 * 统一错误处理模块
 * 版本: 1.0.0
 * 日期: 2026-03-30
 * 
 * 功能: 集中处理所有错误，提供统一的错误处理机制
 * 原则: 错误不丢失，用户友好，便于调试
 */

class ErrorHandler {
    constructor(options = {}) {
        this.config = {
            // 错误处理配置
            logToConsole: options.logToConsole !== false,
            showUserAlert: options.showUserAlert || false,
            alertLevel: options.alertLevel || 'error', // error, warn, info
            maxErrors: options.maxErrors || 100,
            
            // 错误上报配置
            enableReporting: options.enableReporting || false,
            reportUrl: options.reportUrl || '',
            reportSampleRate: options.reportSampleRate || 0.1, // 10%采样
            
            // 错误分类配置
            errorCategories: {
                network: ['NetworkError', 'TimeoutError', 'Failed to fetch'],
                api: ['HTTP 4', 'HTTP 5'],
                validation: ['Invalid', 'Missing', 'Required'],
                security: ['SecurityError', 'Permission denied'],
                business: ['Business logic error']
            }
        };
        
        // 错误存储
        this.errors = [];
        this.errorCounters = {};
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化错误处理
     */
    init() {
        // 1. 捕获未处理的Promise错误
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, {
                type: 'unhandledrejection',
                timestamp: new Date().toISOString()
            });
        });
        
        // 2. 捕获全局错误
        window.addEventListener('error', (event) => {
            this.handleError(event.error || event.message, {
                type: 'global',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                timestamp: new Date().toISOString()
            });
        });
        
        // 3. 捕获控制台错误（覆盖console.error）
        this.overrideConsoleError();
        
        console.log('🔧 错误处理系统初始化完成');
    }
    
    /**
     * 覆盖console.error以捕获所有错误
     */
    overrideConsoleError() {
        const originalError = console.error;
        
        console.error = (...args) => {
            // 调用原始方法
            originalError.apply(console, args);
            
            // 捕获错误
            const error = args.find(arg => arg instanceof Error) || 
                         new Error(args.map(arg => 
                             typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                         ).join(' '));
            
            this.handleError(error, {
                type: 'console',
                originalArgs: args,
                timestamp: new Date().toISOString()
            });
        };
        
        // 保存原始方法以便恢复
        console.error.original = originalError;
    }
    
    /**
     * 处理错误
     */
    handleError(error, context = {}) {
        // 创建错误记录
        const errorRecord = this.createErrorRecord(error, context);
        
        // 存储错误
        this.storeError(errorRecord);
        
        // 更新计数器
        this.updateErrorCounters(errorRecord);
        
        // 控制台日志
        if (this.config.logToConsole) {
            this.logToConsole(errorRecord);
        }
        
        // 用户提示
        if (this.config.showUserAlert && this.shouldShowAlert(errorRecord)) {
            this.showUserAlert(errorRecord);
        }
        
        // 错误上报
        if (this.config.enableReporting && this.shouldReport(errorRecord)) {
            this.reportError(errorRecord);
        }
        
        // 触发错误事件
        this.triggerErrorEvent(errorRecord);
        
        return errorRecord;
    }
    
    /**
     * 创建错误记录
     */
    createErrorRecord(error, context) {
        const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 提取错误信息
        let message, stack, name;
        
        if (error instanceof Error) {
            message = error.message;
            stack = error.stack;
            name = error.name;
        } else if (typeof error === 'string') {
            message = error;
            stack = new Error().stack;
            name = 'StringError';
        } else {
            message = String(error);
            stack = new Error().stack;
            name = 'UnknownError';
        }
        
        // 分类错误
        const category = this.categorizeError(message);
        const severity = this.determineSeverity(category, message);
        
        return {
            id: errorId,
            message,
            stack,
            name,
            category,
            severity,
            timestamp: new Date().toISOString(),
            context: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                ...context
            },
            handled: false,
            resolved: false
        };
    }
    
    /**
     * 分类错误
     */
    categorizeError(message) {
        const categories = this.config.errorCategories;
        
        for (const [category, keywords] of Object.entries(categories)) {
            for (const keyword of keywords) {
                if (message.includes(keyword)) {
                    return category;
                }
            }
        }
        
        return 'unknown';
    }
    
    /**
     * 确定错误严重性
     */
    determineSeverity(category, message) {
        const severityMap = {
            security: 'critical',
            network: 'high',
            api: message.includes('HTTP 5') ? 'high' : 'medium',
            validation: 'low',
            business: 'medium',
            unknown: 'medium'
        };
        
        return severityMap[category] || 'medium';
    }
    
    /**
     * 存储错误
     */
    storeError(errorRecord) {
        this.errors.push(errorRecord);
        
        // 限制错误数量
        if (this.errors.length > this.config.maxErrors) {
            this.errors = this.errors.slice(-this.config.maxErrors);
        }
    }
    
    /**
     * 更新错误计数器
     */
    updateErrorCounters(errorRecord) {
        const key = `${errorRecord.category}.${errorRecord.severity}`;
        this.errorCounters[key] = (this.errorCounters[key] || 0) + 1;
    }
    
    /**
     * 控制台日志
     */
    logToConsole(errorRecord) {
        const styles = {
            critical: 'color: #dc2626; font-weight: bold;',
            high: 'color: #ea580c;',
            medium: 'color: #ca8a04;',
            low: 'color: #16a34a;'
        };
        
        console.groupCollapsed(
            `%c❌ ${errorRecord.category.toUpperCase()} ${errorRecord.severity.toUpperCase()}: ${errorRecord.message}`,
            styles[errorRecord.severity] || styles.medium
        );
        
        console.log('错误ID:', errorRecord.id);
        console.log('时间:', errorRecord.timestamp);
        console.log('上下文:', errorRecord.context);
        
        if (errorRecord.stack) {
            console.log('堆栈:', errorRecord.stack);
        }
        
        console.groupEnd();
    }
    
    /**
     * 判断是否应该显示用户提示
     */
    shouldShowAlert(errorRecord) {
        // 根据配置的提示级别决定
        const severityLevels = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1
        };
        
        const configLevel = severityLevels[this.config.alertLevel] || 2;
        const errorLevel = severityLevels[errorRecord.severity] || 2;
        
        return errorLevel >= configLevel;
    }
    
    /**
     * 显示用户提示
     */
    showUserAlert(errorRecord) {
        // 创建用户友好的错误消息
        const userMessages = {
            network: '网络连接失败，请检查网络后重试',
            api: '服务器暂时不可用，请稍后重试',
            security: '安全检查失败，请刷新页面',
            validation: '输入信息有误，请检查后重试',
            business: '操作失败，请稍后重试',
            unknown: '系统错误，请刷新页面重试'
        };
        
        const message = userMessages[errorRecord.category] || userMessages.unknown;
        
        // 显示提示（可以根据需要改为更友好的UI）
        if (this.config.showUserAlert === 'toast') {
            this.showToast(message);
        } else if (this.config.showUserAlert === 'modal') {
            this.showModal(message);
        } else {
            // 默认使用alert
            console.warn('用户提示:', message);
            // 在实际应用中，应该使用更友好的UI组件
        }
    }
    
    /**
     * 显示Toast提示
     */
    showToast(message) {
        // 创建Toast元素
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc2626;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // 3秒后自动消失
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
    /**
     * 显示模态框
     */
    showModal(message) {
        // 在实际应用中实现模态框
        console.log('显示错误模态框:', message);
    }
    
    /**
     * 判断是否应该上报错误
     */
    shouldReport(errorRecord) {
        // 采样率控制
        if (Math.random() > this.config.reportSampleRate) {
            return false;
        }
        
        // 严重错误总是上报
        if (errorRecord.severity === 'critical') {
            return true;
        }
        
        // 高频错误上报
        const key = `${errorRecord.category}.${errorRecord.severity}`;
        const count = this.errorCounters[key] || 0;
        
        return count <= 10 || count % 10 === 0; // 前10次或每10次上报一次
    }
    
    /**
     * 上报错误
     */
    reportError(errorRecord) {
        if (!this.config.reportUrl) {
            return;
        }
        
        const reportData = {
            errorId: errorRecord.id,
            message: errorRecord.message,
            category: errorRecord.category,
            severity: errorRecord.severity,
            timestamp: errorRecord.timestamp,
            userAgent: navigator.userAgent,
            url: window.location.href,
            appVersion: '1.0.0'
        };
        
        // 使用sendBeacon或fetch上报
        if (navigator.sendBeacon) {
            navigator.sendBeacon(
                this.config.reportUrl,
                new Blob([JSON.stringify(reportData)], { type: 'application/json' })
            );
        } else {
            fetch(this.config.reportUrl, {
                method: 'POST',
                body: JSON.stringify(reportData),
                headers: { 'Content-Type': 'application/json' },
                keepalive: true // 确保在页面卸载时也能发送
            }).catch(() => {
                // 静默失败
            });
        }
    }
    
    /**
     * 触发错误事件
     */
    triggerErrorEvent(errorRecord) {
        const event = new CustomEvent('error:occurred', {
            detail: errorRecord
        });
        window.dispatchEvent(event);
    }
    
    /**
     * 标记错误为已处理
     */
    markAsHandled(errorId) {
        const error = this.errors.find(e => e.id === errorId);
        if (error) {
            error.handled = true;
            error.handledAt = new Date().toISOString();
            return true;
        }
        return false;
    }
    
    /**
     * 标记错误为已解决
     */
    markAsResolved(errorId) {
        const error = this.errors.find(e => e.id === errorId);
        if (error) {
            error.resolved = true;
            error.resolvedAt = new Date().toISOString();
            return true;
        }
        return false;
    }
    
    /**
     * 获取错误统计
     */
    getErrorStats() {
        const now = new Date();
        const oneHourAgo = new Date(now - 3600000);
        const oneDayAgo = new Date(now - 86400000);
        
        const recentErrors = this.errors.filter(e => 
            new Date(e.timestamp) > oneHourAgo
        );
        
        const dailyErrors = this.errors.filter(e => 
            new Date(e.timestamp) > oneDayAgo
        );
        
        return {
            total: this.errors.length,
            recent: recentErrors.length,
            daily: dailyErrors.length,
            byCategory: this.errorCounters,
            unresolved: this.errors.filter(e => !e.resolved).length,
            unhandled: this.errors.filter(e => !e.handled).length
        };
    }
    
    /**
     * 获取错误列表
     */
    getErrors(filter = {}) {
        let filtered = [...this.errors];
        
        if (filter.category) {
            filtered = filtered.filter(e => e.category === filter.category);
        }
        
        if (filter.severity) {
            filtered = filtered.filter(e => e.severity === filter.severity);
        }
        
        if (filter.unresolved) {
            filtered = filtered.filter(e => !e.resolved);
        }
        
        if (filter.unhandled) {
            filtered = filtered.filter(e => !e.handled);
        }
        
        if (filter.limit) {
            filtered = filtered.slice(-filter.limit).reverse();
        } else {
            filtered = filtered.reverse();
        }
        
        return filtered;
    }
    
    /**
     * 清除错误记录
     */
    clearErrors() {
        const count = this.errors.length;
        this.errors = [];
        this.errorCounters = {};
        return count;
    }
    
    /**
     * 销毁错误处理器
     */
    destroy() {
        // 恢复原始console.error
        if (console.error.original) {
            console.error = console.error.original;
        }
        
        // 移除事件监听器
        window.removeEventListener('unhandledrejection', this.handleError);
        window.removeEventListener('error', this.handleError);
        
        // 清空错误记录
        this.clearErrors();
        
        console.log('🧹 错误处理系统已销毁');
    }
}

// 创建全局错误处理器实例
let errorHandlerInstance = null;

/**
 * 获取错误处理器（单例模式）
 */
function getErrorHandler(options = {}) {
    if (!errorHandlerInstance) {
        errorHandlerInstance = new ErrorHandler(options);
        
        // 注册到命名空间
        if (typeof window !== 'undefined') {
            try {
                if (window.registerModule) {
                    window.registerModule('ErrorHandler', errorHandlerInstance);
                } else if (window.WangDian) {
                    window.WangDian.modules = window.WangDian.modules || {};
                    window.WangDian.modules.ErrorHandler = errorHandlerInstance;
                }
            } catch (e) {
                console.warn('注册错误处理器失败:', e);
            }
        }
    }
    return errorHandlerInstance;
}

/**
 * 快捷错误处理函数
 */
function handleError(error, context = {}) {
    const handler = getErrorHandler();
    return handler.handleError(error, context);
}

/**
 * 安全执行函数（自动错误处理）
 */
function safeExecute(fn, context = {}) {
    try {
        const result = fn();
        if (result && typeof result.then === 'function') {
            // 处理Promise
            return result.catch(error => {
                handleError(error, { ...context, type: 'async' });
                throw error; // 重新抛出以便调用者处理
            });
        }
        return result;
    } catch (error) {
        handleError(error, { ...context, type: 'sync' });
        throw error; // 重新抛出以便调用者处理
    }
}

// 导出
if (typeof window !== 'undefined') {
    try {
        if (window.registerModule) {
            window.registerModule('ErrorHandler', getErrorHandler());
            window.registerUtil('handleError', handleError);
            window.registerUtil('safeExecute', safeExecute);
        } else if (window.WangDian) {
            window.WangDian.modules = window.WangDian.modules || {};
            window.WangDian.modules.ErrorHandler = getErrorHandler();
            window.WangDian.utils = window.WangDian.utils || {};
            window.WangDian.utils.handleError = handleError;
            window.WangDian.utils.safeExecute = safeExecute;
        }
    } catch (e) {
        console.warn('导出错误处理模块失败:', e);
    }
}

export {
    ErrorHandler,
    getErrorHandler,
    handleError,
    safeExecute
};