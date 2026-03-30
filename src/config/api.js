/**
 * API配置
 */
module.exports = {
  // API版本
  version: 'v1',
  
  // 响应格式
  responseFormat: {
    success: true,
    data: null,
    message: '',
    timestamp: ''
  },
  
  // 错误码
  errorCodes: {
    VALIDATION_ERROR: 1001,
    NOT_FOUND: 1002,
    UNAUTHORIZED: 1003,
    FORBIDDEN: 1004,
    INTERNAL_ERROR: 5000
  },
  
  // 分页配置
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  },
  
  // 数据库配置
  database: {
    path: process.env.DB_PATH || '../database/shop.db'
  }
};