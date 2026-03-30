// IT技术服务站API服务
// 版本: 1.0.0
// 日期: 2026-03-29

const API_CONFIG = {
    baseURL: "http://47.110.156.11:3007", // 留言API,
    timeout: 10000, // 10秒超时
    headers: {
        'Content-Type': 'application/json'
    }
};

// API服务类
class ApiService {
    constructor(config = {}) {
        this.config = { ...API_CONFIG, ...config };
        this.cache = new Map();
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.config.baseURL}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.config.headers,
                    ...options.headers
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // 缓存成功的GET请求
            if (options.method === 'GET' || !options.method) {
                this.cache.set(endpoint, {
                    data,
                    timestamp: Date.now()
                });
            }

            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            
            // 如果是网络错误，尝试使用缓存
            if (error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
                const cached = this.cache.get(endpoint);
                if (cached && Date.now() - cached.timestamp < 300000) { // 5分钟缓存
                    console.warn('使用缓存数据:', endpoint);
                    return cached.data;
                }
            }

            console.error('API请求失败:', error);
            throw error;
        }
    }

    // 健康检查
    async healthCheck() {
        try {
            const data = await this.request('/health');
            return {
                success: true,
                data,
                online: true
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                online: false
            };
        }
    }

    // 留言相关API
    messages = {
        // 获取所有留言
        getAll: async () => {
            return await this.request('/messages');
        },

        // 提交新留言
        create: async (messageData) => {
            return await this.request('/messages', {
                method: 'POST',
                body: JSON.stringify(messageData)
            });
        },

        // 标记为已读
        markAsRead: async (messageId) => {
            return await this.request(`/messages/${messageId}/read`, {
                method: 'PUT'
            });
        },

        // 删除留言
        delete: async (messageId) => {
            return await this.request(`/messages/${messageId}`, {
                method: 'DELETE'
            });
        },

        // 获取统计数据
        getStats: async () => {
            return await this.request('/stats');
        }
    };

    // 图片相关API
    gallery = {
        // 获取所有图片
        getAll: async () => {
            return await this.request('/gallery');
        },

        // 上传图片
        upload: async (formData) => {
            return await this.request('/gallery', {
                method: 'POST',
                headers: {
                    // 注意：上传文件时不要设置Content-Type，浏览器会自动设置
                },
                body: formData
            });
        },

        // 删除图片
        delete: async (imageId) => {
            return await this.request(`/gallery/${imageId}`, {
                method: 'DELETE'
            });
        }
    };
}

// 创建全局API实例
const api = new ApiService();

// 工具函数：显示消息
function showMessage(type, text, duration = 3000) {
    // 移除现有的消息
    const existing = document.querySelector('.api-message');
    if (existing) existing.remove();

    // 创建消息元素
    const message = document.createElement('div');
    message.className = `api-message api-message-${type}`;
    message.innerHTML = `
        <div class="api-message-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${text}</span>
        </div>
        <button class="api-message-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .api-message {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 500px;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: space-between;
            animation: slideIn 0.3s ease;
        }
        
        .api-message-success {
            background: #d4edda;
            color: #155724;
            border-left: 4px solid #28a745;
        }
        
        .api-message-error {
            background: #f8d7da;
            color: #721c24;
            border-left: 4px solid #dc3545;
        }
        
        .api-message-warning {
            background: #fff3cd;
            color: #856404;
            border-left: 4px solid #ffc107;
        }
        
        .api-message-info {
            background: #d1ecf1;
            color: #0c5460;
            border-left: 4px solid #17a2b8;
        }
        
        .api-message-content {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }
        
        .api-message-close {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            padding: 0;
            margin-left: 10px;
            opacity: 0.7;
            transition: opacity 0.3s;
        }
        
        .api-message-close:hover {
            opacity: 1;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(message);

    // 自动消失
    if (duration > 0) {
        setTimeout(() => {
            if (message.parentElement) {
                message.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => message.remove(), 300);
            }
        }, duration);
    }

    return message;
}

// 工具函数：验证表单
function validateForm(formData, rules) {
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
        const value = formData[field];
        
        if (rule.required && (!value || value.trim() === '')) {
            errors.push(`${rule.label || field} 为必填项`);
            continue;
        }

        if (value) {
            if (rule.minLength && value.length < rule.minLength) {
                errors.push(`${rule.label || field} 至少需要 ${rule.minLength} 个字符`);
            }
            
            if (rule.maxLength && value.length > rule.maxLength) {
                errors.push(`${rule.label || field} 不能超过 ${rule.maxLength} 个字符`);
            }
            
            if (rule.pattern && !rule.pattern.test(value)) {
                errors.push(rule.message || `${rule.label || field} 格式不正确`);
            }
            
            if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors.push('邮箱格式不正确');
            }
            
            if (rule.type === 'phone' && !/^1[3-9]\d{9}$/.test(value)) {
                errors.push('手机号格式不正确');
            }
        }
    }

    return errors;
}

// 工具函数：加载状态
function createLoadingOverlay(text = '加载中...') {
    // 移除现有的加载层
    const existing = document.querySelector('.loading-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div class="loading-text">${text}</div>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9998;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(3px);
        }
        
        .loading-content {
            background: white;
            padding: 30px 40px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 8px 30px rgba(0,0,0,0.2);
            animation: fadeIn 0.3s ease;
        }
        
        .loading-spinner {
            font-size: 40px;
            color: #4361ee;
            margin-bottom: 15px;
        }
        
        .loading-text {
            font-size: 16px;
            color: #333;
            font-weight: 500;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    return {
        remove: () => {
            if (overlay.parentElement) {
                overlay.style.animation = 'fadeIn 0.3s ease reverse';
                setTimeout(() => overlay.remove(), 300);
            }
        }
    };
}

// 导出API实例和工具函数
window.ApiService = ApiService;
window.api = api;
window.showMessage = showMessage;
window.validateForm = validateForm;
window.createLoadingOverlay = createLoadingOverlay;

// 自动检查API连接状态
document.addEventListener('DOMContentLoaded', async function() {
    // 延迟检查，避免影响页面加载
    setTimeout(async () => {
        try {
            const health = await api.healthCheck();
            
            if (!health.online) {
                console.warn('API服务未连接，部分功能可能受限');
                
                // 在控制台显示提示
                console.log(`
==========================================
⚠️  API服务未连接提示
==========================================
当前网站功能需要后端API支持：

1. 启动API服务：
   cd /home/admin/yunxinwangdian/frontend/it-tech-service/backend
   ./start.sh start

2. 或者使用简化版本（无API）：
   留言将保存在浏览器本地
   图片使用示例数据

3. 完整功能需要：
   - Node.js环境
   - 运行后端服务
   - 允许端口3003访问
==========================================
                `);
            } else {
                console.log('✅ API服务连接正常');
            }
        } catch (error) {
            // 静默处理，不影响用户体验
        }
    }, 2000);
});

console.log('✅ API服务模块加载完成');