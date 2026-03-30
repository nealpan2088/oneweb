/**
 * 响应格式化中间件
 * 统一API响应格式
 */
const { success, error, created, notFound, unauthorized, forbidden } = require('../../utils/response');

const responseFormatter = (req, res, next) => {
  // 保存原始的res.json方法
  const originalJson = res.json;
  
  // 重写res.json方法以统一格式
  res.json = function(data, statusCode = 200) {
    // 如果已经是标准格式，直接返回
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson.call(this, data);
    }
    
    // 如果是错误响应（包含error字段）
    if (data && data.error) {
      return originalJson.call(this, {
        success: false,
        data: null,
        message: data.error,
        timestamp: new Date().toISOString()
      });
    }
    
    // 成功响应
    return originalJson.call(this, {
      success: true,
      data: data,
      message: '',
      timestamp: new Date().toISOString()
    });
  };
  
  // 添加快捷方法
  res.success = function(data, message = '操作成功', statusCode = 200) {
    return success(this, data, message, statusCode);
  };
  
  res.error = function(message = '操作失败', statusCode = 400, data = null) {
    return error(this, message, statusCode, data);
  };
  
  res.created = function(data, message = '创建成功') {
    return created(this, data, message);
  };
  
  res.notFound = function(message = '资源不存在', data = null) {
    return notFound(this, message, data);
  };
  
  res.unauthorized = function(message = '未授权访问', data = null) {
    return unauthorized(this, message, data);
  };
  
  res.forbidden = function(message = '禁止访问', data = null) {
    return forbidden(this, message, data);
  };
  
  next();
};

module.exports = responseFormatter;