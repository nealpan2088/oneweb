// 行业图标映射 - Emoji方案
// 版本: 1.0.0
// 日期: 2026-03-30

const IndustryIcons = {
    // 图标映射表
    icons: {
        // 餐饮类
        '咖啡馆': { emoji: '☕', color: '#8B4513', name: 'cafe' },
        '餐厅': { emoji: '🍽️', color: '#DC143C', name: 'restaurant' },
        '快餐店': { emoji: '🍔', color: '#FF8C00', name: 'fastfood' },
        '奶茶店': { emoji: '🧋', color: '#FF69B4', name: 'bubbletea' },
        '甜品店': { emoji: '🍰', color: '#FFB6C1', name: 'dessert' },
        '酒吧': { emoji: '🍸', color: '#9370DB', name: 'bar' },
        '火锅店': { emoji: '🥘', color: '#FF4500', name: 'hotpot' },
        '烧烤店': { emoji: '🍖', color: '#A0522D', name: 'bbq' },
        
        // 零售类
        '零售店': { emoji: '🛍️', color: '#4361EE', name: 'retail' },
        '超市': { emoji: '🛒', color: '#2E8B57', name: 'supermarket' },
        '便利店': { emoji: '🏪', color: '#FFD700', name: 'convenience' },
        '书店': { emoji: '📚', color: '#8B4513', name: 'bookstore' },
        '花店': { emoji: '💐', color: '#FF69B4', name: 'flower' },
        '药店': { emoji: '💊', color: '#DC143C', name: 'pharmacy' },
        '服装店': { emoji: '👕', color: '#1E90FF', name: 'clothing' },
        '鞋店': { emoji: '👟', color: '#696969', name: 'shoes' },
        
        // 服务类
        '美容院': { emoji: '💇', color: '#FF69B4', name: 'beauty' },
        '理发店': { emoji: '✂️', color: '#333333', name: 'barber' },
        '健身房': { emoji: '💪', color: '#228B22', name: 'gym' },
        '瑜伽馆': { emoji: '🧘', color: '#9370DB', name: 'yoga' },
        '按摩店': { emoji: '💆', color: '#8B4513', name: 'massage' },
        '洗车店': { emoji: '🚗', color: '#1E90FF', name: 'carwash' },
        '维修店': { emoji: '🔧', color: '#696969', name: 'repair' },
        '打印店': { emoji: '🖨️', color: '#333333', name: 'print' },
        '洗衣店': { emoji: '🧺', color: '#87CEEB', name: 'laundry' },
        
        // 专业服务
        '诊所': { emoji: '🏥', color: '#DC143C', name: 'clinic' },
        '牙科': { emoji: '🦷', color: '#FFFFFF', name: 'dental' },
        '宠物店': { emoji: '🐾', color: '#A0522D', name: 'pet' },
        '培训机构': { emoji: '🎓', color: '#4361EE', name: 'training' },
        '律师事务所': { emoji: '⚖️', color: '#000000', name: 'law' },
        '会计师事务所': { emoji: '📊', color: '#2E8B57', name: 'accounting' },
        
        // 其他
        '酒店': { emoji: '🏨', color: '#FFD700', name: 'hotel' },
        '民宿': { emoji: '🏡', color: '#228B22', name: 'homestay' },
        '网吧': { emoji: '💻', color: '#1E90FF', name: 'internet' },
        'KTV': { emoji: '🎤', color: '#FF69B4', name: 'ktv' },
        '电影院': { emoji: '🎬', color: '#000000', name: 'cinema' },
        
        // 默认
        'default': { emoji: '🏢', color: '#333333', name: 'default' }
    },
    
    // 获取行业图标信息
    getIconInfo: function(industry) {
        // 清理行业名称（去除空格，统一格式）
        const cleanIndustry = (industry || '').trim();
        
        // 直接匹配
        if (this.icons[cleanIndustry]) {
            return this.icons[cleanIndustry];
        }
        
        // 关键词匹配（更灵活的匹配）
        const industryLower = cleanIndustry.toLowerCase();
        
        const keywordMap = {
            // 餐饮关键词
            '咖啡': '咖啡馆',
            '餐厅': '餐厅',
            '饭店': '餐厅',
            '酒楼': '餐厅',
            '快餐': '快餐店',
            '奶茶': '奶茶店',
            '饮品': '奶茶店',
            '甜品': '甜品店',
            '蛋糕': '甜品店',
            '酒吧': '酒吧',
            '酒馆': '酒吧',
            '火锅': '火锅店',
            '烧烤': '烧烤店',
            
            // 零售关键词
            '零售': '零售店',
            '超市': '超市',
            '便利': '便利店',
            '书店': '书店',
            '图书': '书店',
            '花店': '花店',
            '鲜花': '花店',
            '药店': '药店',
            '医药': '药店',
            '服装': '服装店',
            '服饰': '服装店',
            '鞋店': '鞋店',
            '鞋子': '鞋店',
            
            // 服务关键词
            '美容': '美容院',
            '美发': '理发店',
            '理发': '理发店',
            '发廊': '理发店',
            '健身': '健身房',
            '瑜伽': '瑜伽馆',
            '按摩': '按摩店',
            '推拿': '按摩店',
            '洗车': '洗车店',
            '汽车': '洗车店',
            '维修': '维修店',
            '修理': '维修店',
            '打印': '打印店',
            '复印': '打印店',
            '洗衣': '洗衣店',
            '干洗': '洗衣店',
            
            // 专业服务关键词
            '诊所': '诊所',
            '医院': '诊所',
            '牙科': '牙科',
            '牙齿': '牙科',
            '宠物': '宠物店',
            '猫狗': '宠物店',
            '培训': '培训机构',
            '教育': '培训机构',
            '律师': '律师事务所',
            '法律': '律师事务所',
            '会计': '会计师事务所',
            '财务': '会计师事务所',
            
            // 其他关键词
            '酒店': '酒店',
            '宾馆': '酒店',
            '民宿': '民宿',
            '网吧': '网吧',
            '网咖': '网吧',
            'KTV': 'KTV',
            '唱歌': 'KTV',
            '电影': '电影院',
            '影院': '电影院'
        };
        
        // 遍历关键词匹配
        for (const [keyword, industryType] of Object.entries(keywordMap)) {
            if (industryLower.includes(keyword)) {
                return this.icons[industryType] || this.icons.default;
            }
        }
        
        // 默认返回
        return this.icons.default;
    },
    
    // 创建图标HTML元素
    createIconElement: function(industry, size = 'medium') {
        const iconInfo = this.getIconInfo(industry);
        const sizeClass = `icon-${size}`;
        
        const iconElement = document.createElement('span');
        iconElement.className = `industry-icon ${iconInfo.name} ${sizeClass}`;
        iconElement.innerHTML = iconInfo.emoji;
        iconElement.style.color = iconInfo.color;
        iconElement.title = industry || '店铺';
        
        return iconElement;
    },
    
    // 更新页面中的店铺标题
    updateShopTitle: function(shopNameElement, industry) {
        if (!shopNameElement) return;
        
        const iconInfo = this.getIconInfo(industry);
        const originalText = shopNameElement.textContent || shopNameElement.innerText;
        
        // 创建包装元素
        const wrapper = document.createElement('div');
        wrapper.className = 'shop-title-with-icon';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '10px';
        
        // 创建图标
        const icon = this.createIconElement(industry, 'large');
        
        // 创建文本元素
        const textElement = document.createElement('span');
        textElement.className = 'shop-name-text';
        textElement.textContent = originalText;
        
        // 组装
        wrapper.appendChild(icon);
        wrapper.appendChild(textElement);
        
        // 替换原元素
        shopNameElement.parentNode.replaceChild(wrapper, shopNameElement);
        
        return wrapper;
    },
    
    // 批量更新页面中的所有店铺元素
    updateAllShopElements: function() {
        // 更新店铺标题
        const shopTitles = document.querySelectorAll('.shop-title, .shop-name, [class*="shop"][class*="name"], h1:first-child');
        shopTitles.forEach(title => {
            // 尝试从data属性或附近元素获取行业信息
            const industry = title.dataset.industry || 
                            document.querySelector('[data-industry]')?.dataset.industry || 
                            '咖啡馆';
            this.updateShopTitle(title, industry);
        });
        
        // 更新卡片中的店铺图标
        const shopCards = document.querySelectorAll('.shop-card, .business-card, [class*="shop"][class*="card"]');
        shopCards.forEach(card => {
            const titleElement = card.querySelector('.card-title, h3, h4');
            if (titleElement) {
                const industry = card.dataset.industry || titleElement.dataset.industry || '咖啡馆';
                const icon = this.createIconElement(industry, 'medium');
                titleElement.insertBefore(icon, titleElement.firstChild);
            }
        });
        
        console.log(`行业图标更新完成，共更新了 ${shopTitles.length + shopCards.length} 个元素`);
    },
    
    // 初始化函数
    init: function() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.updateAllShopElements();
                this.addStyles();
            });
        } else {
            this.updateAllShopElements();
            this.addStyles();
        }
    },
    
    // 添加CSS样式
    addStyles: function() {
        const styleId = 'industry-icons-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* 行业图标基础样式 */
            .industry-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-style: normal;
                transition: all 0.3s ease;
                border-radius: 8px;
                background: rgba(0,0,0,0.03);
            }
            
            /* 尺寸变体 */
            .icon-small {
                font-size: 1em;
                width: 30px;
                height: 30px;
                padding: 5px;
            }
            
            .icon-medium {
                font-size: 1.5em;
                width: 40px;
                height: 40px;
                padding: 8px;
            }
            
            .icon-large {
                font-size: 2em;
                width: 60px;
                height: 60px;
                padding: 10px;
            }
            
            .icon-xlarge {
                font-size: 3em;
                width: 80px;
                height: 80px;
                padding: 15px;
            }
            
            /* 悬停效果 */
            .industry-icon:hover {
                transform: scale(1.05);
                background: rgba(0,0,0,0.08);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            
            /* 店铺标题布局 */
            .shop-title-with-icon {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 10px;
            }
            
            .shop-name-text {
                font-size: 1.8em;
                font-weight: 600;
                color: #333;
            }
            
            /* 响应式调整 */
            @media (max-width: 768px) {
                .icon-large {
                    font-size: 1.8em;
                    width: 50px;
                    height: 50px;
                }
                
                .shop-name-text {
                    font-size: 1.5em;
                }
            }
            
            /* 动画效果 */
            @keyframes iconPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            
            .industry-icon.pulse {
                animation: iconPulse 2s infinite;
            }
        `;
        
        document.head.appendChild(style);
    }
};

// 导出到全局
window.IndustryIcons = IndustryIcons;

// 自动初始化
IndustryIcons.init();