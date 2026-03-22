-- 云信旺店管理后台 - 数据库扩展
-- 版本：v1.0.0-admin
-- 创建时间：2026-03-22
-- 说明：管理后台专用表，与前端业务表隔离

-- ==================== 用户系统 ====================

-- 管理员表
CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'shop_admin',     -- super_admin/shop_admin
    shop_id INTEGER,                              -- 关联的店铺（店铺管理员用）
    phone TEXT,                                   -- 手机号
    email TEXT,                                   -- 邮箱
    avatar_url TEXT,                              -- 头像
    is_active BOOLEAN DEFAULT 1,                  -- 是否启用
    last_login_at DATETIME,                       -- 最后登录时间
    last_login_ip TEXT,                           -- 最后登录 IP
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE SET NULL
);

-- 管理员会话表（Token 管理）
CREATE TABLE IF NOT EXISTS admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- ==================== 操作日志 ====================

-- 管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,                                -- 冗余字段，方便查询
    action TEXT NOT NULL,                         -- login/logout/update/create/delete/audit
    target_type TEXT,                             -- shop/user/setting/log
    target_id INTEGER,                            -- 目标 ID
    target_name TEXT,                             -- 目标名称（冗余）
    old_value TEXT,                               -- 修改前的数据 (JSON)
    new_value TEXT,                               -- 修改后的数据 (JSON)
    changes TEXT,                                 -- 变更摘要 (JSON)
    ip_address TEXT,                              -- 操作 IP
    user_agent TEXT,                              -- 设备信息
    status TEXT DEFAULT 'success',                -- success/failed
    error_message TEXT,                           -- 错误信息
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- ==================== 系统配置 ====================

-- 系统配置表
CREATE TABLE IF NOT EXISTS admin_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_name TEXT UNIQUE NOT NULL,                -- 配置键
    value_type TEXT NOT NULL DEFAULT 'string',    -- string/number/boolean/json
    value_text TEXT,                              -- 文本值
    value_number REAL,                            -- 数字值
    value_boolean BOOLEAN,                        -- 布尔值
    value_json TEXT,                              -- JSON 值
    description TEXT,                             -- 配置说明
    is_public BOOLEAN DEFAULT 0,                  -- 是否公开（前端可读）
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,                           -- 最后修改人
    FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- ==================== 索引优化 ====================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_shop ON admin_users(shop_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- 会话表索引
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- 日志表索引
CREATE INDEX IF NOT EXISTS idx_admin_logs_user ON admin_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at);

-- 配置表索引
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key_name);
CREATE INDEX IF NOT EXISTS idx_admin_settings_public ON admin_settings(is_public);

-- ==================== 视图（方便查询） ====================

-- 用户详情视图
CREATE VIEW IF NOT EXISTS view_admin_users AS
SELECT 
    u.id,
    u.username,
    u.role,
    u.shop_id,
    u.phone,
    u.email,
    u.avatar_url,
    u.is_active,
    u.last_login_at,
    u.last_login_ip,
    u.created_at,
    s.name as shop_name,
    s.shop_type
FROM admin_users u
LEFT JOIN shops s ON u.shop_id = s.id;

-- 操作日志视图（含用户名）
CREATE VIEW IF NOT EXISTS view_admin_logs AS
SELECT 
    l.*,
    u.username as operator_name,
    u.role as operator_role
FROM admin_logs l
LEFT JOIN admin_users u ON l.user_id = u.id;

-- ==================== 初始化数据 ====================

-- 插入默认超管账号（密码：admin123，bcrypt 哈希）
-- 注意：实际密码哈希需要在代码中生成，这里是示例
INSERT OR IGNORE INTO admin_users (username, password_hash, role, shop_id, is_active) 
VALUES (
    'admin',
    '$2b$10$KIXxQZjVz9z8z9z8z9z8z9z8z9z8z9z8z9z8z9z8z9z8z9z8z',  -- 需要替换为真实哈希
    'super_admin',
    NULL,
    1
);

-- 插入默认配置
INSERT OR IGNORE INTO admin_settings (key_name, value_type, value_text, description, is_public) VALUES
('system_name', 'string', '云信旺店管理后台', '系统名称', 0),
('system_version', 'string', '1.0.0-admin', '系统版本', 0),
('session_timeout', 'number', '24', '会话超时时间（小时）', 0),
('password_min_length', 'number', '6', '密码最小长度', 0),
('login_max_attempts', 'number', '5', '登录最大尝试次数', 0),
('login_lockout_duration', 'number', '15', '登录失败锁定时间（分钟）', 0),
('allow_shop_type', 'json', '["cafe","restaurant","retail","beauty","fitness","education","entertainment","hotel","other"]', '允许的门店类型', 1),
('allow_decoration_theme', 'json', '["default","warm","minimalist","luxury","fresh","retro","cute","tech"]', '允许的装修主题', 1);

-- ==================== 版本记录 ====================

-- 记录数据库版本
INSERT INTO schema_versions (version, description) VALUES
('1.0.0-admin', '管理后台初始版本 - 用户系统 + 操作日志 + 系统配置');

-- ==================== 说明 ====================

-- 使用方式：
-- 1. 前端业务使用 shops, reviews, visit_logs 表（无前缀）
-- 2. 管理后台使用 admin_* 表（有前缀）
-- 3. 两个系统共享 database/shop.db 文件
-- 4. 升级时可以独立升级，互不影响

-- 升级流程：
-- 1. 备份数据库
-- 2. 执行新的迁移脚本
-- 3. 更新 schema_versions 表
-- 4. 验证功能
