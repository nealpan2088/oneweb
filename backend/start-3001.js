#!/usr/bin/env node

// 云信旺店小程序 1.0 - 后端 API（端口3001版本）

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 3002; // 使用3002端口

// ==================== 安全配置 ====================

// 信任代理（Nginx 反向代理时使用）
if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
}

// CORS 配置（生产环境限制域名）
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
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个IP限制100个请求
    standardHeaders: true,
    legacyHeaders: false,
    message: '请求过于频繁，请稍后再试'
});

app.use(limiter);

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== 数据库配置 ====================

const dbPath = path.join(__dirname, '../database/shop.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
        process.exit(1);
    }
    console.log('✅ 数据库连接成功:', dbPath);
});

// 数据库工具函数
function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
}

// ==================== 健康检查 ====================

app.get('/health', async (req, res) => {
    try {
        const tables = await query("SELECT name FROM sqlite_master WHERE type='table'");
        
        res.json({
            status: 'ok',
            service: 'yunxin-wangdian-backend',
            version: '1.1.0',
            port: PORT,
            timestamp: new Date().toISOString(),
            database: {
                connected: true,
                tables: tables.length,
                path: dbPath
            },
            endpoints: {
                health: 'GET /health',
                shop_info: 'GET /api/shop/:id',
                shop_list: 'GET /api/shops',
                create_shop: 'POST /api/shop',
                update_shop: 'PUT /api/shop/:id',
                reviews: 'GET /api/shop/:id/reviews',
                create_review: 'POST /api/review',
                stats: 'GET /api/stats/:shopId'
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// ==================== API 路由 ====================

// 获取店铺列表
app.get('/api/shops', async (req, res) => {
    try {
        const shops = await query(`
            SELECT id, name, description, address, phone, 
                   business_hours, latitude, longitude, 
                   created_at, updated_at
            FROM shops
            WHERE status = 'active'
            ORDER BY created_at DESC
        `);
        
        res.json({
            success: true,
            data: shops
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取店铺列表失败',
            error: error.message
        });
    }
});

// 获取单个店铺信息
app.get('/api/shop/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const shops = await query(`
            SELECT * FROM shops WHERE id = ? AND status = 'active'
        `, [id]);
        
        if (shops.length === 0) {
            return res.status(404).json({
                success: false,
                message: '店铺不存在'
            });
        }
        
        // 获取店铺评价
        const reviews = await query(`
            SELECT * FROM reviews 
            WHERE shop_id = ? AND status = 'approved'
            ORDER BY created_at DESC
            LIMIT 20
        `, [id]);
        
        // 获取访问统计
        const stats = await query(`
            SELECT COUNT(*) as visit_count 
            FROM visit_logs 
            WHERE shop_id = ? AND DATE(created_at) = DATE('now')
        `, [id]);
        
        res.json({
            success: true,
            data: {
                shop: shops[0],
                reviews: reviews,
                today_visits: stats[0]?.visit_count || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取店铺信息失败',
            error: error.message
        });
    }
});

// 创建店铺
app.post('/api/shop', async (req, res) => {
    try {
        const { name, description, address, phone, business_hours, latitude, longitude } = req.body;
        
        if (!name || !address) {
            return res.status(400).json({
                success: false,
                message: '店铺名称和地址不能为空'
            });
        }
        
        const result = await run(`
            INSERT INTO shops 
            (name, description, address, phone, business_hours, latitude, longitude, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
        `, [name, description, address, phone, business_hours, latitude, longitude]);
        
        res.json({
            success: true,
            message: '店铺创建成功',
            data: { id: result.id }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '创建店铺失败',
            error: error.message
        });
    }
});

// 更新店铺信息
app.put('/api/shop/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, address, phone, business_hours, latitude, longitude } = req.body;
        
        const result = await run(`
            UPDATE shops SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                address = COALESCE(?, address),
                phone = COALESCE(?, phone),
                business_hours = COALESCE(?, business_hours),
                latitude = COALESCE(?, latitude),
                longitude = COALESCE(?, longitude),
                updated_at = datetime('now')
            WHERE id = ?
        `, [name, description, address, phone, business_hours, latitude, longitude, id]);
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: '店铺不存在'
            });
        }
        
        res.json({
            success: true,
            message: '店铺信息更新成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '更新店铺信息失败',
            error: error.message
        });
    }
});

// 获取店铺评价
app.get('/api/shop/:id/reviews', async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 20, offset = 0 } = req.query;
        
        const reviews = await query(`
            SELECT * FROM reviews 
            WHERE shop_id = ? AND status = 'approved'
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [id, parseInt(limit), parseInt(offset)]);
        
        const total = await query(`
            SELECT COUNT(*) as count FROM reviews 
            WHERE shop_id = ? AND status = 'approved'
        `, [id]);
        
        res.json({
            success: true,
            data: reviews,
            pagination: {
                total: total[0]?.count || 0,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取评价失败',
            error: error.message
        });
    }
});

// 创建评价
app.post('/api/review', async (req, res) => {
    try {
        const { shop_id, customer_name, rating, content, contact } = req.body;
        
        if (!shop_id || !customer_name || !rating || !content) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
            });
        }
        
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: '评分必须在1-5之间'
            });
        }
        
        const result = await run(`
            INSERT INTO reviews 
            (shop_id, customer_name, rating, content, contact, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
        `, [shop_id, customer_name, rating, content, contact]);
        
        res.json({
            success: true,
            message: '评价提交成功，等待审核',
            data: { id: result.id }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '提交评价失败',
            error: error.message
        });
    }
});

// 获取统计信息
app.get('/api/stats/:shopId', async (req, res) => {
    try {
        const { shopId } = req.params;
        const { period = 'today' } = req.query;
        
        let dateCondition = "DATE(created_at) = DATE('now')";
        if (period === 'week') {
            dateCondition = "created_at >= datetime('now', '-7 days')";
        } else if (period === 'month') {
            dateCondition = "created_at >= datetime('now', '-30 days')";
        }
        
        const visits = await query(`
            SELECT COUNT(*) as count FROM visit_logs 
            WHERE shop_id = ? AND ${dateCondition}
        `, [shopId]);
        
        const reviews = await query(`
            SELECT COUNT(*) as count, AVG(rating) as avg_rating 
            FROM reviews 
            WHERE shop_id = ? AND status = 'approved' AND ${dateCondition}
        `, [shopId]);
        
        res.json({
            success: true,
            data: {
                visits: visits[0]?.count || 0,
                reviews: reviews[0]?.count || 0,
                avg_rating: reviews[0]?.avg_rating || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取统计信息失败',
            error: error.message
        });
    }
});

// 记录访问日志
app.post('/api/visit', async (req, res) => {
    try {
        const { shop_id, user_agent, ip_address } = req.body;
        
        if (!shop_id) {
            return res.status(400).json({
                success: false,
                message: '缺少店铺ID'
            });
        }
        
        await run(`
            INSERT INTO visit_logs 
            (shop_id, user_agent, ip_address, created_at)
            VALUES (?, ?, ?, datetime('now'))
        `, [shop_id, user_agent, ip_address]);
        
        res.json({
            success: true,
            message: '访问记录成功'
        });
    } catch (error) {
        // 访问记录失败不影响主流程
        console.error('记录访问日志失败:', error);
        res.json({
            success: true,
            message: '访问记录失败，但不影响使用'
        });
    }
});

// ==================== 错误处理 ====================

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在',
        path: req.path
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ==================== 启动服务 ====================

// 检查数据库表
async function checkDatabase() {
    try {
        const tables = await query("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('📊 数据库表列表:');
        tables.forEach(table => console.log(`  - ${table.name}`));
        return true;
    } catch (error) {
        console.error('数据库检查失败:', error);
        return false;
    }
}

// 启动服务器
async function startServer() {
    try {
        console.log('='.repeat(60));
        console.log('🏪 云信旺店单店版 - 后端服务器');
        console.log('='.repeat(60));
        
        // 检查数据库
        console.log('🔍 检查数据库...');
        const dbOk = await checkDatabase();
        if (!dbOk) {
            console.error('❌ 数据库检查失败，服务无法启动');
            process.exit(1);
        }
        
        // 启动服务
        app.listen(PORT, () => {
            console.log(`🚀 后端服务器已启动`);
            console.log(`📍 端口: ${PORT}`);
            console.log(`🌐 地址: http://localhost:${PORT}`);
            console.log(`📊 健康检查: http://localhost:${PORT}/health`);
            console.log('');
            console.log('📋 可用接口:');
            console.log(`  GET  /health                    - 健康检查`);
            console.log(`  GET  /api/shops                - 获取店铺列表`);
            console.log(`  GET  /api/shop/:id             - 获取店铺详情`);
            console.log(`  POST /api/shop                 - 创建店铺`);
            console.log(`  PUT  /api/shop/:id             - 更新店铺`);
            console.log(`  GET  /api/shop/:id/reviews     - 获取店铺评价`);
            console.log(`  POST /api/review               - 创建评价`);
            console.log(`  GET  /api/stats/:shopId        - 获取统计信息`);
            console.log(`  POST /api/visit                - 记录访问`);
            console.log('');
            console.log('✅ 云信旺店单店版后端准备就绪！');
            console.log('='.repeat(60));
        });
        
    } catch (error) {
        console.error('❌ 启动服务器失败:', error);
        process.exit(1);
    }
}

// 处理进程退出
process.on('SIGINT', () => {
    console.log('\n🛑 收到关闭信号，正在关闭服务器...');
    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 收到终止信号，正在关闭服务器...');
    db.close();
    process.exit(0);
});

// 启动服务
startServer();