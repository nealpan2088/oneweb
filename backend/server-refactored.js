/**
 * 云信旺店 - 重构后的后端API服务器
 * 版本: 1.2.0
 * 特性: 模块化架构、统一响应格式、API版本控制
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

// 中间件和配置
const responseFormatter = require('./../src/middleware/responseFormatter');
const mainRouter = require('./../src/routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 安全配置 ====================

// 信任代理（Nginx 反向代理时使用）
if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
}

// CORS 配置
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : ['*'];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('不允许的源'));
        }
    },
    credentials: true
}));

// JSON 解析限制
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ==================== 限流配置 ====================

// 通用限流
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 100, // 每个 IP 最多 100 次请求
    message: { error: '请求过于频繁，请稍后再试' },
    standardHeaders: true,
    legacyHeaders: false
});

// 敏感操作限流（更严格）
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: '操作过于频繁，请稍后再试' },
    standardHeaders: true,
    legacyHeaders: false
});

// 应用限流中间件
app.use(generalLimiter);
app.use('/api/v1/shops/:id/reviews', strictLimiter);
app.use('/api/v1/shops/:id/wifi', strictLimiter);

// ==================== 中间件 ====================

// 统一响应格式中间件
app.use(responseFormatter);

// 请求日志中间件
app.use((req, res, next) => {
    const startTime = Date.now();
    
    // 请求完成后的日志记录
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    
    next();
});

// ==================== 路由配置 ====================

// 主API路由
app.use(mainRouter);

// 旧API兼容路由（逐步迁移）
app.use('/api/shop/:id', require('./legacy-compatibility'));

// ==================== 静态文件服务 ====================

// 提供前端静态文件
app.use(express.static(path.join(__dirname, '../frontend')));

// ==================== 错误处理 ====================

// 404 处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        data: null,
        message: '请求的资源不存在',
        timestamp: new Date().toISOString()
    });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    
    // 处理限流错误
    if (err.type === 'rate-limit-exceeded') {
        return res.status(429).json({
            success: false,
            data: null,
            message: '请求过于频繁，请稍后再试',
            timestamp: new Date().toISOString()
        });
    }
    
    // 处理Joi验证错误
    if (err.isJoi) {
        return res.status(400).json({
            success: false,
            data: null,
            message: err.details[0].message,
            timestamp: new Date().toISOString()
        });
    }
    
    // 默认错误处理
    res.status(500).json({
        success: false,
        data: null,
        message: process.env.NODE_ENV === 'production' 
            ? '服务器内部错误' 
            : err.message,
        timestamp: new Date().toISOString()
    });
});

// ==================== 服务器启动 ====================

// 数据库连接检查
const { db } = require('./../src/config/database');

db.get('SELECT 1', (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
        process.exit(1);
    }
    
    console.log('数据库连接成功');
    
    // 启动服务器
    app.listen(PORT, () => {
        console.log(`
=========================================
云信旺店后端API服务器
版本: 1.2.0 (API规范化版本)
端口: ${PORT}
环境: ${process.env.NODE_ENV || 'development'}
时间: ${new Date().toISOString()}
=========================================
API端点:
  http://localhost:${PORT}/api/v1/health
  http://localhost:${PORT}/api/v1/docs
  http://localhost:${PORT}/api/v1/shops
=========================================
        `);
    });
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，正在关闭服务器...');
    db.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('收到SIGINT信号，正在关闭服务器...');
    db.close();
    process.exit(0);
});

module.exports = app;