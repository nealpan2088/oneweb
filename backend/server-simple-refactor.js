/**
 * 简化的API规范化版本 - 修复版
 * 保持现有功能，添加API版本控制和统一响应格式
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3002; // 使用不同端口测试

// ==================== 数据库配置 ====================

const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/shop.db');
const db = new sqlite3.Database(dbPath);

// ==================== 中间件配置 ====================

// CORS配置
app.use(cors({
    origin: '*',
    credentials: true
}));

// JSON解析
app.use(express.json({ limit: '1mb' }));

// 统一响应格式中间件
app.use((req, res, next) => {
    // 保存原始的res.json方法
    const originalJson = res.json;
    
    // 重写res.json方法
    res.json = function(data, statusCode = 200) {
        // 如果已经是标准格式，直接返回
        if (data && typeof data === 'object' && 'success' in data) {
            return originalJson.call(this, data);
        }
        
        // 如果是错误响应
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
        return this.status(statusCode).json({
            success: true,
            data: data,
            message: message,
            timestamp: new Date().toISOString()
        });
    };
    
    res.error = function(message = '操作失败', statusCode = 400, data = null) {
        return this.status(statusCode).json({
            success: false,
            data: data,
            message: message,
            timestamp: new Date().toISOString()
        });
    };
    
    next();
});

// ==================== 限流配置 ====================

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: '请求过于频繁，请稍后再试' }
});

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: '操作过于频繁，请稍后再试' }
});

app.use(generalLimiter);

// ==================== 健康检查 ====================

app.get('/health', (req, res) => {
    db.get('SELECT 1', (err) => {
        const checks = {
            status: 'ok',
            version: '1.2.0',
            codename: 'API规范化版',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: err ? 'error' : 'ok'
        };
        
        checks.status = checks.database === 'ok' ? 'ok' : 'degraded';
        res.json(checks);
    });
});

// ==================== v1 API 路由 ====================

const v1Router = express.Router();

// 获取店铺列表
v1Router.get('/shops', (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(parseInt(limit) || 20, 100);
    const offset = (parseInt(page) - 1) * safeLimit;
    
    db.all(
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
        [safeLimit, offset],
        (err, shops) => {
            if (err) {
                console.error('数据库错误:', err);
                return res.error('获取店铺列表失败', 500);
            }
            
            db.get('SELECT COUNT(*) as total FROM shops WHERE status = 1', (err, count) => {
                if (err) {
                    console.error('数据库错误:', err);
                    return res.error('获取总数失败', 500);
                }
                
                res.success({
                    items: shops,
                    pagination: {
                        page: parseInt(page),
                        limit: safeLimit,
                        total: count.total,
                        pages: Math.ceil(count.total / safeLimit)
                    }
                });
            });
        }
    );
});

// 获取单个店铺
v1Router.get('/shops/:id', (req, res) => {
    const shopId = parseInt(req.params.id);
    
    if (isNaN(shopId)) {
        return res.error('无效的店铺ID', 400);
    }
    
    db.get(
        `SELECT id, name, description, address, phone, 
                business_hours, latitude, longitude, 
                wechat_qr, wechat_id, wifi_ssid, wifi_password,
                show_wechat_button, show_wifi_button, 
                show_map, show_reviews, status,
                created_at, updated_at
         FROM shops 
         WHERE id = ? AND status = 1`,
        [shopId],
        (err, shop) => {
            if (err) {
                console.error('数据库错误:', err);
                return res.error('获取店铺失败', 500);
            }
            
            if (!shop) {
                return res.error('店铺不存在', 404);
            }
            
            res.success(shop);
        }
    );
});

// 获取店铺评价
v1Router.get('/shops/:id/reviews', (req, res) => {
    const shopId = parseInt(req.params.id);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    
    if (isNaN(shopId)) {
        return res.error('无效的店铺ID', 400);
    }
    
    db.all(
        `SELECT id, shop_id, customer_name, avatar_url, 
                rating, content, reply, is_visible, created_at
         FROM reviews 
         WHERE shop_id = ? AND is_visible = 1 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [shopId, limit],
        (err, reviews) => {
            if (err) {
                console.error('数据库错误:', err);
                return res.error('获取评价失败', 500);
            }
            
            res.success(reviews);
        }
    );
});

// 获取店铺统计
v1Router.get('/shops/:id/stats', strictLimiter, (req, res) => {
    const shopId = parseInt(req.params.id);
    
    if (isNaN(shopId)) {
        return res.error('无效的店铺ID', 400);
    }
    
    db.get('SELECT COUNT(*) as total_visits FROM visit_logs WHERE shop_id = ?', [shopId], (err, visitCount) => {
        if (err) {
            return res.error('数据库错误', 500);
        }
        
        db.get('SELECT COUNT(*) as total_reviews, AVG(rating) as avg_rating FROM reviews WHERE shop_id = ?', 
            [shopId], 
            (err, reviewStats) => {
                if (err) {
                    return res.error('数据库错误', 500);
                }
                
                res.success({
                    visits: visitCount.total_visits,
                    reviews: reviewStats.total_reviews,
                    avgRating: reviewStats.avg_rating ? reviewStats.avg_rating.toFixed(1) : 0
                });
            }
        );
    });
});

// 记录访问
v1Router.post('/shops/:id/visit', (req, res) => {
    const shopId = parseInt(req.params.id);
    const { action = 'view' } = req.body;
    
    if (isNaN(shopId)) {
        return res.error('无效的店铺ID', 400);
    }
    
    const visitorIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    
    db.run(
        `INSERT INTO visit_logs (shop_id, visitor_ip, user_agent, action)
         VALUES (?, ?, ?, ?)`,
        [shopId, visitorIp, userAgent, action],
        function(err) {
            if (err) {
                console.error('数据库错误:', err);
                // 访问记录失败不影响响应
                return res.success({ recorded: false }, '访问记录失败，但不影响使用');
            }
            
            res.success({ recorded: true, id: this.lastID }, '访问记录成功');
        }
    );
});

// 获取WiFi信息
v1Router.get('/shops/:id/wifi', strictLimiter, (req, res) => {
    const shopId = parseInt(req.params.id);
    
    if (isNaN(shopId)) {
        return res.error('无效的店铺ID', 400);
    }
    
    db.get(
        `SELECT wifi_ssid, wifi_password, show_wifi_button 
         FROM shops 
         WHERE id = ? AND status = 1`,
        [shopId],
        (err, shop) => {
            if (err) {
                console.error('数据库错误:', err);
                return res.error('获取WiFi信息失败', 500);
            }
            
            if (!shop) {
                return res.error('店铺不存在', 404);
            }
            
            res.success({
                ssid: shop.wifi_ssid || '',
                password: shop.wifi_password || '',
                show_wifi_button: shop.show_wifi_button || 0
            });
        }
    );
});

// 提交WiFi访问
v1Router.post('/shops/:id/wifi', strictLimiter, (req, res) => {
    const shopId = parseInt(req.params.id);
    
    if (isNaN(shopId)) {
        return res.error('无效的店铺ID', 400);
    }
    
    // 记录WiFi访问
    const visitorIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    
    db.run(
        `INSERT INTO visit_logs (shop_id, visitor_ip, user_agent, action)
         VALUES (?, ?, ?, 'click_wifi')`,
        [shopId, visitorIp, userAgent],
        function(err) {
            if (err) {
                console.error('数据库错误:', err);
                // 继续返回WiFi信息
            }
            
            // 获取WiFi信息
            db.get(
                `SELECT wifi_ssid, wifi_password, show_wifi_button 
                 FROM shops 
                 WHERE id = ? AND status = 1`,
                [shopId],
                (err, shop) => {
                    if (err || !shop) {
                        return res.error('获取WiFi信息失败', 500);
                    }
                    
                    res.success({
                        ssid: shop.wifi_ssid || '',
                        password: shop.wifi_password || '',
                        show_wifi_button: shop.show_wifi_button || 0
                    }, 'WiFi信息获取成功');
                }
            );
        }
    );
});

// 注册v1路由
app.use('/api/v1', v1Router);

// ==================== API文档 ====================

app.get('/api/v1/docs', (req, res) => {
    res.success({
        version: 'v1',
        endpoints: {
            shops: {
                'GET /shops': '获取店铺列表',
                'GET /shops/:id': '获取单个店铺',
                'GET /shops/:id/reviews': '获取店铺评价',
                'GET /shops/:id/stats': '获取店铺统计',
                'POST /shops/:id/visit': '记录访问',
                'GET /shops/:id/wifi': '获取WiFi信息',
                'POST /shops/:id/wifi': '提交WiFi访问'
            }
        },
        responseFormat: {
            success: 'boolean - 是否成功',
            data: 'any - 返回数据',
            message: 'string - 消息',
            timestamp: 'string - 时间戳'
        }
    }, 'API文档');
});

// ==================== 静态文件服务 ====================

app.use(express.static(path.join(__dirname, '../frontend')));

// ==================== 错误处理 ====================

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        data: null,
        message: '请求的资源不存在',
        timestamp: new Date().toISOString()
    });
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    
    res.status(500).json({
        success: false,
        data: null,
        message: '服务器内部错误',
        timestamp: new Date().toISOString()
    });
});

// ==================== 服务器启动 ====================

db.get('SELECT 1', (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
        process.exit(1);
    }
    
    console.log('数据库连接成功');
    
    app.listen(PORT, () => {
        console.log(`
=========================================
云信旺店 - 新版API测试服务器
版本: 1.2.0 (API规范化测试版)
端口: ${PORT}
时间: ${new Date().toISOString()}
=========================================
测试端点:
  http://localhost:${PORT}/health
  http://localhost:${PORT}/api/v1/docs
  http://localhost:${PORT}/api/v1/shops
  http://localhost:${PORT}/api/v1/shops/3
  http://localhost:${PORT}/api/v1/shops/3/reviews
  http://localhost:${PORT}/api/v1/shops/3/stats
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