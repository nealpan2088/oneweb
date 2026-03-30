/**
 * API配置
 */
const API_CONFIG = {
  // 基础URL - 自动检测当前环境
  getBaseURL() {
    // 如果是本地开发
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000/api/shop';
    }
    // 生产环境
    return `${window.location.origin}/api/shop`;
  },
  
  // 旧API基础URL（兼容性）
  getLegacyBaseURL() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000/api';
    }
    return `${window.location.origin}/api`;
  },
  
  // 默认请求头
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // 超时时间（毫秒）
  timeout: 10000,
  
  // 重试配置
  retry: {
    maxRetries: 2,
    retryDelay: 1000
  },
  
  // 店铺ID管理
  shopId: {
    // 获取当前店铺ID
    getCurrent() {
      // 1. 从URL参数获取
      const urlParams = new URLSearchParams(window.location.search);
      const shopIdFromUrl = urlParams.get('shop_id');
      
      // 2. 从localStorage获取
      const shopIdFromStorage = localStorage.getItem('current_shop_id');
      
      // 3. 从页面配置获取（shop_index.html中的SHOP_ID）
      const shopIdFromConfig = window.SHOP_ID;
      
      // 4. 默认值
      return shopIdFromUrl || shopIdFromStorage || shopIdFromConfig || 3;
    },
    
    // 设置当前店铺ID
    setCurrent(id) {
      localStorage.setItem('current_shop_id', id);
      window.SHOP_ID = id;
    }
  },
  
  // 错误消息配置
  errorMessages: {
    network: '网络连接失败，请检查网络设置',
    timeout: '请求超时，请稍后重试',
    server: '服务器错误，请稍后重试',
    notFound: '请求的资源不存在',
    unauthorized: '未授权访问',
    default: '操作失败，请重试'
  }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API_CONFIG;
} else {
  window.API_CONFIG = API_CONFIG;
}