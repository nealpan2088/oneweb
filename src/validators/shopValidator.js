/**
 * 店铺数据验证器
 */
const Joi = require('joi');

// 店铺创建/更新验证规则
const shopSchema = Joi.object({
  name: Joi.string().min(1).max(100).required()
    .messages({
      'string.empty': '店铺名称不能为空',
      'string.max': '店铺名称不能超过100个字符',
      'any.required': '店铺名称是必填项'
    }),
  
  description: Joi.string().max(500).optional()
    .messages({
      'string.max': '店铺描述不能超过500个字符'
    }),
  
  address: Joi.string().min(1).max(200).required()
    .messages({
      'string.empty': '店铺地址不能为空',
      'string.max': '店铺地址不能超过200个字符',
      'any.required': '店铺地址是必填项'
    }),
  
  phone: Joi.string().pattern(/^[0-9+\-\s()]{7,20}$/).optional()
    .messages({
      'string.pattern.base': '电话号码格式不正确'
    }),
  
  business_hours: Joi.string().optional(),
  
  latitude: Joi.number().min(-90).max(90).optional()
    .messages({
      'number.min': '纬度必须在-90到90之间',
      'number.max': '纬度必须在-90到90之间'
    }),
  
  longitude: Joi.number().min(-180).max(180).optional()
    .messages({
      'number.min': '经度必须在-180到180之间',
      'number.max': '经度必须在-180到180之间'
    }),
  
  wechat_qr: Joi.string().uri().optional()
    .messages({
      'string.uri': '微信二维码必须是有效的URL'
    }),
  
  wechat_id: Joi.string().max(50).optional(),
  
  wifi_ssid: Joi.string().max(50).optional(),
  
  wifi_password: Joi.string().max(50).optional(),
  
  show_wechat_button: Joi.number().valid(0, 1).default(1),
  show_wifi_button: Joi.number().valid(0, 1).default(1),
  show_map: Joi.number().valid(0, 1).default(1),
  show_reviews: Joi.number().valid(0, 1).default(1),
  status: Joi.number().valid(0, 1).default(1)
});

// 评价验证规则
const reviewSchema = Joi.object({
  customer_name: Joi.string().min(1).max(50).required()
    .messages({
      'string.empty': '顾客姓名不能为空',
      'string.max': '顾客姓名不能超过50个字符',
      'any.required': '顾客姓名是必填项'
    }),
  
  rating: Joi.number().min(1).max(5).required()
    .messages({
      'number.min': '评分必须在1-5之间',
      'number.max': '评分必须在1-5之间',
      'any.required': '评分是必填项'
    }),
  
  content: Joi.string().min(1).max(500).required()
    .messages({
      'string.empty': '评价内容不能为空',
      'string.max': '评价内容不能超过500个字符',
      'any.required': '评价内容是必填项'
    }),
  
  avatar_url: Joi.string().uri().optional()
    .messages({
      'string.uri': '头像URL必须是有效的URL'
    }),
  
  reply: Joi.string().max(500).optional()
});

// 验证中间件
const validateShop = (req, res, next) => {
  const { error } = shopSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      data: null,
      message: error.details[0].message,
      timestamp: new Date().toISOString()
    });
  }
  next();
};

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      data: null,
      message: error.details[0].message,
      timestamp: new Date().toISOString()
    });
  }
  next();
};

module.exports = {
  validateShop,
  validateReview
};