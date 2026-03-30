/**
 * 主路由文件
 * 集中管理所有API路由
 */
const express = require('express');
const router = express.Router();
const apiConfig = require('../config/api');

// 导入各版本路由
const v1Routes = require('./v1/shops');

// API版本前缀
const API_PREFIX = `/api/${apiConfig.version}`;

// v1 路由
router.use(`${API_PREFIX}/shops`, v1Routes);

// API文档路由
router.get(`${API_PREFIX}/docs`, (req, res) => {
  res.json({
    success: true,
    data: {
      version: apiConfig.version,
      endpoints: {
        shops: {
          'GET /': '获取店铺列表',
          'GET /:id': '获取单个店铺',
          'GET /:id/reviews': '获取店铺评价',
          'POST /:id/reviews': '提交评价',
          'GET /:id/stats': '获取店铺统计',
          'POST /:id/visit': '记录访问',
          'GET /:id/wifi': '获取WiFi信息',
          'POST /:id/wifi': '提交WiFi访问'
        }
      },
      responseFormat: apiConfig.responseFormat
    },
    message: 'API文档',
    timestamp: new Date().toISOString()
  });
});

// API健康检查
router.get(`${API_PREFIX}/health`, (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      version: '1.1.0',
      apiVersion: apiConfig.version,
      timestamp: new Date().toISOString()
    },
    message: 'API服务正常',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;