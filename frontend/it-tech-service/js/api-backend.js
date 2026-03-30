// 后端API客户端 - 替换原来的localStorage方案
class MessageAPI {
    constructor(baseURL = 'http://47.110.156.11:3007') {
        this.baseURL = baseURL;
        this.adminPassword = 'admin123';
        this.localhostURL = 'http://localhost:3007';
        
        // 尝试检测是否在服务器本地环境
        this.isLocalEnvironment = window.location.hostname === 'localhost' || 
                                 window.location.hostname === '127.0.0.1' ||
                                 window.location.hostname === '47.110.156.11';
    }

    // 通用请求方法（尝试多个地址）
    async request(endpoint, options = {}) {
        // 尝试的地址列表（按优先级）
        const urlsToTry = [
            this.baseURL,           // 主地址: 47.110.156.11:3007
            this.localhostURL       // 备用地址: localhost:3007
        ];
        
        // 如果在服务器本地环境，优先尝试localhost
        if (this.isLocalEnvironment) {
            urlsToTry.unshift(this.localhostURL);
        }

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            // 添加超时控制
            signal: AbortSignal.timeout(5000) // 5秒超时
        };

        let lastError = null;
        
        // 尝试每个地址
        for (const baseURL of urlsToTry) {
            const url = `${baseURL}${endpoint}`;
            
            try {
                console.log(`尝试连接API: ${url}`);
                const response = await fetch(url, { ...defaultOptions, ...options });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
                
                console.log(`API连接成功: ${baseURL}`);
                return await response.json();
            } catch (error) {
                console.warn(`API连接失败 ${baseURL}:`, error.message);
                lastError = error;
                
                // 如果是超时或网络错误，继续尝试下一个地址
                if (error.name === 'AbortError' || error.name === 'TimeoutError' || 
                    error.message.includes('Failed to fetch') || 
                    error.message.includes('NetworkError')) {
                    continue;
                }
                
                // 其他错误直接抛出
                throw error;
            }
        }
        
        // 所有地址都失败
        console.warn('所有API地址尝试失败，将使用localStorage模式');
        throw new Error('API_SERVICE_UNAVAILABLE');
    }

    // 提交新留言
    async submitMessage(messageData) {
        const requiredFields = ['name', 'phone', 'content'];
        const missingFields = requiredFields.filter(field => !messageData[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`缺少必填字段: ${missingFields.join(', ')}`);
        }

        return await this.request('/api/messages', {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    // 获取所有留言（需要管理员权限）
    async getAllMessages() {
        return await this.request(`/api/messages?password=${this.adminPassword}`);
    }

    // 获取留言统计
    async getMessageStats() {
        return await this.request(`/api/messages/stats?password=${this.adminPassword}`);
    }

    // 标记留言为已读
    async markAsRead(messageId) {
        return await this.request(`/api/messages/${messageId}/read?password=${this.adminPassword}`, {
            method: 'PUT'
        });
    }

    // 删除留言
    async deleteMessage(messageId) {
        return await this.request(`/api/messages/${messageId}?password=${this.adminPassword}`, {
            method: 'DELETE'
        });
    }

    // 健康检查
    async healthCheck() {
        return await this.request('/health');
    }

    // 检查API服务是否可用
    async isAvailable() {
        try {
            const result = await this.healthCheck();
            return result.status === 'ok';
        } catch (error) {
            console.warn('API健康检查失败，将使用localStorage模式:', error.message);
            
            // 如果是API服务不可用错误，静默返回false
            if (error.message === 'API_SERVICE_UNAVAILABLE') {
                return false;
            }
            
            // 其他错误也返回false，但记录更详细
            console.error('API检查详细错误:', error);
            return false;
        }
    }
}

// 创建全局API实例
window.messageAPI = new MessageAPI();

// 兼容旧代码的适配器
window.legacyMessageAdapter = {
    // 替换原来的saveConsultation函数
    saveConsultation: async function(data) {
        try {
            // 先尝试使用后端API
            if (await window.messageAPI.isAvailable()) {
                const result = await window.messageAPI.submitMessage(data);
                console.log('留言已提交到后端:', result);
                return result.success;
            } else {
                // 后端不可用，回退到localStorage
                console.warn('后端API不可用，回退到localStorage');
                return saveToLocalStorage(data);
            }
        } catch (error) {
            console.error('留言提交失败:', error);
            // 回退到localStorage
            return saveToLocalStorage(data);
        }
    },

    // 获取留言（优先后端，后备用localStorage）
    getConsultations: async function() {
        try {
            if (await window.messageAPI.isAvailable()) {
                const result = await window.messageAPI.getAllMessages();
                return result.messages || [];
            } else {
                // 后端不可用，使用localStorage
                return getFromLocalStorage();
            }
        } catch (error) {
            console.error('获取留言失败:', error);
            return getFromLocalStorage();
        }
    }
};

// localStorage回退函数
function saveToLocalStorage(data) {
    try {
        let consultations = JSON.parse(localStorage.getItem('itTechConsultations') || '[]');
        
        consultations.push({
            ...data,
            id: Date.now(),
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        
        localStorage.setItem('itTechConsultations', JSON.stringify(consultations));
        
        console.log('留言已保存到localStorage:', data);
        return true;
    } catch (error) {
        console.error('保存到localStorage失败:', error);
        return false;
    }
}

function getFromLocalStorage() {
    try {
        return JSON.parse(localStorage.getItem('itTechConsultations') || '[]');
    } catch (error) {
        console.error('从localStorage读取失败:', error);
        return [];
    }
}

// 初始化API检查
document.addEventListener('DOMContentLoaded', async function() {
    // 检查后端API是否可用
    const apiAvailable = await window.messageAPI.isAvailable();
    
    if (apiAvailable) {
        console.log('✅ 后端留言API服务可用');
        
        // 更新页面提示
        const formNotice = document.createElement('div');
        formNotice.className = 'api-notice success';
        formNotice.innerHTML = `
            <p><i class="fas fa-check-circle"></i> 留言系统已连接，您的留言将被安全保存。</p>
            <p><small>提交后我们会尽快联系您！</small></p>
        `;
        
        // 插入到表单附近
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.parentNode.insertBefore(formNotice, contactForm);
        }
    } else {
        console.warn('⚠️ 后端留言API不可用，使用localStorage模式');
        
        // 显示警告提示
        const formNotice = document.createElement('div');
        formNotice.className = 'api-notice warning';
        formNotice.innerHTML = `
            <p><i class="fas fa-exclamation-triangle"></i> <strong>重要提示</strong>：留言将保存在您的浏览器本地。</p>
            <p>请务必：</p>
            <ol>
                <li>提交后<strong>截图保存</strong>留言记录</li>
                <li>或直接<strong>电话/微信联系</strong>我们</li>
                <li>联系电话：138-0013-8000 | 微信：同手机号</li>
            </ol>
        `;
        
        // 插入到表单附近
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.parentNode.insertBefore(formNotice, contactForm);
        }
    }
});

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MessageAPI, legacyMessageAdapter };
}