/**
 * WiFi密码弹窗模块
 * 版本: 1.0.0
 * 日期: 2026-03-30
 * 
 * 功能: 显示WiFi信息弹窗，密码模糊处理，点击复制功能
 */

class WifiModal {
    constructor() {
        this.modal = null;
        this.password = '';
        this.isPasswordCopied = false;
        this.init();
    }
    
    /**
     * 初始化模块
     */
    init() {
        // 确保样式已加载
        this.ensureStylesLoaded();
    }
    
    /**
     * 确保样式文件已加载
     */
    ensureStylesLoaded() {
        // 检查样式是否已加载
        if (!document.querySelector('link[href*="wifi-modal.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = './src/styles/wifi-modal.css';
            document.head.appendChild(link);
        }
    }
    
    /**
     * 显示WiFi信息弹窗
     * @param {Object} wifiInfo - WiFi信息对象
     * @param {string} wifiInfo.ssid - WiFi名称
     * @param {string} wifiInfo.password - WiFi密码
     * @param {Function} onClose - 关闭回调函数
     */
    show(wifiInfo, onClose = null) {
        this.password = wifiInfo.password || '';
        this.isPasswordCopied = false;
        
        // 创建弹窗
        this.createModal(wifiInfo, onClose);
        
        // 显示弹窗
        document.body.appendChild(this.modal);
        
        // 添加ESC键关闭支持
        this.addKeyboardSupport(onClose);
        
        // 记录显示时间（用于分析）
        this.logDisplay();
    }
    
    /**
     * 创建弹窗HTML
     */
    createModal(wifiInfo, onClose) {
        this.modal = document.createElement('div');
        this.modal.className = 'wifi-modal-overlay';
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-labelledby', 'wifi-modal-title');
        this.modal.setAttribute('aria-modal', 'true');
        
        const modalContent = `
            <div class="wifi-modal">
                <div class="wifi-modal-header">
                    <div class="wifi-modal-icon">📶</div>
                    <h2 class="wifi-modal-title" id="wifi-modal-title">WiFi信息</h2>
                </div>
                
                <div class="wifi-info">
                    <div class="wifi-info-item">
                        <div class="wifi-info-label">WiFi名称</div>
                        <div class="wifi-info-value">${wifiInfo.ssid || 'WangCafe_Guest'}</div>
                    </div>
                    
                    <div class="wifi-info-item">
                        <div class="wifi-info-label">WiFi密码</div>
                        <div class="password-display" id="passwordDisplay" 
                             title="点击复制密码" 
                             aria-label="WiFi密码，点击复制到剪贴板">
                            <span class="password-masked">●●●●●●●●</span>
                            <div class="password-hint">点击复制密码</div>
                        </div>
                    </div>
                </div>
                
                <div class="connection-guide">
                    <div class="connection-guide-title">
                        <span>📱</span> 连接指南
                    </div>
                    <ol class="connection-guide-steps">
                        <li>点击上方密码区域复制密码</li>
                        <li>打开手机WiFi设置</li>
                        <li>选择"${wifiInfo.ssid || 'WangCafe_Guest'}"网络</li>
                        <li>粘贴密码连接</li>
                    </ol>
                </div>
                
                <div class="wifi-modal-actions">
                    <button class="wifi-modal-btn wifi-modal-btn-secondary" 
                            id="closeBtn"
                            aria-label="关闭弹窗">
                        关闭
                    </button>
                    <button class="wifi-modal-btn wifi-modal-btn-primary" 
                            id="copyBtn"
                            aria-label="复制WiFi密码">
                        复制密码
                    </button>
                </div>
            </div>
        `;
        
        this.modal.innerHTML = modalContent;
        
        // 添加事件监听
        this.addEventListeners(onClose);
    }
    
    /**
     * 添加事件监听
     */
    addEventListeners(onClose) {
        // 密码显示区域点击事件
        const passwordDisplay = this.modal.querySelector('#passwordDisplay');
        passwordDisplay.addEventListener('click', () => this.copyPassword());
        
        // 复制按钮点击事件
        const copyBtn = this.modal.querySelector('#copyBtn');
        copyBtn.addEventListener('click', () => this.copyPassword());
        
        // 关闭按钮点击事件
        const closeBtn = this.modal.querySelector('#closeBtn');
        closeBtn.addEventListener('click', () => this.close(onClose));
        
        // 点击背景关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close(onClose);
            }
        });
    }
    
    /**
     * 添加键盘支持
     */
    addKeyboardSupport(onClose) {
        const handleKeyDown = (e) => {
            // ESC键关闭
            if (e.key === 'Escape') {
                this.close(onClose);
            }
            
            // Enter键在密码区域触发复制
            if (e.key === 'Enter' && e.target.id === 'passwordDisplay') {
                this.copyPassword();
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        
        // 保存事件处理器以便清理
        this.keydownHandler = handleKeyDown;
    }
    
    /**
     * 复制密码到剪贴板
     */
    async copyPassword() {
        if (!this.password) {
            this.showError('密码不可用');
            return;
        }
        
        try {
            // 使用现代Clipboard API
            await navigator.clipboard.writeText(this.password);
            
            // 显示成功反馈
            this.showCopyFeedback();
            
            // 更新状态
            this.isPasswordCopied = true;
            
            // 记录复制操作
            this.logCopy();
            
        } catch (error) {
            // 降级方案：使用旧API
            this.fallbackCopy();
        }
    }
    
    /**
     * 显示复制成功反馈
     */
    showCopyFeedback() {
        const passwordDisplay = this.modal.querySelector('#passwordDisplay');
        
        // 移除现有的反馈
        const existingFeedback = passwordDisplay.querySelector('.copy-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        // 创建反馈元素
        const feedback = document.createElement('div');
        feedback.className = 'copy-feedback';
        feedback.textContent = '✅ 密码已复制！';
        feedback.setAttribute('role', 'alert');
        feedback.setAttribute('aria-live', 'polite');
        
        passwordDisplay.appendChild(feedback);
        
        // 3秒后自动移除反馈
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, 2000);
        
        // 更新按钮文本
        const copyBtn = this.modal.querySelector('#copyBtn');
        copyBtn.textContent = '已复制 ✓';
        copyBtn.style.background = '#38a169';
        
        // 2秒后恢复按钮
        setTimeout(() => {
            copyBtn.textContent = '复制密码';
            copyBtn.style.background = '';
        }, 2000);
    }
    
    /**
     * 降级复制方案
     */
    fallbackCopy() {
        try {
            // 创建临时textarea
            const textarea = document.createElement('textarea');
            textarea.value = this.password;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            
            // 选中文本
            textarea.select();
            textarea.setSelectionRange(0, 99999); // 移动端支持
            
            // 执行复制
            const successful = document.execCommand('copy');
            
            // 清理
            document.body.removeChild(textarea);
            
            if (successful) {
                this.showCopyFeedback();
                this.isPasswordCopied = true;
                this.logCopy();
            } else {
                this.showError('复制失败，请手动复制');
            }
            
        } catch (error) {
            this.showError('复制失败: ' + error.message);
        }
    }
    
    /**
     * 显示错误信息
     */
    showError(message) {
        const passwordDisplay = this.modal.querySelector('#passwordDisplay');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'wifi-error';
        errorDiv.innerHTML = `
            <span class="wifi-error-icon">❌</span>
            <div>${message}</div>
        `;
        
        passwordDisplay.appendChild(errorDiv);
        
        // 5秒后移除错误信息
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
    
    /**
     * 关闭弹窗
     */
    close(onClose) {
        if (this.modal && this.modal.parentNode) {
            // 移除键盘事件监听
            if (this.keydownHandler) {
                document.removeEventListener('keydown', this.keydownHandler);
            }
            
            // 动画关闭
            this.modal.style.opacity = '0';
            this.modal.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                if (this.modal && this.modal.parentNode) {
                    this.modal.parentNode.removeChild(this.modal);
                    this.modal = null;
                    
                    // 执行回调
                    if (typeof onClose === 'function') {
                        onClose(this.isPasswordCopied);
                    }
                    
                    // 记录关闭
                    this.logClose();
                }
            }, 300);
        }
    }
    
    /**
     * 记录显示日志
     */
    logDisplay() {
        console.log('WiFi弹窗显示:', {
            timestamp: new Date().toISOString(),
            hasPassword: !!this.password,
            passwordLength: this.password.length
        });
    }
    
    /**
     * 记录复制日志
     */
    logCopy() {
        console.log('WiFi密码复制成功:', {
            timestamp: new Date().toISOString(),
            passwordLength: this.password.length
        });
    }
    
    /**
     * 记录关闭日志
     */
    logClose() {
        console.log('WiFi弹窗关闭:', {
            timestamp: new Date().toISOString(),
            wasCopied: this.isPasswordCopied
        });
    }
    
    /**
     * 静态方法：快速显示WiFi弹窗
     */
    static showWifiInfo(wifiInfo, onClose = null) {
        const modal = new WifiModal();
        modal.show(wifiInfo, onClose);
        return modal;
    }
}

// 通过命名空间访问
if (typeof window !== 'undefined') {
    try {
        if (window.registerModule) {
            window.registerModule('WifiModal', WifiModal);
            window.registerUtil('showWifiModal', function(wifiInfo, onClose) {
                return WifiModal.showWifiInfo(wifiInfo, onClose);
            });
        } else if (window.WangDian) {
            window.WangDian.modules = window.WangDian.modules || {};
            window.WangDian.modules.WifiModal = WifiModal;
            window.WangDian.utils = window.WangDian.utils || {};
            window.WangDian.utils.showWifiModal = function(wifiInfo, onClose) {
                return WifiModal.showWifiInfo(wifiInfo, onClose);
            };
        } else {
            // 回退方案：使用单一全局变量
            window.WangDian = {
                modules: {
                    WifiModal: WifiModal
                },
                utils: {
                    showWifiModal: function(wifiInfo, onClose) {
                        return WifiModal.showWifiInfo(wifiInfo, onClose);
                    }
                }
            };
        }
    } catch (e) {
        console.error('注册WiFi弹窗模块失败:', e);
        // 最后的回退方案
        window.WifiModal = WifiModal;
        window.showWifiModal = function(wifiInfo, onClose) {
            return WifiModal.showWifiInfo(wifiInfo, onClose);
        };
    }
}