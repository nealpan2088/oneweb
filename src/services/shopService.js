/**
 * 店铺服务层
 * 处理店铺相关的业务逻辑
 */
const { dbQuery, dbGet, dbRun } = require('../config/database');
const apiConfig = require('../config/api');

class ShopService {
  /**
   * 获取店铺列表
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async getShops(page = 1, limit = apiConfig.pagination.defaultLimit) {
    // 限制最大数量
    const safeLimit = Math.min(limit, apiConfig.pagination.maxLimit);
    const offset = (page - 1) * safeLimit;
    
    try {
      // 获取店铺数据
      const shops = await dbQuery(
        `SELECT id, name, description, address, phone, 
                business_hours, latitude, longitude, 
                wechat_qr, wechat_id, wifi_ssid,
                show_wechat_button, show_wifi_button, 
                show_map, show_reviews, status,
                created_at, updated_at
         FROM shops 
         WHERE status = 1 
         ORDER BY id 
         LIMIT ? OFFSET ?`,
        [safeLimit, offset]
      );
      
      // 获取总数
      const countResult = await dbGet(
        `SELECT COUNT(*) as total FROM shops WHERE status = 1`
      );
      
      return {
        items: shops,
        pagination: {
          page: parseInt(page),
          limit: safeLimit,
          total: countResult.total,
          pages: Math.ceil(countResult.total / safeLimit)
        }
      };
    } catch (error) {
      console.error('获取店铺列表失败:', error);
      throw new Error('获取店铺列表失败');
    }
  }
  
  /**
   * 获取单个店铺
   * @param {number|string} id - 店铺ID
   * @returns {Promise<Object|null>} 店铺信息
   */
  async getShopById(id) {
    try {
      const shop = await dbGet(
        `SELECT id, name, description, address, phone, 
                business_hours, latitude, longitude, 
                wechat_qr, wechat_id, wifi_ssid, wifi_password,
                show_wechat_button, show_wifi_button, 
                show_map, show_reviews, status,
                created_at, updated_at
         FROM shops 
         WHERE id = ? AND status = 1`,
        [id]
      );
      
      return shop || null;
    } catch (error) {
      console.error('获取店铺失败:', error);
      throw new Error('获取店铺失败');
    }
  }
  
  /**
   * 获取店铺评价
   * @param {number} shopId - 店铺ID
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} 评价分页结果
   */
  async getShopReviews(shopId, page = 1, limit = 20) {
    const safeLimit = Math.min(limit, 100);
    const offset = (page - 1) * safeLimit;
    
    try {
      const reviews = await dbQuery(
        `SELECT id, shop_id, customer_name, avatar_url, 
                rating, content, reply, is_visible, created_at
         FROM reviews 
         WHERE shop_id = ? AND is_visible = 1 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [shopId, safeLimit, offset]
      );
      
      const countResult = await dbGet(
        `SELECT COUNT(*) as total FROM reviews WHERE shop_id = ? AND is_visible = 1`,
        [shopId]
      );
      
      return {
        items: reviews,
        pagination: {
          page: parseInt(page),
          limit: safeLimit,
          total: countResult.total,
          pages: Math.ceil(countResult.total / safeLimit)
        }
      };
    } catch (error) {
      console.error('获取评价失败:', error);
      throw new Error('获取评价失败');
    }
  }
  
  /**
   * 获取店铺统计
   * @param {number} shopId - 店铺ID
   * @returns {Promise<Object>} 统计信息
   */
  async getShopStats(shopId) {
    try {
      const [visitCount, reviewStats] = await Promise.all([
        dbGet('SELECT COUNT(*) as total_visits FROM visit_logs WHERE shop_id = ?', [shopId]),
        dbGet('SELECT COUNT(*) as total_reviews, AVG(rating) as avg_rating FROM reviews WHERE shop_id = ? AND is_visible = 1', [shopId])
      ]);
      
      return {
        visits: visitCount.total_visits || 0,
        reviews: reviewStats.total_reviews || 0,
        avgRating: reviewStats.avg_rating ? parseFloat(reviewStats.avg_rating.toFixed(1)) : 0
      };
    } catch (error) {
      console.error('获取统计失败:', error);
      throw new Error('获取统计失败');
    }
  }
  
  /**
   * 创建评价
   * @param {number} shopId - 店铺ID
   * @param {Object} reviewData - 评价数据
   * @returns {Promise<Object>} 创建的评价
   */
  async createReview(shopId, reviewData) {
    const { customer_name, rating, content, avatar_url = '' } = reviewData;
    
    try {
      // 检查店铺是否存在
      const shop = await this.getShopById(shopId);
      if (!shop) {
        throw new Error('店铺不存在');
      }
      
      const result = await dbRun(
        `INSERT INTO reviews (shop_id, customer_name, avatar_url, rating, content, is_visible)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [shopId, customer_name, avatar_url, rating, content]
      );
      
      return {
        id: result.lastID,
        shop_id: shopId,
        customer_name,
        avatar_url,
        rating,
        content,
        is_visible: 1,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('创建评价失败:', error);
      throw new Error('创建评价失败: ' + error.message);
    }
  }
  
  /**
   * 记录访问
   * @param {number} shopId - 店铺ID
   * @param {string} action - 访问动作
   * @param {string} visitorIp - 访问者IP
   * @param {string} userAgent - 用户代理
   * @returns {Promise<Object>} 访问记录
   */
  async recordVisit(shopId, action = 'view', visitorIp = '', userAgent = '') {
    try {
      const result = await dbRun(
        `INSERT INTO visit_logs (shop_id, visitor_ip, user_agent, action)
         VALUES (?, ?, ?, ?)`,
        [shopId, visitorIp, userAgent, action]
      );
      
      return {
        id: result.lastID,
        shop_id: shopId,
        action,
        recorded: true
      };
    } catch (error) {
      console.error('记录访问失败:', error);
      // 访问记录失败不影响主流程
      return { recorded: false, error: error.message };
    }
  }
  
  /**
   * 获取WiFi信息
   * @param {number} shopId - 店铺ID
   * @returns {Promise<Object>} WiFi信息
   */
  async getWifiInfo(shopId) {
    try {
      const shop = await this.getShopById(shopId);
      if (!shop) {
        throw new Error('店铺不存在');
      }
      
      return {
        ssid: shop.wifi_ssid || '',
        password: shop.wifi_password || '',
        show_wifi_button: shop.show_wifi_button || 0
      };
    } catch (error) {
      console.error('获取WiFi信息失败:', error);
      throw new Error('获取WiFi信息失败');
    }
  }
}

module.exports = new ShopService();