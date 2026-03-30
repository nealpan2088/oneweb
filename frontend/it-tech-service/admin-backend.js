// 留言管理后台JavaScript（续）

// 查看留言详情
async function viewMessage(messageId) {
    const message = currentMessages.find(m => m.id === messageId);
    if (!message) {
        alert('留言不存在');
        return;
    }
    
    // 格式化时间
    const createdAt = new Date(message.createdAt);
    const updatedAt = new Date(message.updatedAt);
    
    const detailHTML = `
        <div class="message-detail-item">
            <div class="message-detail-label">留言ID</div>
            <div class="message-detail-value">${message.id}</div>
        </div>
        <div class="message-detail-item">
            <div class="message-detail-label">姓名</div>
            <div class="message-detail-value">${message.name}</div>
        </div>
        <div class="message-detail-item">
            <div class="message-detail-label">电话</div>
            <div class="message-detail-value">
                <a href="tel:${message.phone}" style="color: #4361ee; text-decoration: none;">
                    <i class="fas fa-phone"></i> ${message.phone}
                </a>
            </div>
        </div>
        <div class="message-detail-item">
            <div class="message-detail-label">邮箱</div>
            <div class="message-detail-value">
                ${message.email ? `
                    <a href="mailto:${message.email}" style="color: #4361ee; text-decoration: none;">
                        <i class="fas fa-envelope"></i> ${message.email}
                    </a>
                ` : '未提供'}
            </div>
        </div>
        <div class="message-detail-item">
            <div class="message-detail-label">服务类型</div>
            <div class="message-detail-value">${message.serviceType}</div>
        </div>
        <div class="message-detail-item">
            <div class="message-detail-label">预算范围</div>
            <div class="message-detail-value">${message.budget || '未指定'}</div>
        </div>
        <div class="message-detail-item">
            <div class="message-detail-label">留言内容</div>
            <div class="message-detail-value" style="white-space: pre-wrap; line-height: 1.6;">${message.content}</div>
        </div>
        <div class="message-detail-item">
            <div class="message-detail-label">状态</div>
            <div class="message-detail-value">
                ${message.status === 'pending' ? 
                    '<span class="status-badge status-pending">未读</span>' : 
                    message.status === 'read' ? 
                    '<span class="status-badge status-read">已读</span>' : 
                    '<span class="status-badge status-replied">已回复</span>'
                }
            </div>
        </div>
        <div class="message-detail-item">
            <div class="message-detail-label">提交时间</div>
            <div class="message-detail-value">${createdAt.toLocaleString('zh-CN')}</div>
        </div>
        <div class="message-detail-item">
            <div class="message-detail-label">最后更新</div>
            <div class="message-detail-value">${updatedAt.toLocaleString('zh-CN')}</div>
        </div>
        <div class="message-detail-item">
            <div class="message-detail-label">用户IP</div>
            <div class="message-detail-value">${message.ip || '未知'}</div>
        </div>
        <div class="message-detail-item">
            <div class="message-detail-label">操作</div>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                ${message.status === 'pending' ? `
                <button class="action-btn read-btn" onclick="markAsRead(${message.id}); closeModal();">
                    <i class="fas fa-check"></i> 标记为已读
                </button>
                ` : ''}
                <button class="action-btn delete-btn" onclick="deleteMessage(${message.id}); closeModal();">
                    <i class="fas fa-trash"></i> 删除留言
                </button>
                <button class="action-btn view-btn" onclick="replyToMessage(${message.id})">
                    <i class="fas fa-reply"></i> 回复用户
                </button>
                <button class="action-btn" onclick="copyContactInfo(${message.id})" style="background: #6c757d; color: white;">
                    <i class="fas fa-copy"></i> 复制信息
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('messageDetail').innerHTML = detailHTML;
    document.getElementById('messageModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 标记为已读
async function markAsRead(messageId) {
    if (!confirm('确定要标记这条留言为已读吗？')) {
        return;
    }
    
    try {
        const result = await window.messageAPI.markAsRead(messageId);
        
        if (result.success) {
            showNotification('留言已标记为已读', 'success');
            await loadMessages();
        } else {
            throw new Error(result.error || '操作失败');
        }
    } catch (error) {
        console.error('标记已读失败:', error);
        showNotification('操作失败: ' + error.message, 'error');
    }
}

// 删除留言
async function deleteMessage(messageId) {
    if (!confirm('确定要删除这条留言吗？此操作不可恢复。')) {
        return;
    }
    
    try {
        const result = await window.messageAPI.deleteMessage(messageId);
        
        if (result.success) {
            showNotification('留言已删除', 'success');
            await loadMessages();
        } else {
            throw new Error(result.error || '删除失败');
        }
    } catch (error) {
        console.error('删除留言失败:', error);
        showNotification('删除失败: ' + error.message, 'error');
    }
}

// 回复留言
function replyToMessage(messageId) {
    const message = currentMessages.find(m => m.id === messageId);
    if (!message) return;
    
    const phone = message.phone;
    const name = message.name;
    
    const replyText = `回复给 ${name} (${phone})：\n\n您好${name}，我是IT技术服务站的客服。看到您的留言关于"${message.serviceType}"，我们很乐意为您提供帮助。请问什么时间方便沟通？`;
    
    // 创建回复对话框
    const replyModal = document.createElement('div');
    replyModal.className = 'modal active';
    replyModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3><i class="fas fa-reply"></i> 回复留言</h3>
                <button class="modal-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div style="padding: 20px;">
                <div class="message-detail-item">
                    <div class="message-detail-label">收件人</div>
                    <div class="message-detail-value">${name} (${phone})</div>
                </div>
                <div class="message-detail-item">
                    <div class="message-detail-label">回复内容</div>
                    <textarea id="replyContent" style="width: 100%; height: 150px; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-family: inherit; resize: vertical;">${replyText}</textarea>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="action-btn" onclick="copyReplyText()" style="flex: 1;">
                        <i class="fas fa-copy"></i> 复制回复内容
                    </button>
                    <button class="action-btn view-btn" onclick="sendSMS(${messageId})" style="flex: 1;">
                        <i class="fas fa-sms"></i> 发送短信提醒
                    </button>
                </div>
                <div style="margin-top: 15px; font-size: 14px; color: #666;">
                    <p><i class="fas fa-lightbulb"></i> 建议：复制回复内容后，通过电话或微信联系用户。</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(replyModal);
    document.body.style.overflow = 'hidden';
}

// 复制回复内容
function copyReplyText() {
    const textarea = document.getElementById('replyContent');
    textarea.select();
    document.execCommand('copy');
    
    showNotification('回复内容已复制到剪贴板', 'success');
}

// 复制联系信息
function copyContactInfo(messageId) {
    const message = currentMessages.find(m => m.id === messageId);
    if (!message) return;
    
    const contactInfo = `姓名：${message.name}\n电话：${message.phone}\n邮箱：${message.email || '无'}\n服务需求：${message.serviceType}\n留言内容：${message.content}`;
    
    navigator.clipboard.writeText(contactInfo).then(() => {
        showNotification('联系信息已复制到剪贴板', 'success');
    }).catch(err => {
        console.error('复制失败:', err);
        showNotification('复制失败，请手动复制', 'error');
    });
}

// 发送短信提醒（模拟）
function sendSMS(messageId) {
    const message = currentMessages.find(m => m.id === messageId);
    if (!message) return;
    
    alert(`短信发送功能需要集成短信API。\n\n您可以手动发送短信到：${message.phone}\n内容：您好${message.name}，关于您的${message.serviceType}需求，我们已经收到，会尽快联系您。`);
}

// 关闭模态框
function closeModal() {
    document.getElementById('messageModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// 显示通知
function showNotification(message, type = 'info') {
    // 移除现有的通知
    const existingNotice = document.querySelector('.notification');
    if (existingNotice) {
        existingNotice.remove();
    }
    
    // 创建新通知
    const notice = document.createElement('div');
    notice.className = `notification ${type}`;
    notice.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // 添加样式
    notice.style.cssText = `
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
        animation: slideIn 0.3s ease;
    `;
    
    // 添加动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notice);
    
    // 3秒后自动消失
    setTimeout(() => {
        notice.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notice.parentNode) {
                notice.parentNode.removeChild(notice);
            }
        }, 300);
    }, 3000);
}

// 点击模态框外部关闭
document.getElementById('messageModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// ESC键关闭模态框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
        
        // 关闭所有模态框
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => {
            if (modal.id !== 'messageModal') {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        });
    }
});

// 导出函数供HTML调用
window.checkAPIStatus = checkAPIStatus;
window.loadMessages = loadMessages;
window.viewMessage = viewMessage;
window.markAsRead = markAsRead;
window.deleteMessage = deleteMessage;
window.replyToMessage = replyToMessage;
window.copyContactInfo = copyContactInfo;
window.closeModal = closeModal;