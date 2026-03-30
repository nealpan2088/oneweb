// 简单的留言API后端
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3007;
const DATA_FILE = path.join(__dirname, 'messages.json');

// 中间件
app.use(cors({
    origin: function(origin, callback) {
        // 允许所有来源（为了简化调试）
        callback(null, true);
        
        // 生产环境应该限制来源：
        // const allowedOrigins = ['http://47.110.156.11', 'http://localhost', 'http://127.0.0.1'];
        // if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        //     callback(null, true);
        // } else {
        //     callback(new Error('Not allowed by CORS'));
        // }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 处理OPTIONS预检请求
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 添加访问日志中间件
app.use((req, res, next) => {
    const start = Date.now();
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    // 记录请求
    const logEntry = `${new Date().toISOString()} - ${clientIP} - ${req.method} ${req.url} - ${userAgent}\n`;
    fs.appendFileSync(path.join(__dirname, 'access.log'), logEntry);
    
    // 继续处理
    next();
});

// 确保数据文件存在
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// 读取留言数据
function readMessages() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取留言数据失败:', error);
        return [];
    }
}

// 保存留言数据
function saveMessages(messages) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2));
        return true;
    } catch (error) {
        console.error('保存留言数据失败:', error);
        return false;
    }
}

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 获取所有留言（需要管理员验证）
app.get('/api/messages', (req, res) => {
    const { password } = req.query;
    
    // 简单密码验证
    if (password !== 'admin123') {
        return res.status(401).json({ error: '未授权访问' });
    }
    
    const messages = readMessages();
    res.json({
        success: true,
        count: messages.length,
        messages: messages
    });
});

// 提交新留言
app.post('/api/messages', (req, res) => {
    const { name, phone, email, content, serviceType, budget } = req.body;
    
    // 基本验证
    if (!name || !phone || !content) {
        return res.status(400).json({ 
            success: false, 
            error: '姓名、电话和留言内容为必填项' 
        });
    }
    
    const messages = readMessages();
    const newMessage = {
        id: Date.now(),
        name,
        phone,
        email: email || '',
        content,
        serviceType: serviceType || '未指定',
        budget: budget || '未指定',
        status: 'pending', // pending, read, replied
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    messages.push(newMessage);
    
    if (saveMessages(messages)) {
        // 记录到日志文件（可选）
        const logEntry = `${new Date().toISOString()} - 新留言: ${name} (${phone}) - ${content.substring(0, 50)}...\n`;
        fs.appendFileSync(path.join(__dirname, 'messages.log'), logEntry);
        
        res.json({
            success: true,
            message: '留言提交成功，我们会尽快联系您！',
            data: {
                id: newMessage.id,
                name: newMessage.name,
                timestamp: newMessage.createdAt
            }
        });
    } else {
        res.status(500).json({
            success: false,
            error: '留言提交失败，请稍后重试'
        });
    }
});

// 标记留言为已读
app.put('/api/messages/:id/read', (req, res) => {
    const { password } = req.query;
    const messageId = parseInt(req.params.id);
    
    if (password !== 'admin123') {
        return res.status(401).json({ error: '未授权访问' });
    }
    
    const messages = readMessages();
    const messageIndex = messages.findIndex(m => m.id === messageId);
    
    if (messageIndex === -1) {
        return res.status(404).json({ success: false, error: '留言不存在' });
    }
    
    messages[messageIndex].status = 'read';
    messages[messageIndex].updatedAt = new Date().toISOString();
    
    if (saveMessages(messages)) {
        res.json({ success: true, message: '留言已标记为已读' });
    } else {
        res.status(500).json({ success: false, error: '更新失败' });
    }
});

// 删除留言
app.delete('/api/messages/:id', (req, res) => {
    const { password } = req.query;
    const messageId = parseInt(req.params.id);
    
    if (password !== 'admin123') {
        return res.status(401).json({ error: '未授权访问' });
    }
    
    const messages = readMessages();
    const filteredMessages = messages.filter(m => m.id !== messageId);
    
    if (messages.length === filteredMessages.length) {
        return res.status(404).json({ success: false, error: '留言不存在' });
    }
    
    if (saveMessages(filteredMessages)) {
        res.json({ success: true, message: '留言已删除' });
    } else {
        res.status(500).json({ success: false, error: '删除失败' });
    }
});

// 获取留言统计
app.get('/api/messages/stats', (req, res) => {
    const { password } = req.query;
    
    if (password !== 'admin123') {
        return res.status(401).json({ error: '未授权访问' });
    }
    
    const messages = readMessages();
    
    const stats = {
        total: messages.length,
        pending: messages.filter(m => m.status === 'pending').length,
        read: messages.filter(m => m.status === 'read').length,
        replied: messages.filter(m => m.status === 'replied').length,
        byServiceType: messages.reduce((acc, msg) => {
            acc[msg.serviceType] = (acc[msg.serviceType] || 0) + 1;
            return acc;
        }, {}),
        today: messages.filter(msg => {
            const today = new Date().toDateString();
            const msgDate = new Date(msg.createdAt).toDateString();
            return today === msgDate;
        }).length
    };
    
    res.json({ success: true, stats });
});

// 启动服务器
const HOST = '0.0.0.0'; // 监听所有网络接口
app.listen(PORT, HOST, () => {
    console.log(`留言API服务运行在:`);
    console.log(`  本地访问: http://localhost:${PORT}`);
    console.log(`  网络访问: http://47.110.156.11:${PORT}`);
    console.log(`  所有接口: http://0.0.0.0:${PORT}`);
    console.log(`数据文件: ${DATA_FILE}`);
    console.log(`管理密码: admin123`);
    console.log('API端点:');
    console.log('  GET  /health - 健康检查');
    console.log('  POST /api/messages - 提交留言');
    console.log('  GET  /api/messages?password=admin123 - 获取所有留言');
    console.log('  GET  /api/messages/stats?password=admin123 - 获取统计');
    console.log('  PUT  /api/messages/:id/read?password=admin123 - 标记已读');
    console.log('  DELETE /api/messages/:id?password=admin123 - 删除留言');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭留言API服务...');
    process.exit(0);
});

module.exports = app;