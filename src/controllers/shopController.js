/**
 * 店铺控制器
 * 处理店铺相关的HTTP请求
 */
const shopService = require('../services/shopService');

class ShopController {
  /**
   * 获取店铺列表
   */
  async getShops(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await shopService.getShops(page, limit);
      res.success(result);
    } catch (error) {
      console.error('获取店铺列表失败:', error);
      res.error(error.message, 500);
    }
  }
  
  /**
   * 获取单个店铺
   */
  async getShopById(req, res) {
    try {
      const shopId = parseInt(req.params.id);
      if (isNaN(shopId)) {
        return res.error('无效的店铺ID', 400);
      }
      
      const shop = await shopService.getShopById(shopId);
      if (!shop) {
        return res.notFound('店铺不存在');
      }
      
      res.success(shop);
    } catch (error) {
      console.error('获取店铺失败:', error);
      res.error(error.message, 500);
    }
  }
  
  /**
   * 获取店铺评价
   */
  async getShopReviews(req, res) {
    try {
      const shopId = parseInt(req.params.id);
      if (isNaN(shopId)) {
        return res.error('无效的店铺ID', 400);
      }
      
      const { page = 1, limit = 20 } = req.query;
      const result = await shopService.getShopReviews(shopId, page, limit);
      res.success(result);
    } catch (error) {
      console.error('获取评价失败:', error);
      res.error(error.message, 500);
    }
  }
  
  /**
   * 获取店铺统计
   */
  async getShopStats(req, res) {
    try {
      const shopId = parseInt(req.params.id);
      if (isNaN(shopId)) {
        return res.error('无效的店铺ID', 400);
      }
      
      const stats = await shopService.getShopStats(shopId);
      res.success(stats);
    } catch (error) {
      console.error('获取统计失败:', error);
      res.error(error.message, 500);
    }
  }
  
  /**
   * 提交评价
   */
  async createReview(req, res) {
    try {
      const shopId = parseInt(req.params.id);
      if (isNaN(shopId)) {
        return res.error('无效的店铺ID', 400);
      }
      
      const reviewData = req.body;
      const result = await shopService.createReview(shopId, reviewData);
      res.created(result, '评价提交成功');
    } catch (error) {
      console.error('提交评价失败:', error);
      res.error(error.message, 400);
    }
  }
  
  /**
   * 记录访问
   */
  async recordVisit(req, res) {
    try {
      const shopId = parseInt(req.params.id);
      if (isNaN(shopId)) {
        return res.error('无效的店铺ID', 400);
      }
      
      const { action = 'view' } = req.body;
      const visitorIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';
      
      const result = await shopService.recordVisit(shopId, action, visitorIp, userAgent);
      res.success(result, '访问记录成功');
    } catch (error) {
      console.error('记录访问失败:', error);
      // 访问记录失败不影响响应
      res.success({ recorded: false }, '访问记录失败，但不影响使用');
    }
  }
  
  /**
   * 获取WiFi信息
   */
  async getWifiInfo(req, res) {
    try {
      const shopId = parseInt(req.params.id);
      if (isNaN(shopId)) {
        return res.error('无效的店铺ID', 400);
      }
      
      const wifiInfo = await shopService.getWifiInfo(shopId);
      res.success(wifiInfo);
    } catch (error) {
      console.error('获取WiFi信息失败:', error);
      res.error(error.message, 500);
    }
  }
  
  /**
   * 提交WiFi访问
   */
  async submitWifiAccess(req, res) {
    try {
      const shopId = parseInt(req.params.id);
      if (isNaN(shopId)) {
        return res.error('无效的店铺ID', 400);
      }
      
      // 记录WiFi访问
      const visitorIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';
      
      await shopService.recordVisit(shopId, 'click_wifi', visitorIp, userAgent);
      
      // 返回WiFi信息
      const wifiInfo = await shopService.getWifiInfo(shopId);
      res.success(wifiInfo, 'WiFi信息获取成功');
    } catch (error) {
      console.error('处理WiFi访问失败:', error);
      res.error(error.message, 500);
    }
  }
}

module.exports = new ShopController();