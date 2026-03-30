// 管理后台JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 初始化登录
    initLogin();
    
    // 如果已登录，初始化管理后台
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        showAdminPage();
        initAdmin();
    }
});

// 登录功能
function initLogin() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // 简单验证（实际应用中应该使用后端验证）
            if (username === 'admin' && password === 'admin123') {
                // 登录成功
                localStorage.setItem('adminLoggedIn', 'true');
                showAdminPage();
                initAdmin();
            } else {
                // 登录失败
                loginError.style.display = 'block';
                setTimeout(() => {
                    loginError.style.display = 'none';
                }, 3000);
            }
        });
    }
}

// 显示管理后台页面
function showAdminPage() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('adminPage').style.display = 'block';
}

// 初始化管理后台
function initAdmin() {
    // 初始化菜单切换
    initMenu();
    
    // 初始化留言管理
    initMessages();
    
    // 初始化内容管理
    initContentEditor();
    
    // 初始化统计数据
    updateStats();
    
    // 初始化图片管理
    initGalleryManager();
    
    // 初始化系统设置
    initSettings();
}

// 菜单切换
function initMenu() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // 移除所有激活状态
            menuItems.forEach(i => i.classList.remove('active'));
            
            // 添加当前激活状态
            this.classList.add('active');
            
            // 切换内容区域
            const sectionId = this.getAttribute('data-section') + 'Section';
            const sections = document.querySelectorAll('.content-section');
            
            sections.forEach(section => {
                section.classList.remove('active');
            });
            
            document.getElementById(sectionId).classList.add('active');
        });
    });
}

// 留言数据（模拟数据）
let messages = [
    {
        id: 1,
        name: '张先生',
        phone: '138****5678',
        email: 'zhang@example.com',
        content: '我的电脑开不了机，能帮忙看看吗？',
        time: '2026-03-29 14:30',
        read: false
    },
    {
        id: 2,
        name: '李女士',
        phone: '139****1234',
        email: 'li@example.com',
        content: '需要重装Windows 11系统，请问什么时候方便？',
        time: '2026-03-29 13:15',
        read: true
    },
    {
        id: 3,
        name: '王先生',
        phone: '137****8765',
        email: 'wang@example.com',
        content: '打印机连接不上，能上门调试吗？',
        time: '2026-03-29 11:45',
        read: false
    },
    {
        id: 4,
        name: '陈女士',
        phone: '136****4321',
        email: 'chen@example.com',
        content: '数据恢复大概需要多长时间？',
        time: '2026-03-28 16:20',
        read: true
    }
];

// 初始化留言管理
function initMessages() {
    renderMessagesTable();
    
    // 监听留言表单提交（从网站首页）
    window.addEventListener('message', function(e) {
        if (e.data.type === 'NEW_MESSAGE') {
            const newMessage = {
                id: messages.length + 1,
                name: e.data.name,
                phone: e.data.phone,
                email: e.data.email,
                content: e.data.content,
                time: new Date().toLocaleString('zh-CN'),
                read: false
            };
            
            messages.unshift(newMessage);
            renderMessagesTable();
            updateStats();
            
            // 显示通知
            showNotification('收到新的留言：' + e.data.name);
        }
    });
}

// 渲染留言表格
function renderMessagesTable() {
    const tbody = document.querySelector('#messagesTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // 更新未读数量
    const unreadCount = messages.filter(m => !m.read).length;
    document.getElementById('unreadCount').textContent = unreadCount;
    
    messages.forEach(message => {
        const row = document.createElement('tr');
        row.className = message.read ? '' : 'unread';
        
        row.innerHTML = `
            <td>
                <div class="message-name">${message.name}</div>
                <div class="message-phone">${message.phone}</div>
            </td>
            <td>${message.email}</td>
            <td>
                <div class="message-content" title="${message.content}">${message.content}</div>
            </td>
            <td class="message-time">${message.time}</td>
            <td>
                <div class="message-actions">
                    <button class="action-btn view-btn" onclick="viewMessage(${message.id})">
                        <i class="fas fa-eye"></i> 查看
                    </button>
                    <button class="action-btn read-btn" onclick="markAsRead(${message.id})" ${message.read ? 'disabled style="opacity:0.5"' : ''}>
                        <i class="fas fa-check"></i> ${message.read ? '已读' : '标记已读'}
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteMessage(${message.id})">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// 查看留言详情
function viewMessage(id) {
    const message = messages.find(m => m.id === id);
    if (!message) return;
    
    // 标记为已读
    if (!message.read) {
        message.read = true;
        renderMessagesTable();
        updateStats();
    }
    
    // 显示详情模态框
    const modal = document.getElementById('messageModal');
    const modalContent = document.querySelector('.message-modal-content');
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>留言详情</h3>
            <button class="modal-close" onclick="closeModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="message-detail-item">
                <div class="message-detail-label">姓名</div>
                <div class="message-detail-value">${message.name}</div>
            </div>
            <div class="message-detail-item">
                <div class="message-detail-label">电话</div>
                <div class="message-detail-value">${message.phone}</div>
            </div>
            <div class="message-detail-item">
                <div class="message-detail-label">邮箱</div>
                <div class="message-detail-value">${message.email}</div>
            </div>
            <div class="message-detail-item">
                <div class="message-detail-label">留言时间</div>
                <div class="message-detail-value">${message.time}</div>
            </div>
            <div class="message-detail-item">
                <div class="message-detail-label">留言内容</div>
                <div class="message-detail-value" style="white-space: pre-wrap;">${message.content}</div>
            </div>
            <div class="message-detail-item">
                <div class="message-detail-label">操作</div>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button class="action-btn read-btn" onclick="markAsRead(${message.id}); closeModal();">
                        <i class="fas fa-check"></i> 标记已读
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteMessage(${message.id}); closeModal();">
                        <i class="fas fa-trash"></i> 删除留言
                    </button>
                    <button class="action-btn view-btn" onclick="replyToMessage(${message.id})">
                        <i class="fas fa-reply"></i> 回复
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 标记为已读
function markAsRead(id) {
    const message = messages.find(m => m.id === id);
    if (message) {
        message.read = true;
        renderMessagesTable();
        updateStats();
        showNotification('留言已标记为已读');
    }
}

// 删除留言
function deleteMessage(id) {
    if (confirm('确定要删除这条留言吗？')) {
        messages = messages.filter(m => m.id !== id);
        renderMessagesTable();
        updateStats();
        showNotification('留言已删除');
    }
}

// 回复留言
function replyToMessage(id) {
    const message = messages.find(m => m.id === id);
    if (!message) return;
    
    const phone = message.phone.replace(/\*/g, '');
    alert(`回复给 ${message.name} (${phone})\n\n请通过电话或微信联系对方。`);
}

// 关闭模态框
function closeModal() {
    const modal = document.getElementById('messageModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// 初始化内容编辑器
function initContentEditor() {
    const tabs = document.querySelectorAll('.editor-tab');
    const forms = document.querySelectorAll('.editor-form');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // 更新标签状态
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应表单
            forms.forEach(form => {
                form.classList.remove('active');
                if (form.id === tabId + 'Form') {
                    form.classList.add('active');
                }
            });
        });
    });
    
    // 加载现有内容
    loadContent();
    
    // 保存内容
    document.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const formId = this.getAttribute('data-form');
            saveContent(formId);
        });
    });
}

// 加载内容
function loadContent() {
    // 从localStorage加载保存的内容
    const savedContent = JSON.parse(localStorage.getItem('websiteContent') || '{}');
    
    // 首页内容
    if (savedContent.homeTitle) {
        document.getElementById('homeTitle').value = savedContent.homeTitle;
    }
    if (savedContent.homeDescription) {
        document.getElementById('homeDescription').value = savedContent.homeDescription;
    }
    
    // 关于我内容
    if (savedContent.aboutContent) {
        document.getElementById('aboutContent').value = savedContent.aboutContent;
    }
    
    // 联系方式
    if (savedContent.contactPhone) {
        document.getElementById('contactPhone').value = savedContent.contactPhone;
    }
    if (savedContent.contactWechat) {
        document.getElementById('contactWechat').value = savedContent.contactWechat;
    }
}

// 保存内容
function saveContent(formId) {
    const content = {};
    
    if (formId === 'homeForm') {
        content.homeTitle = document.getElementById('homeTitle').value;
        content.homeDescription = document.getElementById('homeDescription').value;
    } else if (formId === 'aboutForm') {
        content.aboutContent = document.getElementById('aboutContent').value;
    } else if (formId === 'contactForm') {
        content.contactPhone = document.getElementById('contactPhone').value;
        content.contactWechat = document.getElementById('contactWechat').value;
    }
    
    // 保存到localStorage
    const existingContent = JSON.parse(localStorage.getItem('websiteContent') || '{}');
    const newContent = { ...existingContent, ...content };
    localStorage.setItem('websiteContent', JSON.stringify(newContent));
    
    showNotification('内容已保存');
    
    // 在实际应用中，这里应该调用后端API保存到数据库
    // 并更新前端页面显示
}

// 初始化图片管理
function initGalleryManager() {
    // 这里可以添加图片上传和管理功能
    // 由于是静态网站，需要后端支持完整的图片管理
    console.log('图片管理初始化');
}

// 初始化系统设置
function initSettings() {
    // 加载保存的设置
    const savedSettings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
    
    if (savedSettings.siteName) {
        document.getElementById('siteName').value = savedSettings.siteName;
    }
    if (savedSettings.adminEmail) {
        document.getElementById('adminEmail').value = savedSettings.adminEmail;
    }
    
    // 保存设置
    document.getElementById('saveSettings').addEventListener('click', function() {
        const settings = {
            siteName: document.getElementById('siteName').value,
            adminEmail: document.getElementById('adminEmail').value,
            notificationEnabled: document.getElementById('notificationEnabled').checked
        };
        
        localStorage.setItem('adminSettings', JSON.stringify(settings));
        showNotification('设置已保存');
    });
}

// 更新统计数据
function updateStats() {
    const totalMessages = messages.length;
    const unreadMessages = messages.filter(m => !m.read).length;
    const todayMessages = messages.filter(m => {
        const today = new Date().toLocaleDateString('zh-CN');
        return m.time.includes(today);
    }).length;
    
    document.getElementById('totalMessages').textContent = totalMessages;
    document.getElementById('unreadMessages').textContent = unreadMessages;
    document.getElementById('todayMessages').textContent = todayMessages;
    document.getElementById('totalVisitors').textContent = Math.floor(Math.random() * 1000) + 500; // 模拟数据
}

// 显示通知
function showNotification(message) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 3000; display: flex; align-items: center; gap: 10px; animation: slideIn 0.3s ease;">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 3秒后移除
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 退出登录
function logout() {
    if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('adminLoggedIn');
        location.reload();
    }
}

// 全局点击事件 - 点击模态框外部关闭
document.addEventListener('click', function(e) {
    const modal = document.getElementById('messageModal');
    if (modal && e.target === modal) {
        closeModal();
    }
});

// ESC键关闭模态框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification {
        animation: slideIn 0.3s ease;
    }
`;
document.head.appendChild(style);