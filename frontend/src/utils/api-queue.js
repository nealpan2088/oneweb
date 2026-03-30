/**
 * API请求队列系统
 * 版本: 1.0.0
 * 日期: 2026-03-30
 * 
 * 功能: 管理API请求队列，避免并发请求导致429限流
 * 特性: 请求排队、延迟控制、错误重试、优先级管理
 */

class ApiQueue {
    constructor(options = {}) {
        // 配置选项
        this.config = {
            delay: options.delay || 500,           // 请求间隔(ms)
            maxRetries: options.maxRetries || 3,   // 最大重试次数
            retryDelay: options.retryDelay || 1000, // 重试延迟(ms)
            timeout: options.timeout || 10000,     // 请求超时(ms)
            debug: options.debug || false,         // 调试模式
            maxQueueSize: options.maxQueueSize || 100, // 最大队列大小
            maxHistorySize: options.maxHistorySize || 100, // 最大历史记录
            cleanupInterval: options.cleanupInterval || 60000 // 清理间隔(ms)
        };
        
        // 队列状态
        this.queue = [];
        this.processing = false;
        this.activeRequests = 0;
        this.maxConcurrent = options.maxConcurrent || 1; // 最大并发数
        
        // 统计信息
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            queuedRequests: 0,
            averageResponseTime: 0,
            memoryUsage: 0,
            cleanupCount: 0
        };
        
        // 请求历史（用于调试）
        this.requestHistory = [];
        
        // 内存管理
        this.cleanupTimer = null;
        
        this.init();
    }
    
    /**
     * 初始化队列
     */
    init() {
        if (this.config.debug) {
            console.log('🔧 API队列系统初始化完成');
            console.log('配置:', this.config);
        }
        
        // 启动内存清理定时器
        this.startCleanupTimer();
    }
    
    /**
     * 启动内存清理定时器
     */
    startCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        
        this.cleanupTimer = setInterval(() => {
            this.cleanupMemory();
        }, this.config.cleanupInterval);
        
        if (this.config.debug) {
            console.log('🧹 内存清理定时器已启动');
        }
    }
    
    /**
     * 清理内存
     */
    cleanupMemory() {
        const beforeSize = this.getMemoryUsage();
        
        // 1. 清理过期的历史记录（保留最近1小时）
        const oneHourAgo = Date.now() - 3600000;
        this.requestHistory = this.requestHistory.filter(
            item => item.timestamp > oneHourAgo
        );
        
        // 2. 限制历史记录数量
        if (this.requestHistory.length > this.config.maxHistorySize) {
            this.requestHistory = this.requestHistory.slice(-this.config.maxHistorySize);
        }
        
        // 3. 清理过期的队列项（超过5分钟）
        const fiveMinutesAgo = Date.now() - 300000;
        let expiredCount = 0;
        
        for (let i = this.queue.length - 1; i >= 0; i--) {
            const item = this.queue[i];
            if (item.addedAt && item.addedAt < fiveMinutesAgo) {
                this.queue.splice(i, 1);
                expiredCount++;
                
                // 拒绝过期的请求
                if (item.reject) {
                    item.reject(new Error('请求已过期（超过5分钟）'));
                }
            }
        }
        
        // 4. 限制队列大小
        if (this.queue.length > this.config.maxQueueSize) {
            const excess = this.queue.length - this.config.maxQueueSize;
            const removedItems = this.queue.splice(0, excess);
            expiredCount += removedItems.length;
            
            removedItems.forEach(item => {
                if (item.reject) {
                    item.reject(new Error('队列溢出，请求被丢弃'));
                }
            });
        }
        
        const afterSize = this.getMemoryUsage();
        this.stats.memoryUsage = afterSize;
        this.stats.cleanupCount++;
        
        if (this.config.debug && (expiredCount > 0 || beforeSize !== afterSize)) {
            console.log(`🧹 内存清理完成: 清理${expiredCount}项, 内存: ${beforeSize} → ${afterSize} bytes`);
        }
        
        return { expiredCount, beforeSize, afterSize };
    }
    
    /**
     * 获取内存使用情况
     */
    getMemoryUsage() {
        try {
            // 估算内存使用
            const queueSize = JSON.stringify(this.queue).length;
            const historySize = JSON.stringify(this.requestHistory).length;
            const statsSize = JSON.stringify(this.stats).length;
            
            return queueSize + historySize + statsSize;
        } catch (e) {
            return 0;
        }
    }
    
    /**
     * 停止清理定时器
     */
    stopCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
            
            if (this.config.debug) {
                console.log('🧹 内存清理定时器已停止');
            }
        }
    }
    
    /**
     * 添加请求到队列
     * @param {Function} requestFn - 请求函数（返回Promise）
     * @param {Object} options - 请求选项
     * @returns {Promise} 请求结果
     */
    async add(requestFn, options = {}) {
        return new Promise((resolve, reject) => {
            const requestId = this.generateRequestId();
            const priority = options.priority || 'normal'; // high, normal, low
            const metadata = options.metadata || {};
            
            const queueItem = {
                id: requestId,
                requestFn,
                resolve,
                reject,
                priority,
                metadata,
                retryCount: 0,
                addedAt: Date.now(),
                status: 'queued'
            };
            
            // 根据优先级插入队列
            this.insertByPriority(queueItem);
            
            this.stats.queuedRequests++;
            this.stats.totalRequests++;
            
            if (this.config.debug) {
                console.log(`📥 请求入队: ${requestId}`, { priority, metadata });
            }
            
            // 记录请求历史
            this.recordRequestHistory({
                id: requestId,
                action: 'queued',
                timestamp: Date.now(),
                priority,
                metadata
            });
            
            // 开始处理队列
            this.processQueue();
            
            // 设置超时
            setTimeout(() => {
                if (queueItem.status === 'queued') {
                    this.cancelRequest(requestId, 'timeout');
                    reject(new Error(`请求超时 (${this.config.timeout}ms)`));
                }
            }, this.config.timeout);
        });
    }
    
    /**
     * 根据优先级插入队列
     */
    insertByPriority(queueItem) {
        const priorities = { high: 0, normal: 1, low: 2 };
        const itemPriority = priorities[queueItem.priority];
        
        let insertIndex = this.queue.length;
        for (let i = 0; i < this.queue.length; i++) {
            const currentPriority = priorities[this.queue[i].priority];
            if (itemPriority < currentPriority) {
                insertIndex = i;
                break;
            }
        }
        
        this.queue.splice(insertIndex, 0, queueItem);
    }
    
    /**
     * 处理队列
     */
    async processQueue() {
        // 检查是否正在处理或队列为空
        if (this.processing || this.queue.length === 0) {
            return;
        }
        
        // 检查是否达到最大并发数
        if (this.activeRequests >= this.maxConcurrent) {
            return;
        }
        
        this.processing = true;
        this.activeRequests++;
        
        // 获取下一个请求（优先级最高的）
        const queueItem = this.queue.shift();
        this.stats.queuedRequests--;
        
        try {
            queueItem.status = 'processing';
            queueItem.startedAt = Date.now();
            
            if (this.config.debug) {
                console.log(`🚀 开始处理请求: ${queueItem.id}`, queueItem.metadata);
            }
            
            // 记录请求历史
            this.recordRequestHistory({
                id: queueItem.id,
                action: 'processing',
                timestamp: Date.now(),
                metadata: queueItem.metadata
            });
            
            // 执行请求
            const result = await queueItem.requestFn();
            
            // 计算响应时间
            const responseTime = Date.now() - queueItem.startedAt;
            this.updateAverageResponseTime(responseTime);
            
            queueItem.status = 'completed';
            queueItem.completedAt = Date.now();
            queueItem.responseTime = responseTime;
            
            this.stats.successfulRequests++;
            
            if (this.config.debug) {
                console.log(`✅ 请求完成: ${queueItem.id}`, { 
                    responseTime: `${responseTime}ms`,
                    result 
                });
            }
            
            // 记录请求历史
            this.recordRequestHistory({
                id: queueItem.id,
                action: 'completed',
                timestamp: Date.now(),
                responseTime,
                metadata: queueItem.metadata
            });
            
            // 返回结果
            queueItem.resolve(result);
            
        } catch (error) {
            queueItem.status = 'failed';
            queueItem.error = error;
            
            this.stats.failedRequests++;
            
            if (this.config.debug) {
                console.error(`❌ 请求失败: ${queueItem.id}`, error);
            }
            
            // 记录请求历史
            this.recordRequestHistory({
                id: queueItem.id,
                action: 'failed',
                timestamp: Date.now(),
                error: error.message,
                metadata: queueItem.metadata
            });
            
            // 检查是否需要重试
            if (queueItem.retryCount < this.config.maxRetries && this.shouldRetry(error)) {
                queueItem.retryCount++;
                
                if (this.config.debug) {
                    console.log(`🔄 重试请求: ${queueItem.id} (${queueItem.retryCount}/${this.config.maxRetries})`);
                }
                
                // 记录重试历史
                this.recordRequestHistory({
                    id: queueItem.id,
                    action: 'retry',
                    timestamp: Date.now(),
                    retryCount: queueItem.retryCount,
                    metadata: queueItem.metadata
                });
                
                // 重新加入队列（降低优先级）
                queueItem.priority = 'low';
                queueItem.status = 'queued';
                this.insertByPriority(queueItem);
                this.stats.queuedRequests++;
                
            } else {
                // 最终失败
                queueItem.reject(error);
            }
        } finally {
            this.activeRequests--;
            this.processing = false;
            
            // 添加延迟后处理下一个请求
            setTimeout(() => {
                this.processQueue();
            }, this.config.delay);
        }
    }
    
    /**
     * 检查是否需要重试
     */
    shouldRetry(error) {
        // 429限流错误应该重试
        if (error.message && error.message.includes('429')) {
            return true;
        }
        
        // 网络错误应该重试
        if (error.message && (
            error.message.includes('Network') || 
            error.message.includes('network') ||
            error.message.includes('timeout')
        )) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 取消请求
     */
    cancelRequest(requestId, reason = 'cancelled') {
        const index = this.queue.findIndex(item => item.id === requestId);
        
        if (index !== -1) {
            const queueItem = this.queue[index];
            this.queue.splice(index, 1);
            this.stats.queuedRequests--;
            
            queueItem.status = 'cancelled';
            queueItem.reject(new Error(`请求已取消: ${reason}`));
            
            if (this.config.debug) {
                console.log(`🚫 请求取消: ${requestId}`, { reason });
            }
            
            // 记录请求历史
            this.recordRequestHistory({
                id: requestId,
                action: 'cancelled',
                timestamp: Date.now(),
                reason,
                metadata: queueItem.metadata
            });
            
            return true;
        }
        
        return false;
    }
    
    /**
     * 清空队列
     */
    clearQueue(reason = 'cleared') {
        const cancelledItems = [...this.queue];
        
        cancelledItems.forEach(item => {
            item.status = 'cancelled';
            item.reject(new Error(`队列已清空: ${reason}`));
        });
        
        this.queue = [];
        this.stats.queuedRequests = 0;
        
        if (this.config.debug) {
            console.log(`🧹 队列已清空: ${cancelledItems.length} 个请求被取消`, { reason });
        }
        
        // 记录清空历史
        this.recordRequestHistory({
            action: 'queue_cleared',
            timestamp: Date.now(),
            reason,
            cancelledCount: cancelledItems.length
        });
        
        return cancelledItems.length;
    }
    
    /**
     * 获取队列状态
     */
    getStatus() {
        return {
            queueLength: this.queue.length,
            activeRequests: this.activeRequests,
            processing: this.processing,
            stats: { ...this.stats },
            config: { ...this.config }
        };
    }
    
    /**
     * 获取请求历史
     */
    getRequestHistory(limit = 20) {
        return this.requestHistory.slice(-limit).reverse();
    }
    
    /**
     * 生成请求ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 记录请求历史
     */
    recordRequestHistory(entry) {
        this.requestHistory.push(entry);
        
        // 限制历史记录大小
        if (this.requestHistory.length > this.maxHistorySize) {
            this.requestHistory = this.requestHistory.slice(-this.maxHistorySize);
        }
    }
    
    /**
     * 更新平均响应时间
     */
    updateAverageResponseTime(newTime) {
        if (this.stats.averageResponseTime === 0) {
            this.stats.averageResponseTime = newTime;
        } else {
            // 加权平均
            this.stats.averageResponseTime = 
                (this.stats.averageResponseTime * 0.7) + (newTime * 0.3);
        }
    }
    
    /**
     * 重置统计信息
     */
    resetStats() {
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            queuedRequests: 0,
            averageResponseTime: 0,
            memoryUsage: 0,
            cleanupCount: 0
        };
        
        if (this.config.debug) {
            console.log('📊 统计信息已重置');
        }
    }
    
    /**
     * 销毁队列实例
     */
    destroy() {
        // 1. 停止清理定时器
        this.stopCleanupTimer();
        
        // 2. 清空队列（拒绝所有待处理请求）
        const pendingCount = this.queue.length;
        this.queue.forEach(item => {
            if (item.reject) {
                item.reject(new Error('队列已销毁'));
            }
        });
        this.queue = [];
        
        // 3. 清空历史记录
        this.requestHistory = [];
        
        // 4. 重置状态
        this.processing = false;
        this.activeRequests = 0;
        
        // 5. 重置统计
        this.resetStats();
        
        if (this.config.debug) {
            console.log(`🧹 队列已销毁: 清理${pendingCount}个待处理请求`);
        }
        
        return { destroyed: true, pendingRequestsCleared: pendingCount };
    }
    
    /**
     * 设置配置
     */
    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        if (this.config.debug) {
            console.log('⚙️ 配置已更新:', this.config);
        }
    }
}

/**
 * 全局API队列实例
 */
let globalApiQueue = null;

/**
 * 获取或创建全局API队列
 */
function getApiQueue(options = {}) {
    if (!globalApiQueue) {
        globalApiQueue = new ApiQueue(options);
        
        // 通过命名空间暴露，而不是直接挂载到window
        if (typeof window !== 'undefined') {
            // 尝试注册到命名空间
            try {
                if (window.registerModule) {
                    window.registerModule('apiQueue', globalApiQueue);
                } else if (window.WangDian) {
                    window.WangDian.modules = window.WangDian.modules || {};
                    window.WangDian.modules.apiQueue = globalApiQueue;
                }
            } catch (e) {
                console.warn('注册API队列到命名空间失败:', e);
            }
        }
    }
    
    return globalApiQueue;
}

/**
 * 包装API调用函数
 */
function createQueuedApiCall(apiCallFn, options = {}) {
    const queue = getApiQueue();
    
    return async function(...args) {
        return queue.add(() => apiCallFn(...args), options);
    };
}

/**
 * 创建带队列的fetch包装器
 */
function createQueuedFetch(options = {}) {
    const queue = getApiQueue();
    
    return async function(url, fetchOptions = {}) {
        return queue.add(async () => {
            const response = await fetch(url, fetchOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // 根据Content-Type返回相应格式
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            }
            
            return response.text();
        }, options);
    };
}

// 通过命名空间导出
if (typeof window !== 'undefined') {
    // 注册到命名空间
    try {
        if (window.registerModule) {
            window.registerModule('ApiQueue', ApiQueue);
            window.registerUtil('getApiQueue', getApiQueue);
            window.registerUtil('createQueuedApiCall', createQueuedApiCall);
            window.registerUtil('createQueuedFetch', createQueuedFetch);
        } else {
            // 回退方案：使用单一全局变量
            window.WangDian = window.WangDian || {};
            window.WangDian.ApiQueue = ApiQueue;
            window.WangDian.getApiQueue = getApiQueue;
            window.WangDian.createQueuedApiCall = createQueuedApiCall;
            window.WangDian.createQueuedFetch = createQueuedFetch;
        }
    } catch (e) {
        console.error('导出API队列模块失败:', e);
    }
}

export {
    ApiQueue,
    getApiQueue,
    createQueuedApiCall,
    createQueuedFetch
};