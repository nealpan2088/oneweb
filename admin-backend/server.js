// 云信旺店管理后台 - 后端 API
// 版本：v1.0.0-admin
// 端口：3001
// 说明：与前端 API 后端（3000 端口）独立运行，互不干扰

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;

// ==================== 配置 ====================

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_TIMEOUT = parseInt(process.env.SESSION_TIMEOUT) || 24; // 小时
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/shop.db');

console.log('📋 管理后台配置：');
console.log(`   - 端口：${PORT}`);
console.log(`   - 数据库：${DB_PATH}`);
console.log(`   - 会话超时：${SESSION_TIMEOUT}小时`);

// ==================== 数据库连接 ====================

const db = new sqlite3.Database(DB_PATH);
db.run('PRAGMA foreign_keys = ON');

// ==================== 中间件 ====================

// CORS 配置
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON 解析
app.use(express.json());

// ==================== 工具函数 ====================

// 生成 JWT Token
function generateToken(userId, username, role) {
    const payload = {
        user_id: userId,
        username,
        role,
        exp: Date.now() + SESSION_TIMEOUT * 60 * 60 * 1000
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// 验证 Token
function verifyToken(token) {
    try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
        if (payload.exp < Date.now()) {
            return null;
        }
        return payload;
    } catch (e) {
        return null;
    }
}

// 密码哈希（简单版，生产环境建议用 bcrypt）
function hashPassword(password) {
    return crypto.createHash('sha256').update(password + JWT_SECRET).digest('hex');
}

// HTML 转义
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 记录操作日志
function logAction(userId, username, action, targetType, targetId, targetName, oldValue, newValue, ipAddress, userAgent, status = 'success', errorMessage = null) {
    const changes = {};
    if (oldValue && newValue) {
        try {
            const old = JSON.parse(oldValue);
            const newV = JSON.parse(newValue);
            for (const key in newV) {
                if (old[key] !== newV[key]) {
                    changes[key] = { old: old[key], new: newV[key] };
                }
            }
        } catch (e) {}
    }
    
    db.run(`
        INSERT INTO admin_logs (user_id, username, action, target_type, target_id, target_name, old_value, new_value, changes, ip_address, user_agent, status, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, username, action, targetType, targetId, targetName, oldValue, newValue, JSON.stringify(changes), ipAddress, userAgent, status, errorMessage]);
}

// ==================== 认证中间件 ====================

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未登录', code: 'UNAUTHORIZED' });
    }
    
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
        return res.status(401).json({ error: '登录已过期', code: 'TOKEN_EXPIRED' });
    }
    
    // 验证会话是否存在
    db.get('SELECT * FROM admin_sessions WHERE token = ? AND expires_at > datetime("now")', [token], (err, session) => {
        if (err || !session) {
            return res.status(401).json({ error: '会话无效', code: 'INVALID_SESSION' });
        }
        
        req.user = payload;
        req.token = token;
        next();
    });
}

// 超管权限验证
function requireSuperAdmin(req, res, next) {
    if (req.user.role !== 'super_admin') {
        logAction(req.user.user_id, req.user.username, 'access_denied', 'system', null, '权限验证', null, null, req.ip, req.get('user-agent'), 'failed', '非超管尝试访问管理功能');
        return res.status(403).json({ error: '权限不足', code: 'FORBIDDEN' });
    }
    next();
}

// ==================== 公开 API ====================

// 健康检查
app.get('/health', (req, res) => {
    db.get('SELECT 1', (err) => {
        res.json({
            status: err ? 'error' : 'ok',
            version: '1.0.0-admin',
            codename: '管理先锋',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: err ? 'error' : 'ok'
        });
    });
});

// 登录
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    console.log('=== 登录尝试 ===');
    console.log('用户名:', username);
    console.log('密码:', password);
    
    if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    const passwordHash = hashPassword(password);
    console.log('计算的哈希:', passwordHash);
    
    db.get('SELECT * FROM admin_users WHERE username = ? AND password_hash = ? AND is_active = 1', [username, passwordHash], (err, user) => {
        console.log('查询结果:', user);
        console.log('查询错误:', err);
        
        if (err) {
            console.error('登录数据库错误:', err);
            return res.status(500).json({ error: '数据库错误' });
        }
        
        if (!user) {
            console.log('用户不存在或密码错误或未激活');
            logAction(null, null, 'login', 'user', null, username, null, null, req.ip, req.get('user-agent'), 'failed', '用户名或密码错误');
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        
        // 生成 Token
        const token = generateToken(user.id, user.username, user.role);
        const expiresAt = new Date(Date.now() + SESSION_TIMEOUT * 60 * 60 * 1000).toISOString();
        
        // 保存会话
        db.run('INSERT INTO admin_sessions (user_id, token, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
            [user.id, token, expiresAt, req.ip, req.get('user-agent')]);
        
        // 更新最后登录
        db.run('UPDATE admin_users SET last_login_at = datetime("now"), last_login_ip = ? WHERE id = ?', [req.ip, user.id]);
        
        // 记录日志
        logAction(user.id, user.username, 'login', 'user', user.id, user.username, null, null, req.ip, req.get('user-agent'), 'success');
        
        res.json({
            message: '登录成功',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                shop_id: user.shop_id,
                email: user.email,
                avatar_url: user.avatar_url
            }
        });
    });
});

// ==================== 认证 API ====================

// 获取当前用户信息
app.get('/api/admin/me', requireAuth, (req, res) => {
    db.get('SELECT id, username, role, shop_id, phone, email, avatar_url, last_login_at, created_at FROM admin_users WHERE id = ?', [req.user.user_id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: '数据库错误' });
        }
        res.json({ user });
    });
});

// 登出
app.post('/api/admin/logout', requireAuth, (req, res) => {
    db.run('DELETE FROM admin_sessions WHERE token = ?', [req.token], (err) => {
        if (err) {
            return res.status(500).json({ error: '数据库错误' });
        }
        
        logAction(req.user.user_id, req.user.username, 'logout', 'user', req.user.user_id, req.user.username, null, null, req.ip, req.get('user-agent'), 'success');
        res.json({ message: '登出成功' });
    });
});

// ==================== 店铺管理 API ====================

// 获取店铺列表（超管）
app.get('/api/admin/shops', requireAuth, requireSuperAdmin, (req, res) => {
    const { page = 1, limit = 20, shop_type, status } = req.query;
    const offset = (page - 1) * limit;
    
    let where = '1=1';
    const params = [];
    
    if (shop_type) {
        where += ' AND shop_type = ?';
        params.push(shop_type);
    }
    
    if (status !== undefined) {
        where += ' AND status = ?';
        params.push(parseInt(status));
    }
    
    db.all(`SELECT * FROM shops WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)], (err, shops) => {
        if (err) {
            return res.status(500).json({ error: '数据库错误' });
        }
        
        db.get('SELECT COUNT(*) as total FROM shops WHERE ' + where, params, (err, count) => {
            res.json({
                shops,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count.total
                }
            });
        });
    });
});

// 获取单个店铺详情
app.get('/api/admin/shops/:id', requireAuth, (req, res) => {
    const shopId = parseInt(req.params.id);
    
    db.get('SELECT * FROM shops WHERE id = ?', [shopId], (err, shop) => {
        if (err) {
            return res.status(500).json({ error: '数据库错误' });
        }
        
        if (!shop) {
            return res.status(404).json({ error: '店铺不存在' });
        }
        
        // 店铺管理员只能看自己的店铺
        if (req.user.role === 'shop_admin' && req.user.shop_id !== shopId) {
            return res.status(403).json({ error: '无权访问' });
        }
        
        res.json({ shop });
    });
});

// 编辑店铺
app.put('/api/admin/shops/:id', requireAuth, (req, res) => {
    const shopId = parseInt(req.params.id);
    const {
        name, description, address, phone, business_hours,
        latitude, longitude, wechat_id, wifi_ssid, wifi_password,
        show_wechat_button, show_wifi_button, show_map, show_reviews,
        shop_type, decoration_theme, brand_logo, theme_colors, theme_config, status
    } = req.body;
    
    // 店铺管理员只能编辑自己的店铺
    if (req.user.role === 'shop_admin' && req.user.shop_id !== shopId) {
        logAction(req.user.user_id, req.user.username, 'update', 'shop', shopId, name, null, JSON.stringify(req.body), req.ip, req.get('user-agent'), 'failed', '越权操作');
        return res.status(403).json({ error: '无权编辑此店铺' });
    }
    
    // 获取旧数据
    db.get('SELECT * FROM shops WHERE id = ?', [shopId], (err, oldShop) => {
        if (err || !oldShop) {
            return res.status(500).json({ error: '店铺不存在' });
        }
        
        const updates = [];
        const values = [];
        
        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (address !== undefined) { updates.push('address = ?'); values.push(address); }
        if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
        if (business_hours !== undefined) { updates.push('business_hours = ?'); values.push(business_hours); }
        if (latitude !== undefined) { updates.push('latitude = ?'); values.push(latitude); }
        if (longitude !== undefined) { updates.push('longitude = ?'); values.push(longitude); }
        if (wechat_id !== undefined) { updates.push('wechat_id = ?'); values.push(wechat_id); }
        if (wifi_ssid !== undefined) { updates.push('wifi_ssid = ?'); values.push(wifi_ssid); }
        if (wifi_password !== undefined) { updates.push('wifi_password = ?'); values.push(wifi_password); }
        if (show_wechat_button !== undefined) { updates.push('show_wechat_button = ?'); values.push(show_wechat_button); }
        if (show_wifi_button !== undefined) { updates.push('show_wifi_button = ?'); values.push(show_wifi_button); }
        if (show_map !== undefined) { updates.push('show_map = ?'); values.push(show_map); }
        if (show_reviews !== undefined) { updates.push('show_reviews = ?'); values.push(show_reviews); }
        if (shop_type !== undefined) { updates.push('shop_type = ?'); values.push(shop_type); }
        if (decoration_theme !== undefined) { updates.push('decoration_theme = ?'); values.push(decoration_theme); }
        if (brand_logo !== undefined) { updates.push('brand_logo = ?'); values.push(brand_logo); }
        if (theme_colors !== undefined) { updates.push('theme_colors = ?'); values.push(JSON.stringify(theme_colors)); }
        if (theme_config !== undefined) { updates.push('theme_config = ?'); values.push(JSON.stringify(theme_config)); }
        if (status !== undefined) { updates.push('status = ?'); values.push(status); }
        
        updates.push('updated_at = datetime("now")');
        values.push(shopId);
        
        const sql = `UPDATE shops SET ${updates.join(', ')} WHERE id = ?`;
        
        db.run(sql, values, function(err) {
            if (err) {
                logAction(req.user.user_id, req.user.username, 'update', 'shop', shopId, oldShop.name, JSON.stringify(oldShop), null, req.ip, req.get('user-agent'), 'failed', err.message);
                return res.status(500).json({ error: '更新失败' });
            }
            
            // 记录日志
            logAction(req.user.user_id, req.user.username, 'update', 'shop', shopId, oldShop.name, JSON.stringify(oldShop), JSON.stringify(req.body), req.ip, req.get('user-agent'), 'success');
            
            res.json({
                message: '更新成功',
                shop_id: shopId
            });
        });
    });
});

// ==================== 用户管理 API（超管） ====================

// 获取用户列表
app.get('/api/admin/users', requireAuth, requireSuperAdmin, (req, res) => {
    const { page = 1, limit = 20, role, is_active } = req.query;
    const offset = (page - 1) * limit;
    
    let where = '1=1';
    const params = [];
    
    if (role) {
        where += ' AND role = ?';
        params.push(role);
    }
    
    if (is_active !== undefined) {
        where += ' AND is_active = ?';
        params.push(parseInt(is_active));
    }
    
    db.all(`SELECT id, username, role, shop_id, phone, email, avatar_url, is_active, last_login_at, created_at FROM admin_users WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)], (err, users) => {
        if (err) {
            return res.status(500).json({ error: '数据库错误' });
        }
        
        db.get('SELECT COUNT(*) as total FROM admin_users WHERE ' + where, params, (err, count) => {
            res.json({
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count.total
                }
            });
        });
    });
});

// 创建用户
app.post('/api/admin/users', requireAuth, requireSuperAdmin, (req, res) => {
    const { username, password, role, shop_id, phone, email } = req.body;
    
    if (!username || !password || !role) {
        return res.status(400).json({ error: '用户名、密码和角色必填' });
    }
    
    const passwordHash = hashPassword(password);
    
    db.run('INSERT INTO admin_users (username, password_hash, role, shop_id, phone, email) VALUES (?, ?, ?, ?, ?, ?)',
        [username, passwordHash, role, shop_id || null, phone || null, email || null],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint')) {
                    return res.status(400).json({ error: '用户名已存在' });
                }
                return res.status(500).json({ error: '创建失败' });
            }
            
            logAction(req.user.user_id, req.user.username, 'create', 'user', this.lastID, username, null, JSON.stringify(req.body), req.ip, req.get('user-agent'), 'success');
            
            res.json({
                message: '创建成功',
                user_id: this.lastID
            });
        });
});

// ==================== 操作日志 API ====================

// 获取操作日志
app.get('/api/admin/logs', requireAuth, (req, res) => {
    const { page = 1, limit = 50, action, user_id, target_type } = req.query;
    const offset = (page - 1) * limit;
    
    let where = '1=1';
    const params = [];
    
    if (action) {
        where += ' AND action = ?';
        params.push(action);
    }
    
    if (user_id) {
        where += ' AND user_id = ?';
        params.push(user_id);
    }
    
    if (target_type) {
        where += ' AND target_type = ?';
        params.push(target_type);
    }
    
    // 超管可以看到所有日志，店铺管理员只能看到自己的
    if (req.user.role === 'shop_admin') {
        where += ' AND user_id = ?';
        params.push(req.user.user_id);
    }
    
    db.all(`SELECT * FROM view_admin_logs WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)], (err, logs) => {
        if (err) {
            return res.status(500).json({ error: '数据库错误' });
        }
        
        db.get('SELECT COUNT(*) as total FROM view_admin_logs WHERE ' + where, params, (err, count) => {
            res.json({
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count.total
                }
            });
        });
    });
});

// ==================== 系统配置 API ====================

// 获取配置
app.get('/api/admin/settings', requireAuth, (req, res) => {
    const publicOnly = req.query.public === 'true';
    const where = publicOnly ? 'is_public = 1' : '1=1';
    
    db.all(`SELECT * FROM admin_settings WHERE ${where}`, [], (err, settings) => {
        if (err) {
            return res.status(500).json({ error: '数据库错误' });
        }
        
        const config = {};
        settings.forEach(s => {
            if (s.value_type === 'json' && s.value_json) {
                config[s.key_name] = JSON.parse(s.value_json);
            } else if (s.value_type === 'number') {
                config[s.key_name] = parseFloat(s.value_number);
            } else if (s.value_type === 'boolean') {
                config[s.key_name] = s.value_boolean === 1;
            } else {
                config[s.key_name] = s.value_text;
            }
        });
        
        res.json({ settings: config });
    });
});

// ==================== 启动服务 ====================

app.listen(PORT, () => {
    console.log(`\n🚀 云信旺店管理后台 v1.0.0-admin 已启动`);
    console.log(`📍 访问地址：http://localhost:${PORT}`);
    console.log(`🏥 健康检查：http://localhost:${PORT}/health`);
    console.log(`\n📝 默认账号：admin / admin123`);
    console.log(`⚠️  请尽快修改默认密码！\n`);
});
