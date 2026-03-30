/**
 * API客户端
 * 统一的HTTP请求处理
 */
class ApiClient {
  constructor(config) {
    this.config = config;
    this.baseURL = config.getBaseURL();
    this.headers = { ...config.headers };
  }
  
  /**
   * 请求拦截器
   */
  async requestInterceptor(config) {
    // 可以在这里添加认证token等
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 添加请求时间戳
    config.headers['X-Request-Timestamp'] = Date.now();
    
    return config;
  }
  
  /**
   * 响应拦截器
   */
  async responseInterceptor(response) {
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      throw error;
    }
    
    const data = await response.json();
    
    // 检查API响应格式
    if (data && typeof data === 'object') {
      // 新版API格式
      if ('success' in data) {
        if (data.success === false) {
          const error = new Error(data.message || '请求失败');
          error.data = data.data;
          throw error;
        }
        return data.data; // 返回实际数据
      }
      
      // 旧版API格式（兼容性）
      if ('error' in data) {
        const error = new Error(data.error || '请求失败');
        throw error;
      }
    }
    
    return data;
  }
  
  /**
   * 统一请求方法
   */
  async request(endpoint, options = {}) {
    const config = {
      method: 'GET',
      headers: { ...this.headers, ...options.headers },
      ...options
    };
    
    // 请求拦截
    const finalConfig = await this.requestInterceptor(config);
    
    // 构建完整URL
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.baseURL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    
    // 设置超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    finalConfig.signal = controller.signal;
    
    try {
      const response = await fetch(url, finalConfig);
      clearTimeout(timeoutId);
      return await this.responseInterceptor(response);
    } catch (error) {
      clearTimeout(timeoutId);
      
      // 错误处理
      if (error.name === 'AbortError') {
        throw new Error(this.config.errorMessages.timeout);
      }
      
      // 网络错误
      if (error.message.includes('Failed to fetch')) {
        throw new Error(this.config.errorMessages.network);
      }
      
      throw error;
    }
  }
  
  /**
   * GET请求
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }
  
  /**
   * POST请求
   */
  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  /**
   * PUT请求
   */
  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  /**
   * DELETE请求
   */
  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// 创建单例实例
let apiClientInstance = null;

function getApiClient() {
  if (!apiClientInstance) {
    const config = window.API_CONFIG || {};
    apiClientInstance = new ApiClient(config);
  }
  return apiClientInstance;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiClient, getApiClient };
} else {
  window.ApiClient = ApiClient;
  window.getApiClient = getApiClient;
}