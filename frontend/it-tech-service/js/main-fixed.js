// IT技术服务站 - 主JavaScript文件
// 版本: 2.0.0 (修复版)
// 日期: 2026-03-30

document.addEventListener('DOMContentLoaded', function() {
    // 导航元素
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    
    // 移动端菜单切换
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.add('active');
        });
    }
    
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', function() {
            navMenu.classList.remove('active');
        });
    }
    
    // 平滑滚动 - 修复版
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetHref = this.getAttribute('href');
            
            // 空链接或当前页面锚点
            if (targetHref === '#' || targetHref === '') {
                e.preventDefault();
                return;
            }
            
            // 检查是否是页面内锚点链接（以#开头）
            if (targetHref.startsWith('#')) {
                e.preventDefault();
                
                const targetSection = document.querySelector(targetHref);
                if (targetSection) {
                    // 更新活动链接
                    navLinks.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                    
                    // 移动端关闭菜单
                    if (navMenu && navMenu.classList.contains('active')) {
                        navMenu.classList.remove('active');
                    }
                    
                    // 平滑滚动到目标
                    window.scrollTo({
                        top: targetSection.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
            // 外部页面链接 - 不阻止默认行为，让浏览器处理
            // else {
            //     // 浏览器会自动跳转
            // }
        });
    });
    
    // 滚动时更新活动链接
    window.addEventListener('scroll', function() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollY >= (sectionTop - 100)) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
    
    // 表单提交处理
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value || '',
                serviceType: document.getElementById('serviceType').value,
                budget: document.getElementById('budget').value || '',
                content: document.getElementById('content').value
            };
            
            // 验证必填字段
            if (!formData.name || !formData.phone || !formData.content) {
                showToast('请填写所有必填字段（姓名、电话、留言内容）', 'error');
                return;
            }
            
            // 验证手机号格式
            const phoneRegex = /^1[3-9]\d{9}$/;
            if (!phoneRegex.test(formData.phone)) {
                showToast('请输入有效的手机号码', 'error');
                return;
            }
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
            submitBtn.disabled = true;
            
            // 尝试使用后端API，失败时使用localStorage
            try {
                // 检查是否有MessageAPI
                if (window.MessageAPI) {
                    const api = new MessageAPI();
                    api.submitMessage(formData)
                        .then(result => {
                            if (result.success) {
                                showToast(result.message || '留言提交成功，我们会尽快联系您！', 'success');
                                contactForm.reset();
                            } else {
                                throw new Error(result.error || '提交失败');
                            }
                        })
                        .catch(apiError => {
                            console.warn('API提交失败，使用localStorage:', apiError);
                            saveToLocalStorage(formData);
                            showToast('留言已保存（本地模式），我们会尽快联系您！', 'success');
                            contactForm.reset();
                        })
                        .finally(() => {
                            submitBtn.innerHTML = originalText;
                            submitBtn.disabled = false;
                        });
                } else {
                    // 没有API，使用localStorage
                    saveToLocalStorage(formData);
                    showToast('留言已保存，我们会尽快联系您！', 'success');
                    contactForm.reset();
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('提交错误:', error);
                showToast('提交失败，请稍后重试', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // 保存到localStorage
    function saveToLocalStorage(formData) {
        try {
            const consultations = JSON.parse(localStorage.getItem('itTechConsultations') || '[]');
            const newConsultation = {
                id: Date.now(),
                ...formData,
                timestamp: new Date().toISOString(),
                read: false
            };
            
            consultations.push(newConsultation);
            localStorage.setItem('itTechConsultations', JSON.stringify(consultations));
            
            // 更新管理后台的留言数量显示
            updateAdminMessageCount();
            
            return true;
        } catch (error) {
            console.error('保存到localStorage失败:', error);
            return false;
        }
    }
    
    // 更新管理后台留言数量
    function updateAdminMessageCount() {
        const messageCountElement = document.getElementById('messageCount');
        if (messageCountElement) {
            try {
                const consultations = JSON.parse(localStorage.getItem('itTechConsultations') || '[]');
                const unreadCount = consultations.filter(c => !c.read).length;
                messageCountElement.textContent = unreadCount;
                messageCountElement.style.display = unreadCount > 0 ? 'inline-block' : 'none';
            } catch (error) {
                console.error('更新留言数量失败:', error);
            }
        }
    }
    
    // 显示提示消息
    function showToast(message, type = 'info') {
        // 移除现有的提示
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 创建新提示
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // 添加样式
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : '#4361ee'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: toastSlideIn 0.3s ease;
        `;
        
        // 添加动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes toastSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes toastSlideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(toast);
        
        // 3秒后自动消失
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
    // 页面加载时更新留言数量
    updateAdminMessageCount();
    
    // 初始化完成
    console.log('IT技术服务站 - JavaScript初始化完成');
});