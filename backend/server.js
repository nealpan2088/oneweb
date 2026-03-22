// 云信旺店小程序 1.0 - 后端 API（生产优化版）

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

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
    }
}));

// JSON 解析限制（防止大 payload 攻击）
app.use(express.json({ limit: '1mb' }));

// ==================== 限流配置 ====================

// 通用限流
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 100, // 每个 IP 最多 100 次请求
    message: { error: '请求过于频繁，请稍后再试' }
});

// 敏感操作限流（更严格）
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: '操作过于频繁，请稍后再试' }
});

app.use('/api/', generalLimiter);

// ==================== 数据库连接 ====================

const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/shop.db');
const db = new sqlite3.Database(dbPath);

// 启用外键约束
db.run('PRAGMA foreign_keys = ON');

// 初始化数据库
db.serialize(() => {
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const fs = require('fs');
    
    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema, (err) => {
            if (err) {
                console.error('❌ 数据库初始化失败:', err.message);
            } else {
                console.log('✅ 数据库初始化完成');
            }
        });
    } else {
        console.log('⚠️  数据库结构文件不存在，跳过初始化');
    }
});

// ==================== 工具函数 ====================

// WiFi 密码加密
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

function encryptPassword(password) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decryptPassword(encrypted) {
    try {
        const parts = encrypted.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedData = parts[1];
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        console.error('解密失败:', e.message);
        return encrypted; // 解密失败返回原文
    }
}

// HTML 转义（防 XSS）
function escapeHtml(text) {
    if (!text) return '';
    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, char => escapeMap[char]);
}

// IP 脱敏
function anonymizeIp(ip) {
    if (!ip) return 'unknown';
    // IPv4: 192.168.1.100 → 192.168.1.0
    if (ip.includes('.')) {
        return ip.replace(/\.\d+$/, '.0');
    }
    // IPv6: 简化处理
    return ip.substring(0, 4) + '::';
}

// ==================== 中间件 ====================

// 请求日志
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
});

// ==================== API 路由 ====================

// 健康检查（带深度检测）
app.get('/health', (req, res) => {
    const checks = {
        status: 'ok',
        version: '1.1.0',
        codename: '万象更新',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'unknown'
    };
    
    db.get('SELECT 1', (err) => {
        checks.database = err ? 'error' : 'ok';
        checks.status = checks.database === 'ok' ? 'ok' : 'degraded';
        res.json(checks);
    });
});

// 获取店铺信息
app.get('/api/shop/:id', (req, res) => {
    const shopId = parseInt(req.params.id);
    
    if (isNaN(shopId) || shopId < 1) {
        return res.status(400).json({ error: '无效的店铺 ID' });
    }
    
    db.get('SELECT * FROM shops WHERE id = ? AND status = 1', [shopId], (err, shop) => {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({ error: '数据库错误' });
        }
        if (!shop) {
            return res.status(404).json({ error: '店铺不存在或已暂停营业' });
        }
        
        // 不返回敏感字段
        const safeShop = {
            id: shop.id,
            name: escapeHtml(shop.name),
            description: escapeHtml(shop.description),
            address: escapeHtml(shop.address),
            phone: escapeHtml(shop.phone),
            business_hours: shop.business_hours,
            latitude: shop.latitude,
            longitude: shop.longitude,
            wechat_id: escapeHtml(shop.wechat_id),
            show_wechat_button: shop.show_wechat_button,
            show_wifi_button: shop.show_wifi_button,
            show_map: shop.show_map,
            show_reviews: shop.show_reviews,
            status: shop.status
        };
        
        res.json(safeShop);
    });
});

// 获取 WiFi 密码（需要验证）
app.post('/api/shop/:id/wifi', strictLimiter, (req, res) => {
    const shopId = parseInt(req.params.id);
    const { action } = req.body;
    
    if (isNaN(shopId)) {
        return res.status(400).json({ error: '无效的店铺 ID' });
    }
    
    if (action !== 'confirm') {
        return res.status(400).json({ error: '请先确认已加微信' });
    }
    
    db.get('SELECT wifi_ssid, wifi_password FROM shops WHERE id = ? AND show_wifi_button = 1', 
        [shopId], 
        (err, shop) => {
            if (err) {
                console.error('数据库错误:', err);
                return res.status(500).json({ error: '数据库错误' });
            }
            if (!shop) {
                return res.status(404).json({ error: '店铺未配置 WiFi' });
            }
            
            // 解密 WiFi 密码
            const password = decryptPassword(shop.wifi_password);
            
            // 记录访问
            db.run('INSERT INTO visit_logs (shop_id, visitor_ip, action) VALUES (?, ?, ?)',
                [shopId, anonymizeIp(req.ip), 'click_wifi']);
            
            res.json({
                ssid: shop.wifi_ssid,
                password: password
            });
        }
    );
});

// 获取评价列表
app.get('/api/shop/:id/reviews', (req, res) => {
    const shopId = parseInt(req.params.id);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // 最多 100 条
    
    if (isNaN(shopId)) {
        return res.status(400).json({ error: '无效的店铺 ID' });
    }
    
    db.all('SELECT * FROM reviews WHERE shop_id = ? AND is_visible = 1 ORDER BY created_at DESC LIMIT ?', 
        [shopId, limit], 
        (err, reviews) => {
            if (err) {
                console.error('数据库错误:', err);
                return res.status(500).json({ error: '数据库错误' });
            }
            
            // 转义用户输入
            const safeReviews = reviews.map(r => ({
                ...r,
                customer_name: escapeHtml(r.customer_name),
                content: escapeHtml(r.content),
                reply: r.reply ? escapeHtml(r.reply) : null
            }));
            
            res.json(safeReviews);
        }
    );
});

// 提交评价
app.post('/api/shop/:id/reviews', strictLimiter, (req, res) => {
    const shopId = parseInt(req.params.id);
    const { customer_name, rating, content } = req.body;
    
    if (isNaN(shopId)) {
        return res.status(400).json({ error: '无效的店铺 ID' });
    }
    
    // 参数校验
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: '评分必须是 1-5 的数字' });
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: '评价内容不能为空' });
    }
    if (content.length > 500) {
        return res.status(400).json({ error: '评价内容不能超过 500 字' });
    }
    
    const sql = 'INSERT INTO reviews (shop_id, customer_name, rating, content, is_visible) VALUES (?, ?, ?, ?, 0)';
    
    db.run(sql, [shopId, customer_name || '匿名顾客', rating, content.trim()], function(err) {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({ error: '数据库错误' });
        }
        
        // 记录访问
        db.run('INSERT INTO visit_logs (shop_id, visitor_ip, action) VALUES (?, ?, ?)',
            [shopId, anonymizeIp(req.ip), 'submit_review']);
        
        res.json({ 
            success: true, 
            id: this.lastID,
            message: '评价提交成功，审核通过后显示' 
        });
    });
});

// 记录访问
app.post('/api/shop/:id/visit', (req, res) => {
    const shopId = parseInt(req.params.id);
    const { action } = req.body;
    
    if (isNaN(shopId)) {
        return res.status(400).json({ error: '无效的店铺 ID' });
    }
    
    const validActions = ['view', 'click_wechat', 'click_wifi', 'submit_review', 'navigate'];
    const safeAction = validActions.includes(action) ? action : 'view';
    
    db.run('INSERT INTO visit_logs (shop_id, visitor_ip, user_agent, action) VALUES (?, ?, ?, ?)',
        [shopId, anonymizeIp(req.ip), req.get('user-agent')?.slice(0, 200), safeAction],
        (err) => {
            if (err) console.error('记录访问失败:', err);
            res.json({ success: true });
        }
    );
});

// 获取店铺统计（管理员用 - 生产环境需加认证）
app.get('/api/shop/:id/stats', strictLimiter, (req, res) => {
    const shopId = parseInt(req.params.id);
    
    if (isNaN(shopId)) {
        return res.status(400).json({ error: '无效的店铺 ID' });
    }
    
    // TODO: 生产环境需添加管理员认证
    // if (!req.headers.authorization) {
    //     return res.status(401).json({ error: '需要管理员认证' });
    // }
    
    db.get('SELECT COUNT(*) as total_visits FROM visit_logs WHERE shop_id = ?', [shopId], (err, visitCount) => {
        if (err) {
            return res.status(500).json({ error: '数据库错误' });
        }
        
        db.get('SELECT COUNT(*) as total_reviews, AVG(rating) as avg_rating FROM reviews WHERE shop_id = ?', 
            [shopId], 
            (err, reviewStats) => {
                if (err) {
                    return res.status(500).json({ error: '数据库错误' });
                }
                
                res.json({
                    visits: visitCount.total_visits,
                    reviews: reviewStats.total_reviews,
                    avgRating: reviewStats.avg_rating ? reviewStats.avg_rating.toFixed(1) : 0
                });
            }
        );
    });
});

// ==================== 错误处理 ====================

// 404
app.use((req, res) => {
    res.status(404).json({ error: '接口不存在' });
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('未处理错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
});

// ==================== 启动服务 ====================

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 云信旺店后端服务已启动');
    console.log(`📍 监听端口：${PORT}`);
    console.log(`🏥 健康检查：http://localhost:${PORT}/health`);
    console.log(`🔒 安全加固：已启用`);
    console.log(`🛡️  限流保护：已启用`);
});

// ==================== 优雅关闭 ====================

function gracefulShutdown(signal) {
    console.log(`\n收到${signal}信号，正在关闭服务...`);
    server.close(() => {
        console.log('HTTP 服务已关闭');
        db.close((err) => {
            if (err) {
                console.error('数据库关闭失败:', err);
            } else {
                console.log('数据库连接已关闭');
            }
            process.exit(0);
        });
    });
    
    // 强制退出（10 秒后）
    setTimeout(() => {
        console.error('未能优雅关闭，强制退出');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
