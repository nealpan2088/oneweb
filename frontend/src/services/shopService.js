/**
 * 店铺服务
 * 封装所有店铺相关的API调用
 */
class ShopService {
  constructor() {
    this.apiClient = window.getApiClient();
    this.config = window.API_CONFIG;
    this.shopId = this.config.shopId.getCurrent();
  }
  
  /**
   * 设置店铺ID
   */
  setShopId(id) {
    this.shopId = id;
    this.config.shopId.setCurrent(id);
  }
  
  /**
   * 获取店铺信息
   */
  async getShopInfo(shopId = this.shopId) {
    try {
      return await this.apiClient.get(`/${shopId}`);
    } catch (error) {
      console.error('获取店铺信息失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取店铺列表
   */
  async getShops(page = 1, limit = 20) {
    try {
      return await this.apiClient.get(`?page=${page}&limit=${limit}`);
    } catch (error) {
      console.error('获取店铺列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取评价列表
   */
  async getReviews(shopId = this.shopId, page = 1, limit = 20) {
    try {
      return await this.apiClient.get(`/${shopId}/reviews?page=${page}&limit=${limit}`);
    } catch (error) {
      console.error('获取评价列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 提交评价
   */
  async submitReview(reviewData, shopId = this.shopId) {
    try {
      return await this.apiClient.post(`/${shopId}/reviews`, reviewData);
    } catch (error) {
      console.error('提交评价失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取统计信息
   */
  async getStats(shopId = this.shopId) {
    try {
      return await this.apiClient.get(`/${shopId}/stats`);
    } catch (error) {
      console.error('获取统计信息失败:', error);
      throw error;
    }
  }
  
  /**
   * 记录访问
   */
  async recordVisit(action = 'view', shopId = this.shopId) {
    try {
      return await this.apiClient.post(`/${shopId}/visit`, { action });
    } catch (error) {
      console.error('记录访问失败:', error);
      // 访问记录失败不影响主流程
      return { recorded: false, error: error.message };
    }
  }
  
  /**
   * 获取WiFi信息
   */
  async getWifiInfo(shopId = this.shopId) {
    try {
      // 后端API使用POST请求，需要传递action参数
      const wifiInfo = await this.apiClient.post(`/${shopId}/wifi`, { action: 'confirm' });
      // 确保返回标准格式
      if (wifiInfo && typeof wifiInfo === 'object') {
        return {
          ssid: wifiInfo.ssid || 'WangCafe_Guest',
          password: wifiInfo.password || '88888888',
          show_wifi_button: wifiInfo.show_wifi_button || 1
        };
      }
      return wifiInfo;
    } catch (error) {
      console.error('获取WiFi信息失败:', error);
      // 返回默认信息，而不是抛出错误
      return {
        ssid: 'WangCafe_Guest',
        password: '88888888',
        show_wifi_button: 1,
        isDefault: true
      };
    }
  }
  
  /**
   * 提交WiFi访问
   */
  async submitWifiAccess(shopId = this.shopId) {
    try {
      return await this.apiClient.post(`/shops/${shopId}/wifi`, {});
    } catch (error) {
      console.error('提交WiFi访问失败:', error);
      throw error;
    }
  }
  
  /**
   * 兼容性方法 - 使用旧API
   */
  async getShopInfoLegacy(shopId = this.shopId) {
    try {
      const legacyBaseURL = this.config.getLegacyBaseURL();
      const response = await fetch(`${legacyBaseURL}/shop/${shopId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('旧API获取店铺信息失败:', error);
      throw error;
    }
  }
  
  /**
   * 兼容性方法 - 获取旧API评价
   */
  async getReviewsLegacy(shopId = this.shopId, limit = 20) {
    try {
      const legacyBaseURL = this.config.getLegacyBaseURL();
      const response = await fetch(`${legacyBaseURL}/shop/${shopId}/reviews?limit=${limit}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('旧API获取评价失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
let shopServiceInstance = null;

function getShopService() {
  if (!shopServiceInstance) {
    shopServiceInstance = new ShopService();
  }
  return shopServiceInstance;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ShopService, getShopService };
} else {
  window.ShopService = ShopService;
  window.getShopService = getShopService;
}