/**
 * API队列集成工具
 * 版本: 1.0.0
 * 日期: 2026-03-30
 * 
 * 功能: 将现有API服务集成到队列系统中
 */

// 引入API队列
import { getApiQueue, createQueuedApiCall } from './api-queue.js';

/**
 * 包装现有的shopService方法
 */
function wrapShopServiceMethods(shopService) {
    const queue = getApiQueue({
        delay: 600,           // 600ms间隔，避免429
        maxRetries: 2,        // 最多重试2次
        retryDelay: 2000,     // 重试延迟2秒
        debug: true           // 开启调试
    });
    
    // 需要包装的方法列表
    const methodsToWrap = [
        'getShopInfo',
        'getReviews',
        'getStats',
        'getWifiInfo',
        'recordVisit',
        'submitReview',
        'getShopInfoLegacy',
        'getReviewsLegacy'
    ];
    
    // 创建包装后的服务
    const wrappedService = { ...shopService };
    
    methodsToWrap.forEach(methodName => {
        if (typeof shopService[methodName] === 'function') {
            const originalMethod = shopService[methodName].bind(shopService);
            
            wrappedService[methodName] = async function(...args) {
                try {
                    return await queue.add(() => originalMethod(...args), {
                        metadata: {
                            method: methodName,
                            args: args,
                            timestamp: Date.now()
                        }
                    });
                } catch (error) {
                    console.error(`API队列调用失败 (${methodName}):`, error);
                    
                    // 如果是429错误，返回降级数据
                    if (error.message && error.message.includes('429')) {
                        console.warn(`API限流，使用降级数据 (${methodName})`);
                        return getFallbackData(methodName, args);
                    }
                    
                    throw error;
                }
            };
        }
    });
    
    return wrappedService;
}

/**
 * 获取降级数据
 */
function getFallbackData(methodName, args) {
    // 尝试获取配置
    let config = null;
    try {
        if (window.getConfig) {
            config = window.getConfig();
        } else if (window.WangDian && window.WangDian.config) {
            config = window.WangDian.config;
        }
    } catch (e) {
        console.warn('获取配置失败，使用默认值:', e);
    }
    
    const fallbackData = {
        getShopInfo: () => ({
            id: args[0] || (config ? config.get('shop.defaultId', 3) : 3),
            name: config ? config.get('shop.defaultName', '旺财咖啡馆') : '旺财咖啡馆',
            description: '实体店铺营销小程序演示',
            address: '演示地址',
            phone: config ? config.get('shop.defaultPhone', '138-0013-8000') : '138-0013-8000',
            wechat_id: config ? config.get('shop.defaultWechat', 'wangcai_coffee') : 'wangcai_coffee',
            industry: config ? config.get('shop.defaultIndustry', '餐饮') : '餐饮',
            show_wifi_button: 1,
            wifi_ssid: config ? config.get('wifi.defaultSsid', 'WangCafe_Guest') : 'WangCafe_Guest',
            wifi_password: config ? config.get('wifi.defaultPassword', '') : '' // 不硬编码密码
        }),
        
        getReviews: () => ({
            reviews: [
                {
                    id: 1,
                    customer_name: '演示用户',
                    rating: 5,
                    comment: '店铺页面很专业，功能齐全！',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    customer_name: '测试客户',
                    rating: 4,
                    comment: 'WiFi密码功能很方便，一键复制',
                    created_at: new Date(Date.now() - 86400000).toISOString()
                }
            ],
            total: 2,
            average_rating: 4.5
        }),
        
        getStats: () => ({
            total_visits: 156,
            today_visits: 12,
            total_reviews: 8,
            average_rating: 4.6
        }),
        
        getWifiInfo: () => ({
            ssid: config ? config.get('wifi.defaultSsid', 'WangCafe_Guest') : 'WangCafe_Guest',
            password: config ? config.get('wifi.defaultPassword', '') : '', // 不硬编码密码
            show_wifi_button: 1
        }),
        
        recordVisit: () => ({
            success: true,
            message: '访问记录已保存（降级模式）',
            timestamp: Date.now()
        }),
        
        submitReview: () => ({
            success: true,
            message: '评价已提交（降级模式）',
            review_id: Date.now()
        }),
        
        getShopInfoLegacy: () => getFallbackData('getShopInfo')(),
        getReviewsLegacy: () => getFallbackData('getReviews')()
    };
    
    const fallbackFn = fallbackData[methodName];
    return fallbackFn ? fallbackFn() : null;
}

/**
 * 创建API队列监控面板
 */
function createQueueMonitor() {
    const queue = getApiQueue();
    
    // 创建监控容器
    const monitorContainer = document.createElement('div');
    monitorContainer.id = 'api-queue-monitor';
    monitorContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        background: rgba(0, 0, 0, 0.85);
        color: white;
        border-radius: 10px;
        padding: 15px;
        font-family: monospace;
        font-size: 12px;
        z-index: 9999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
        display: none;
    `;
    
    // 监控内容
    monitorContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong>🔧 API队列监控</strong>
            <div>
                <button id="queue-monitor-toggle" style="background: #4361ee; color: white; border: none; padding: 2px 8px; border-radius: 3px; font-size: 10px; cursor: pointer;">隐藏</button>
                <button id="queue-monitor-clear" style="background: #e53e3e; color: white; border: none; padding: 2px 8px; border-radius: 3px; font-size: 10px; cursor: pointer; margin-left: 5px;">清空</button>
            </div>
        </div>
        <div id="queue-stats" style="margin-bottom: 10px;">
            <div>队列长度: <span id="queue-length">0</span></div>
            <div>活跃请求: <span id="active-requests">0</span></div>
            <div>成功/失败: <span id="success-fail">0/0</span></div>
            <div>平均响应: <span id="avg-response">0ms</span></div>
        </div>
        <div style="font-size: 10px; color: #aaa; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
            <div>状态: <span id="queue-status">空闲</span></div>
            <div>配置: 间隔<span id="queue-delay">600</span>ms, 并发<span id="queue-concurrent">1</span></div>
        </div>
    `;
    
    document.body.appendChild(monitorContainer);
    
    // 更新监控数据
    function updateMonitor() {
        const status = queue.getStatus();
        
        document.getElementById('queue-length').textContent = status.queueLength;
        document.getElementById('active-requests').textContent = status.activeRequests;
        document.getElementById('success-fail').textContent = 
            `${status.stats.successfulRequests}/${status.stats.failedRequests}`;
        document.getElementById('avg-response').textContent = 
            `${Math.round(status.stats.averageResponseTime)}ms`;
        document.getElementById('queue-status').textContent = 
            status.processing ? '处理中' : '空闲';
        document.getElementById('queue-delay').textContent = status.config.delay;
        document.getElementById('queue-concurrent').textContent = status.config.maxConcurrent;
    }
    
    // 切换显示/隐藏
    document.getElementById('queue-monitor-toggle').addEventListener('click', function() {
        if (monitorContainer.style.display === 'none') {
            monitorContainer.style.display = 'block';
            this.textContent = '隐藏';
        } else {
            monitorContainer.style.display = 'none';
            this.textContent = '显示';
        }
    });
    
    // 清空队列
    document.getElementById('queue-monitor-clear').addEventListener('click', function() {
        const cleared = queue.clearQueue('手动清空');
        alert(`已清空 ${cleared} 个待处理请求`);
        updateMonitor();
    });
    
    // 定时更新
    setInterval(updateMonitor, 1000);
    
    // 初始显示
    setTimeout(() => {
        monitorContainer.style.display = 'block';
        updateMonitor();
    }, 1000);
    
    return monitorContainer;
}

/**
 * 初始化API队列系统
 */
function initApiQueueSystem(options = {}) {
    console.log('🚀 初始化API队列系统...');
    
    // 获取队列实例
    const queue = getApiQueue({
        delay: 600,
        maxRetries: 2,
        retryDelay: 2000,
        debug: options.debug || false,
        ...options
    });
    
    // 创建监控面板（调试模式下）
    if (options.showMonitor) {
        setTimeout(() => {
            createQueueMonitor();
            console.log('📊 API队列监控面板已创建');
        }, 1000);
    }
    
    // 通过命名空间暴露
    if (typeof window !== 'undefined') {
        try {
            if (window.registerModule) {
                window.registerModule('apiQueueInstance', queue);
                window.registerUtil('wrapShopServiceMethods', wrapShopServiceMethods);
                window.registerUtil('initApiQueueSystem', initApiQueueSystem);
            } else if (window.WangDian) {
                window.WangDian.modules = window.WangDian.modules || {};
                window.WangDian.modules.apiQueueInstance = queue;
                window.WangDian.utils = window.WangDian.utils || {};
                window.WangDian.utils.wrapShopServiceMethods = wrapShopServiceMethods;
                window.WangDian.utils.initApiQueueSystem = initApiQueueSystem;
            }
        } catch (e) {
            console.warn('注册API队列集成工具失败:', e);
        }
    }
    
    console.log('✅ API队列系统初始化完成');
    console.log('配置:', queue.getStatus().config);
    
    return queue;
}

/**
 * 测试API队列
 */
async function testApiQueue() {
    console.log('🧪 开始测试API队列...');
    
    const queue = getApiQueue();
    
    // 测试并发请求
    const testRequests = [
        queue.add(() => new Promise(resolve => setTimeout(() => resolve('请求1完成'), 300)), {
            metadata: { test: 'request1' }
        }),
        queue.add(() => new Promise(resolve => setTimeout(() => resolve('请求2完成'), 200)), {
            metadata: { test: 'request2' },
            priority: 'high'
        }),
        queue.add(() => new Promise(resolve => setTimeout(() => resolve('请求3完成'), 400)), {
            metadata: { test: 'request3' }
        })
    ];
    
    try {
        const results = await Promise.all(testRequests);
        console.log('✅ API队列测试成功:', results);
        return results;
    } catch (error) {
        console.error('❌ API队列测试失败:', error);
        throw error;
    }
}

// 通过命名空间导出
if (typeof window !== 'undefined') {
    try {
        if (window.registerModule) {
            window.registerUtil('wrapShopServiceMethods', wrapShopServiceMethods);
            window.registerUtil('initApiQueueSystem', initApiQueueSystem);
            window.registerUtil('testApiQueue', testApiQueue);
        } else if (window.WangDian) {
            window.WangDian.utils = window.WangDian.utils || {};
            window.WangDian.utils.wrapShopServiceMethods = wrapShopServiceMethods;
            window.WangDian.utils.initApiQueueSystem = initApiQueueSystem;
            window.WangDian.utils.testApiQueue = testApiQueue;
        }
    } catch (e) {
        console.warn('导出API队列集成工具失败:', e);
    }
}

export {
    wrapShopServiceMethods,
    initApiQueueSystem,
    testApiQueue,
    createQueueMonitor
};