/**
 * 统一API响应格式
 * @param {Object} res - Express响应对象
 * @param {boolean} success - 是否成功
 * @param {*} data - 返回数据
 * @param {string} message - 消息
 * @param {number} statusCode - HTTP状态码
 */
const sendResponse = (res, success, data = null, message = '', statusCode = 200) => {
    const response = {
        success: success,
        data: data,
        message: message,
        timestamp: new Date().toISOString()
    };
    
    // 如果不成功且没有指定状态码，使用400
    if (!success && statusCode === 200) {
        statusCode = 400;
    }
    
    return res.status(statusCode).json(response);
};

// 成功响应
const success = (res, data = null, message = '操作成功', statusCode = 200) => {
    return sendResponse(res, true, data, message, statusCode);
};

// 失败响应
const error = (res, message = '操作失败', statusCode = 400, data = null) => {
    return sendResponse(res, false, data, message, statusCode);
};

// 创建资源成功
const created = (res, data = null, message = '创建成功') => {
    return sendResponse(res, true, data, message, 201);
};

// 未找到
const notFound = (res, message = '资源不存在', data = null) => {
    return sendResponse(res, false, data, message, 404);
};

// 未授权
const unauthorized = (res, message = '未授权访问', data = null) => {
    return sendResponse(res, false, data, message, 401);
};

// 禁止访问
const forbidden = (res, message = '禁止访问', data = null) => {
    return sendResponse(res, false, data, message, 403);
};

module.exports = {
    sendResponse,
    success,
    error,
    created,
    notFound,
    unauthorized,
    forbidden
};
