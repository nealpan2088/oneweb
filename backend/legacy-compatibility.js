/**
 * 旧API兼容层
 * 确保现有前端代码继续工作
 */
const express = require('express');
const router = express.Router();
const shopService = require('./../src/services/shopService');

// 转义HTML，防止XSS攻击
function escapeHtml(text) {
    if (!text) return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 旧API：获取店铺信息
router.get('/', async (req, res) => {
    try {
        const shopId = parseInt(req.params.id);
        if (isNaN(shopId)) {
            return res.json({ error: '无效的店铺 ID' });
        }
        
        const shop = await shopService.getShopById(shopId);
        if (!shop) {
            return res.json({ error: '店铺不存在' });
        }
        
        // 返回旧格式
        res.json({
            id: shop.id,
            name: shop.name,
            description: shop.description,
            address: shop.address,
            phone: shop.phone,
            business_hours: shop.business_hours,
            latitude: shop.latitude,
            longitude: shop.longitude,
            wechat_id: shop.wechat_id,
            show_wechat_button: shop.show_wechat_button,
            show_wifi_button: shop.show_wifi_button,
            show_map: shop.show_map,
            show_reviews: shop.show_reviews,
            status: shop.status
        });
    } catch (error) {
        console.error('旧API获取店铺失败:', error);
        res.json({ error: '获取店铺信息失败' });
    }
});

// 旧API：获取评价列表
router.get('/reviews', async (req, res) => {
    try {
        const shopId = parseInt(req.params.id);
        if (isNaN(shopId)) {
            return res.json({ error: '无效的店铺 ID' });
        }
        
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const result = await shopService.getShopReviews(shopId, 1, limit);
        
        // 返回旧格式
        const safeReviews = result.items.map(r => ({
            ...r,
            customer_name: escapeHtml(r.customer_name),
            content: escapeHtml(r.content),
            reply: r.reply ? escapeHtml(r.reply) : null
        }));
        
        res.json(safeReviews);
    } catch (error) {
        console.error('旧API获取评价失败:', error);
        res.json({ error: '获取评价失败' });
    }
});

// 旧API：获取统计信息
router.get('/stats', async (req, res) => {
    try {
        const shopId = parseInt(req.params.id);
        if (isNaN(shopId)) {
            return res.json({ error: '无效的店铺 ID' });
        }
        
        const stats = await shopService.getShopStats(shopId);
        
        // 返回旧格式
        res.json({
            visits: stats.visits,
            reviews: stats.reviews,
            avgRating: stats.avgRating.toString() // 旧API需要字符串
        });
    } catch (error) {
        console.error('旧API获取统计失败:', error);
        res.json({ error: '获取统计失败' });
    }
});

// 旧API：提交评价
router.post('/reviews', async (req, res) => {
    try {
        const shopId = parseInt(req.params.id);
        if (isNaN(shopId)) {
            return res.json({ error: '无效的店铺 ID' });
        }
        
        const { customer_name, rating, content } = req.body;
        
        // 参数校验
        if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.json({ error: '评分必须是 1-5 的数字' });
        }
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.json({ error: '评价内容不能为空' });
        }
        
        const reviewData = {
            customer_name: customer_name || '匿名顾客',
            rating,
            content: content.trim()
        };
        
        await shopService.createReview(shopId, reviewData);
        res.json({ success: true, message: '评价提交成功' });
    } catch (error) {
        console.error('旧API提交评价失败:', error);
        res.json({ error: '提交评价失败: ' + error.message });
    }
});

// 旧API：记录访问
router.post('/visit', async (req, res) => {
    try {
        const shopId = parseInt(req.params.id);
        if (isNaN(shopId)) {
            return res.json({ error: '无效的店铺 ID' });
        }
        
        const { action = 'view' } = req.body;
        const visitorIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || '';
        
        await shopService.recordVisit(shopId, action, visitorIp, userAgent);
        res.json({ success: true, message: '访问记录成功' });
    } catch (error) {
        console.error('旧API记录访问失败:', error);
        res.json({ success: true, message: '访问记录失败，但不影响使用' });
    }
});

// 旧API：WiFi访问
router.post('/wifi', async (req, res) => {
    try {
        const shopId = parseInt(req.params.id);
        if (isNaN(shopId)) {
            return res.json({ error: '无效的店铺 ID' });
        }
        
        // 记录WiFi访问
        const visitorIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || '';
        
        await shopService.recordVisit(shopId, 'click_wifi', visitorIp, userAgent);
        
        // 获取WiFi信息
        const wifiInfo = await shopService.getWifiInfo(shopId);
        
        // 返回旧格式
        res.json({
            ssid: wifiInfo.ssid,
            password: wifiInfo.password,
            show_wifi_button: wifiInfo.show_wifi_button
        });
    } catch (error) {
        console.error('旧API处理WiFi访问失败:', error);
        res.json({ error: '获取WiFi信息失败' });
    }
});

module.exports = router;