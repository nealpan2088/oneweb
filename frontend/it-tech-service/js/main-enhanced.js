// IT技术服务站增强版主脚本
// 包含API集成和PWA支持

document.addEventListener('DOMContentLoaded', function() {
    // 初始化基础功能
    initNavigation();
    initBackToTop();
    initSmoothScroll();
    
    // 初始化API相关功能
    initContactForm();
    initServiceWorker();
    initOfflineDetection();
    
    // 初始化其他功能
    initAnimations();
    initFormValidation();
});

// 基础功能
function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.innerHTML = navMenu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
        
        // 点击导航链接关闭移动端菜单
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    navMenu.classList.remove('active');
                    navToggle.innerHTML = '<i class="fas fa-bars"></i>';
                }
            });
        });
    }
}

function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
        
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // 更新URL哈希（不滚动页面）
                history.pushState(null, null, href);
            }
        });
    });
}

// 留言表单处理
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitMessage');
    
    if (!contactForm || !submitBtn) return;
    
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 获取表单数据
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        
        // 表单验证规则
        const validationRules = {
            name: {
                required: true,
                label: '姓名',
                minLength: 2,
                maxLength: 20
            },
            phone: {
                required: true,
                label: '电话',
                type: 'phone',
                pattern: /^1[3-9]\d{9}$/,
                message: '请输入正确的手机号'
            },
            email: {
                required: false,
                label: '邮箱',
                type: 'email'
            },
            service: {
                required: true,
                label: '服务类型'
            },
            message: {
                required: true,
                label: '留言内容',
                minLength: 10,
                maxLength: 500
            }
        };
        
        // 验证表单
        const errors = validateForm(data, validationRules);
        if (errors.length > 0) {
            showMessage('error', errors.join('<br>'));
            return;
        }
        
        // 显示加载状态
        const loading = createLoadingOverlay('正在提交留言...');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
        submitBtn.disabled = true;
        
        try {
            // 尝试使用API提交
            const result = await api.messages.create({
                name: data.name,
                phone: data.phone,
                email: data.email || '',
                content: `服务类型：${data.service}\n\n留言内容：${data.message}`
            });
            
            if (result.success) {
                // 成功提交到API
                showMessage('success', '留言提交成功！我们会尽快与您联系。');
                
                // 重置表单
                contactForm.reset();
                
                // 尝试通知管理后台（如果打开）
                try {
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'NEW_MESSAGE',
                            ...result.data
                        }, '*');
                    }
                } catch (e) {
                    // 静默处理
                }
                
            } else {
                throw new Error(result.message || '提交失败');
            }
            
        } catch (error) {
            console.warn('API提交失败，使用本地存储:', error);
            
            // API失败时使用本地存储
            const messages = JSON.parse(localStorage.getItem('websiteMessages') || '[]');
            const newMessage = {
                id: Date.now().toString(),
                name: data.name,
                phone: data.phone,
                email: data.email || '',
                content: `服务类型：${data.service}\n\n留言内容：${data.message}`,
                time: new Date().toLocaleString('zh-CN'),
                read: false,
                source: 'local'
            };
            
            messages.push(newMessage);
            localStorage.setItem('websiteMessages', JSON.stringify(messages));
            
            showMessage('success', '留言已保存（本地模式）。API恢复后会自动同步。');
            contactForm.reset();
        } finally {
            // 恢复按钮状态
            loading.remove();
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
    
    // 实时表单验证
    contactForm.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

// 字段验证
function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    const errorElement = document.getElementById(`${fieldName}-error`) || createErrorElement(field);
    
    // 清除之前的错误
    errorElement.textContent = '';
    field.classList.remove('error');
    
    // 验证规则
    const rules = {
        name: {
            required: true,
            minLength: 2,
            message: '姓名至少2个字符'
        },
        phone: {
            required: true,
            pattern: /^1[3-9]\d{9}$/,
            message: '请输入正确的手机号'
        },
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: '邮箱格式不正确'
        },
        message: {
            required: true,
            minLength: 10,
            message: '留言内容至少10个字符'
        }
    };
    
    const rule = rules[fieldName];
    if (!rule) return;
    
    let error = '';
    
    if (rule.required && !value) {
        error = '此项为必填';
    } else if (value) {
        if (rule.minLength && value.length < rule.minLength) {
            error = rule.message || `至少需要${rule.minLength}个字符`;
        }
        
        if (rule.pattern && !rule.pattern.test(value)) {
            error = rule.message || '格式不正确';
        }
    }
    
    if (error) {
        errorElement.textContent = error;
        field.classList.add('error');
        return false;
    }
    
    return true;
}

function createErrorElement(field) {
    const errorElement = document.createElement('div');
    errorElement.id = `${field.name}-error`;
    errorElement.className = 'field-error';
    errorElement.style.cssText = `
        color: #dc3545;
        font-size: 12px;
        margin-top: 4px;
        min-height: 18px;
    `;
    
    field.parentNode.appendChild(errorElement);
    return errorElement;
}

function clearFieldError(field) {
    const errorElement = document.getElementById(`${field.name}-error`);
    if (errorElement) {
        errorElement.textContent = '';
    }
    field.classList.remove('error');
}

// PWA支持
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                const registration = await navigator.serviceWorker.register('/it-tech-service/sw.js');
                console.log('✅ Service Worker 注册成功:', registration.scope);
                
                // 检查更新
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 Service Worker 更新发现');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showMessage('info', '有新版本可用，刷新页面获取更新。');
                        }
                    });
                });
                
            } catch (error) {
                console.warn('⚠️ Service Worker 注册失败:', error);
            }
        });
    }
}

// 离线检测
function initOfflineDetection() {
    // 检测网络状态
    window.addEventListener('online', () => {
        showMessage('success', '网络已恢复', 2000);
        updateOnlineStatus(true);
    });
    
    window.addEventListener('offline', () => {
        showMessage('warning', '网络连接已断开，部分功能受限', 3000);
        updateOnlineStatus(false);
    });
    
    // 初始状态
    updateOnlineStatus(navigator.onLine);
}

function updateOnlineStatus(online) {
    const statusElement = document.getElementById('online-status') || createOnlineStatusElement();
    statusElement.textContent = online ? '在线' : '离线';
    statusElement.className = `online-status ${online ? 'online' : 'offline'}`;
    
    // 更新页面样式
    document.body.classList.toggle('offline-mode', !online);
}

function createOnlineStatusElement() {
    const statusElement = document.createElement('div');
    statusElement.id = 'online-status';
    statusElement.className = 'online-status online';
    statusElement.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        z-index: 9997;
        background: #28a745;
        color: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: all 0.3s;
    `;
    
    document.body.appendChild(statusElement);
    return statusElement;
}

// 动画效果
function initAnimations() {
    // 滚动动画
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);
    
    // 观察需要动画的元素
    document.querySelectorAll('.service-card, .advantage-card, .portfolio-item').forEach(el => {
        observer.observe(el);
    });
    
    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
        .service-card, .advantage-card, .portfolio-item {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .service-card.animated,
        .advantage-card.animated,
        .portfolio-item.animated {
            opacity: 1;
            transform: translateY(0);
        }
        
        .offline-mode .requires-online {
            opacity: 0.5;
            pointer-events: none;
        }
        
        .online-status {
            animation: fadeIn 0.3s ease;
        }
        
        .online-status.online {
            background: #28a745;
        }
        
        .online-status.offline {
            background: #dc3545;
        }
        
        .field-error {
            animation: shake 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    
    document.head.appendChild(style);
}

// 表单验证初始化
function initFormValidation() {
    // 为所有表单添加验证
    document.querySelectorAll('form').forEach(form => {
        form.setAttribute('novalidate', 'novalidate');
        
        form.querySelectorAll('input[required], textarea[required]').forEach(field => {
            field.addEventListener('invalid', function(e) {
                e.preventDefault();
                validateField(this);
            });
        });
    });
}

// 工具函数：防抖
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 工具函数：节流
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 导出函数供其他脚本使用
window.initContactForm = initContactForm;
window.validateField = validateField;
window.debounce = debounce;
window.throttle = throttle;

console.log('✅ 增强版主脚本加载完成');