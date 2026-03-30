/**
 * 店铺路由 v1
 */
const express = require('express');
const router = express.Router();
const shopController = require('../../controllers/shopController');
const { validateReview } = require('../../validators/shopValidator');

// 获取店铺列表
router.get('/', shopController.getShops);

// 获取单个店铺
router.get('/:id', shopController.getShopById);

// 获取店铺评价
router.get('/:id/reviews', shopController.getShopReviews);

// 提交评价
router.post('/:id/reviews', validateReview, shopController.createReview);

// 获取店铺统计
router.get('/:id/stats', shopController.getShopStats);

// 记录访问
router.post('/:id/visit', shopController.recordVisit);

// 获取WiFi信息
router.get('/:id/wifi', shopController.getWifiInfo);

// 提交WiFi访问
router.post('/:id/wifi', shopController.submitWifiAccess);

module.exports = router;