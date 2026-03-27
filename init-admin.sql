-- 删除已存在的表（如果存在）
DROP TABLE IF EXISTS admin_users;
DROP TABLE IF EXISTS admin_sessions;
DROP TABLE IF EXISTS admin_logs;
DROP TABLE IF EXISTS admin_settings;

-- 创建管理员表
CREATE TABLE admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'shop_admin',
    shop_id INTEGER,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    last_login_at DATETIME,
    last_login_ip TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建管理员会话表
CREATE TABLE admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建管理员操作日志表
CREATE TABLE admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id INTEGER,
    target_name TEXT,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建系统配置表
CREATE TABLE admin_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认管理员用户 (密码: admin123)
INSERT INTO admin_users (username, password_hash, role, email, phone) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye3Z6gZ4.1pB6G9J8qJ7J7J7J7J7J7J7J', 'super_admin', 'admin@yunxinwangdian.com', '13800138000');

-- 插入默认配置
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('system_name', '云信旺店管理系统', '系统名称'),
('system_version', '1.0.0-admin', '系统版本'),
('session_timeout', '7200', '会话超时时间（秒）'),
('login_attempts_limit', '5', '登录尝试次数限制'),
('password_min_length', '8', '密码最小长度');

-- 验证创建结果
SELECT 'admin_users' as table_name, COUNT(*) as count FROM admin_users
UNION ALL
SELECT 'admin_settings', COUNT(*) FROM admin_settings;
