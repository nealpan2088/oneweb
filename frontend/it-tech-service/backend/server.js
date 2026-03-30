// IT技术服务站后端API服务
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 确保data目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const app = express();
const PORT = 3003;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, '..')));

// 配置multer处理文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB限制
        files: 10 // 最多10个文件
    },
    fileFilter: function (req, file, cb) {
        // 只允许图片文件
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// 数据文件路径
const MESSAGES_FILE = path.join(dataDir, 'messages.json');
const GALLERY_FILE = path.join(dataDir, 'gallery.json');

// 初始化数据文件
function initDataFile(filePath, defaultValue = []) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
    }
}

// 读取数据
function readData(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`读取文件 ${filePath} 失败:`, error);
        return [];
    }
}

// 写入数据
function writeData(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`写入文件 ${filePath} 失败:`, error);
        return false;
    }
}

// 初始化数据文件
initDataFile(MESSAGES_FILE);
initDataFile(GALLERY_FILE);

// API路由

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'IT技术服务站API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// 获取所有留言
app.get('/api/messages', (req, res) => {
    const messages = readData(MESSAGES_FILE);
    res.json({
        success: true,
        data: messages,
        count: messages.length
    });
});

// 提交新留言
app.post('/api/messages', (req, res) => {
    try {
        const { name, phone, email, content } = req.body;
        
        // 验证必填字段
        if (!name || !phone || !content) {
            return res.status(400).json({
                success: false,
                message: '姓名、电话和留言内容为必填项'
            });
        }
        
        const messages = readData(MESSAGES_FILE);
        const newMessage = {
            id: Date.now().toString(),
            name,
            phone,
            email: email || '',
            content,
            status: 'unread',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        messages.unshift(newMessage); // 最新消息放在前面
        writeData(MESSAGES_FILE, messages);
        
        res.json({
            success: true,
            message: '留言提交成功',
            data: newMessage
        });
        
        // 记录日志
        console.log(`新留言: ${name} (${phone}) - ${content.substring(0, 50)}...`);
        
    } catch (error) {
        console.error('提交留言失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 标记留言为已读
app.put('/api/messages/:id/read', (req, res) => {
    try {
        const { id } = req.params;
        const messages = readData(MESSAGES_FILE);
        const messageIndex = messages.findIndex(m => m.id === id);
        
        if (messageIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '留言不存在'
            });
        }
        
        messages[messageIndex].status = 'read';
        messages[messageIndex].updatedAt = new Date().toISOString();
        writeData(MESSAGES_FILE, messages);
        
        res.json({
            success: true,
            message: '留言已标记为已读'
        });
        
    } catch (error) {
        console.error('标记留言失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 删除留言
app.delete('/api/messages/:id', (req, res) => {
    try {
        const { id } = req.params;
        let messages = readData(MESSAGES_FILE);
        const initialLength = messages.length;
        
        messages = messages.filter(m => m.id !== id);
        
        if (messages.length === initialLength) {
            return res.status(404).json({
                success: false,
                message: '留言不存在'
            });
        }
        
        writeData(MESSAGES_FILE, messages);
        
        res.json({
            success: true,
            message: '留言删除成功'
        });
        
    } catch (error) {
        console.error('删除留言失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取所有图片
app.get('/api/gallery', (req, res) => {
    const gallery = readData(GALLERY_FILE);
    res.json({
        success: true,
        data: gallery,
        count: gallery.length
    });
});

// 上传图片
app.post('/api/gallery', upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请选择要上传的图片'
            });
        }
        
        const { title, description, category } = req.body;
        const gallery = readData(GALLERY_FILE);
        const newImages = [];
        
        req.files.forEach((file, index) => {
            const imageItem = {
                id: Date.now().toString() + '-' + index,
                filename: file.filename,
                originalname: file.originalname,
                path: `/uploads/${file.filename}`,
                title: title || `图片 ${gallery.length + index + 1}`,
                description: description || '',
                category: category || 'uncategorized',
                size: file.size,
                mimetype: file.mimetype,
                uploadedAt: new Date().toISOString()
            };
            
            gallery.unshift(imageItem);
            newImages.push(imageItem);
        });
        
        writeData(GALLERY_FILE, gallery);
        
        res.json({
            success: true,
            message: `成功上传 ${req.files.length} 张图片`,
            data: newImages
        });
        
        console.log(`上传了 ${req.files.length} 张图片`);
        
    } catch (error) {
        console.error('上传图片失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '上传图片失败'
        });
    }
});

// 删除图片
app.delete('/api/gallery/:id', (req, res) => {
    try {
        const { id } = req.params;
        let gallery = readData(GALLERY_FILE);
        const imageIndex = gallery.findIndex(img => img.id === id);
        
        if (imageIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '图片不存在'
            });
        }
        
        const image = gallery[imageIndex];
        const filePath = path.join(uploadsDir, image.filename);
        
        // 删除文件
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // 从数组中删除
        gallery.splice(imageIndex, 1);
        writeData(GALLERY_FILE, gallery);
        
        res.json({
            success: true,
            message: '图片删除成功'
        });
        
    } catch (error) {
        console.error('删除图片失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 统计数据
app.get('/api/stats', (req, res) => {
    try {
        const messages = readData(MESSAGES_FILE);
        const gallery = readData(GALLERY_FILE);
        
        const stats = {
            messages: {
                total: messages.length,
                unread: messages.filter(m => m.status === 'unread').length,
                today: messages.filter(m => {
                    const today = new Date().toDateString();
                    return new Date(m.createdAt).toDateString() === today;
                }).length
            },
            gallery: {
                total: gallery.length,
                byCategory: gallery.reduce((acc, img) => {
                    acc[img.category] = (acc[img.category] || 0) + 1;
                    return acc;
                }, {})
            },
            system: {
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            }
        };
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: '文件大小超过限制（最大5MB）'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: '上传文件数量超过限制（最多10个）'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        message: err.message || '服务器内部错误'
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API端点不存在'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 IT技术服务站API服务已启动`);
    console.log(`📡 地址: http://localhost:${PORT}`);
    console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
    console.log(`💾 数据目录: ${dataDir}`);
    console.log(`🖼️ 上传目录: ${uploadsDir}`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务器...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 收到终止信号，正在关闭服务器...');
    process.exit(0);
});