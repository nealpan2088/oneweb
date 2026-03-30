/**
 * 移动端功能增强模块
 * 版本: 1.0.0
 * 日期: 2026-03-30
 * 功能: 一键拨号、一键导航、微信增强、营业时间显示
 */

class MobileEnhancements {
    constructor() {
        this.shopInfo = null;
        this.init();
    }
    
    /**
     * 初始化
     */
    init() {
        console.log('移动端功能增强模块初始化...');
        
        // 监听DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEnhancements());
        } else {
            this.setupEnhancements();
        }
    }
    
    /**
     * 设置功能增强
     */
    setupEnhancements() {
        // 等待店铺信息加载
        this.waitForShopInfo().then(() => {
            console.log('店铺信息加载完成，开始设置增强功能');
            
            // 1. 增强电话功能
            this.enhancePhoneFunction();
            
            // 2. 增强地址/导航功能
            this.enhanceAddressFunction();
            
            // 3. 增强微信功能
            this.enhanceWechatFunction();
            
            // 4. 增强营业时间显示
            this.enhanceBusinessHours();
            
            // 5. 添加功能提示
            this.addFeatureTips();
        }).catch(error => {
            console.warn('等待店铺信息超时，使用默认增强:', error);
            this.setupDefaultEnhancements();
        });
    }
    
    /**
     * 等待店铺信息加载
     */
    waitForShopInfo() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 10;
            
            const checkShopInfo = () => {
                attempts++;
                
                // 尝试从全局变量获取店铺信息
                if (window.shopData || window.currentShop) {
                    this.shopInfo = window.shopData || window.currentShop;
                    resolve();
                } 
                // 尝试从DOM获取
                else if (document.getElementById('shopName') && document.getElementById('shopName').textContent !== '加载中...') {
                    this.extractShopInfoFromDOM();
                    resolve();
                }
                // 尝试从shopService获取
                else if (window.shopService) {
                    window.shopService.getShopInfo().then(shopInfo => {
                        this.shopInfo = shopInfo;
                        resolve();
                    }).catch(() => {
                        if (attempts >= maxAttempts) reject(new Error('获取店铺信息超时'));
                        else setTimeout(checkShopInfo, 500);
                    });
                }
                // 继续等待
                else {
                    if (attempts >= maxAttempts) reject(new Error('获取店铺信息超时'));
                    else setTimeout(checkShopInfo, 500);
                }
            };
            
            checkShopInfo();
        });
    }
    
    /**
     * 从DOM提取店铺信息
     */
    extractShopInfoFromDOM() {
        this.shopInfo = {
            name: document.getElementById('shopName')?.textContent || '店铺',
            phone: document.getElementById('shopPhone')?.textContent || '',
            address: document.getElementById('shopAddress')?.textContent || '',
            wechat_id: document.querySelector('[data-wechat]')?.dataset.wechat || '',
            business_hours: document.getElementById('businessHours')?.textContent || ''
        };
    }
    
    /**
     * 设置默认增强（店铺信息不可用时）
     */
    setupDefaultEnhancements() {
        console.log('使用默认增强功能');
        
        // 默认店铺信息
        this.shopInfo = {
            name: '旺财咖啡馆',
            phone: '010-88888888',
            address: '北京市朝阳区建国路 88 号 SOHO 现代城 1 层',
            wechat_id: 'WangCafe_Service',
            business_hours: '周一至周日 09:00-22:00'
        };
        
        this.enhancePhoneFunction();
        this.enhanceAddressFunction();
        this.enhanceWechatFunction();
        this.enhanceBusinessHours();
    }
    
    /**
     * 增强电话功能 - 一键拨号
     */
    enhancePhoneFunction() {
        const phoneElements = document.querySelectorAll('.shop-phone, [data-phone], .contact-phone');
        
        phoneElements.forEach(element => {
            const phoneNumber = element.textContent.trim() || element.dataset.phone || this.shopInfo.phone;
            
            if (phoneNumber && this.isValidPhoneNumber(phoneNumber)) {
                // 移除原有事件
                element.removeAttribute('onclick');
                
                // 添加一键拨号功能
                element.style.cursor = 'pointer';
                element.title = '点击一键拨号';
                element.classList.add('clickable-phone');
                
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.makePhoneCall(phoneNumber);
                });
                
                // 添加手机端提示
                if (this.isMobileDevice()) {
                    this.addPhoneHint(element, phoneNumber);
                }
                
                console.log(`电话功能增强完成: ${phoneNumber}`);
            }
        });
        
        // 如果没有找到电话元素，创建一个
        if (phoneElements.length === 0 && this.shopInfo.phone) {
            this.createPhoneButton();
        }
    }
    
    /**
     * 增强地址功能 - 一键导航
     */
    enhanceAddressFunction() {
        const addressElements = document.querySelectorAll('.shop-address, [data-address], .contact-address');
        
        addressElements.forEach(element => {
            const address = element.textContent.trim() || element.dataset.address || this.shopInfo.address;
            
            if (address) {
                // 移除原有事件
                element.removeAttribute('onclick');
                
                // 添加一键导航功能
                element.style.cursor = 'pointer';
                element.title = '点击一键导航';
                element.classList.add('clickable-address');
                
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openNavigation(address);
                });
                
                // 添加导航图标
                this.addNavigationIcon(element);
                
                console.log(`地址功能增强完成: ${address}`);
            }
        });
        
        // 如果没有找到地址元素，创建一个
        if (addressElements.length === 0 && this.shopInfo.address) {
            this.createAddressButton();
        }
    }
    
    /**
     * 增强微信功能
     */
    enhanceWechatFunction() {
        const wechatElements = document.querySelectorAll('.wechat-btn, [data-wechat], .contact-wechat');
        
        wechatElements.forEach(element => {
            const wechatId = element.dataset.wechat || this.shopInfo.wechat_id;
            
            if (wechatId) {
                // 移除原有事件
                element.removeAttribute('onclick');
                
                // 添加增强微信功能
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showWechatOptions(wechatId);
                });
                
                // 添加微信图标提示
                element.title = `微信号: ${wechatId}\n点击显示更多选项`;
                
                console.log(`微信功能增强完成: ${wechatId}`);
            }
        });
        
        // 如果没有微信按钮，检查是否有微信相关元素
        if (wechatElements.length === 0) {
            this.createWechatButton();
        }
    }
    
    /**
     * 增强营业时间显示
     */
    enhanceBusinessHours() {
        const hoursElements = document.querySelectorAll('.business-hours, [data-hours], .opening-hours');
        
        hoursElements.forEach(element => {
            const hoursText = element.textContent.trim() || element.dataset.hours || this.shopInfo.business_hours;
            
            if (hoursText) {
                // 解析营业时间
                const parsedHours = this.parseBusinessHours(hoursText);
                
                // 更新显示
                element.innerHTML = this.formatBusinessHours(parsedHours);
                
                // 添加营业状态指示
                this.addBusinessStatusIndicator(element, parsedHours);
                
                console.log(`营业时间增强完成`);
            }
        });
        
        // 如果没有营业时间元素，创建一个
        if (hoursElements.length === 0) {
            this.createBusinessHoursDisplay();
        }
    }
    
    /**
     * 添加功能提示
     */
    addFeatureTips() {
        // 在页面底部添加功能提示
        const tipsContainer = document.createElement('div');
        tipsContainer.className = 'mobile-feature-tips';
        tipsContainer.style.cssText = `
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
            font-size: 14px;
            color: #666;
            border-left: 4px solid #4361ee;
        `;
        
        tipsContainer.innerHTML = `
            <div style="font-weight: bold; color: #4361ee; margin-bottom: 8px;">📱 移动端便捷功能：</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                <div>📞 <strong>一键拨号</strong>: 点击电话号码直接拨打</div>
                <div>📍 <strong>一键导航</strong>: 点击地址调用地图App</div>
                <div>💬 <strong>微信增强</strong>: 显示微信号和二维码</div>
                <div>⏰ <strong>营业时间</strong>: 实时状态和节假日提醒</div>
            </div>
        `;
        
        // 添加到页面合适的位置
        const container = document.querySelector('.container, main, .content') || document.body;
        container.appendChild(tipsContainer);
    }
    
    /**
     * 执行拨号
     */
    makePhoneCall(phoneNumber) {
        const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
        
        if (this.isMobileDevice()) {
            // 移动端：使用tel协议
            window.location.href = `tel:${cleanNumber}`;
        } else {
            // 桌面端：显示号码和复制选项
            if (confirm(`拨打电话: ${phoneNumber}\n\n在手机上会自动拨打，桌面端请手动拨打。\n\n是否复制号码到剪贴板？`)) {
                navigator.clipboard.writeText(phoneNumber).then(() => {
                    alert(`电话号码已复制: ${phoneNumber}`);
                }).catch(() => {
                    prompt('请手动复制电话号码:', phoneNumber);
                });
            }
        }
    }
    
    /**
     * 打开导航
     */
    openNavigation(address) {
        const encodedAddress = encodeURIComponent(address);
        
        if (this.isMobileDevice()) {
            // 移动端：提供多个地图App选择
            const mapOptions = [
                { name: '高德地图', url: `amapuri://route/plan/?dname=${encodedAddress}&dev=0&t=0` },
                { name: '百度地图', url: `baidumap://map/direction?destination=${encodedAddress}&mode=driving` },
                { name: '腾讯地图', url: `qqmap://map/routeplan?type=drive&to=${encodedAddress}&referer=OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77` },
                { name: '苹果地图', url: `http://maps.apple.com/?daddr=${encodedAddress}` },
                { name: '谷歌地图', url: `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}` }
            ];
            
            this.showMapSelection(mapOptions, address);
        } else {
            // 桌面端：打开网页版地图
            window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
        }
    }
    
    /**
     * 显示微信选项
     */
    showWechatOptions(wechatId) {
        const options = [
            { 
                icon: '📋', 
                text: '复制微信号', 
                action: () => this.copyToClipboard(wechatId, '微信号')
            },
            { 
                icon: '💬', 
                text: '打开微信添加', 
                action: () => this.openWechatAddFriend(wechatId)
            },
            { 
                icon: '📱', 
                text: '显示二维码', 
                action: () => this.showQRCode(wechatId)
            },
            { 
                icon: 'ℹ️', 
                text: '添加说明', 
                action: () => this.showWechatInstructions(wechatId)
            }
        ];
        
        this.showActionSheet('微信联系选项', options, wechatId);
    }
    
    /**
     * 解析营业时间
     */
    parseBusinessHours(hoursText) {
        // 尝试解析JSON格式
        try {
            const parsed = JSON.parse(hoursText);
            if (parsed && typeof parsed === 'object') {
                return {
                    open: parsed.open || '09:00',
                    close: parsed.close || '22:00',
                    description: parsed.description || hoursText,
                    special: parsed.special || null
                };
            }
        } catch (e) {
            // 不是JSON，按文本处理
        }
        
        // 从文本中提取时间
        const timeMatch = hoursText.match(/(\d{1,2}):(\d{2})[~\-至](\d{1,2}):(\d{2})/);
        
        if (timeMatch) {
            return {
                open: `${timeMatch[1]}:${timeMatch[2]}`,
                close: `${timeMatch[3]}:${timeMatch[4]}`,
                description: hoursText,
                special: null
            };
        }
        
        // 默认值
        return {
            open: '09:00',
            close: '22:00',
            description: hoursText,
            special: null
        };
    }
    
    /**
     * 格式化营业时间显示
     */
    formatBusinessHours(hours) {
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        const openTime = parseInt(hours.open.replace(':', ''));
        const closeTime = parseInt(hours.close.replace(':', ''));
        
        let status = '营业中';
        let statusClass = 'open';
        
        if (currentTime < openTime) {
            status = `未营业 (${hours.open}开始)`;
            statusClass = 'closed';
        } else if (currentTime > closeTime) {
            status = '已打烊';
            statusClass = 'closed';
        }
        
        // 检查特殊时间（如节假日）
        const specialNotice = this.checkSpecialHours(now, hours.special);
        
        return `
            <div class="business-hours-display">
                <div class="hours-main">
                    <span class="hours-icon">⏰</span>
                    <span class="hours-text">${hours.description}</span>
                </div>
                <div class="hours-status ${statusClass}">
                    ${status}
                    ${specialNotice ? `<div class="special-notice">${specialNotice}</div>` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * 检查特殊营业时间
     */
    checkSpecialHours(date, specialConfig) {
        if (!specialConfig) return null;
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dateStr = `${month}/${day}`;
        
        // 检查节假日
        if (specialConfig.holidays && Array.isArray(specialConfig.holidays)) {
            for (const holiday of specialConfig.holidays) {
                if (holiday.date === dateStr || holiday.date === `${year}-${month}-${day}`) {
                    return holiday.notice || '节假日营业时间调整';
                }
            }
        }
        
        // 检查特殊日期
        if (specialConfig.specialDates && specialConfig.specialDates[dateStr]) {
            return specialConfig.specialDates[dateStr];
        }
        
        return null;
    }
    
    /**
     * 工具方法
     */
    
    isValidPhoneNumber(phone) {
        return /[\d+\-()\s]{7,}/.test(phone);
    }
    
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    copyToClipboard(text, label = '内容') {
        navigator.clipboard.writeText(text).then(() => {
            alert(`${label}已复制到剪贴板: ${text}`);
        }).catch(() => {
            prompt(`请手动复制${label}:`, text);
        });
    }
    
    openWechatAddFriend(wechatId) {
        if (this.isMobileDevice()) {
            // 移动端：尝试打开微信
            window.location.href = `weixin://dl/add?username=${wechatId}`;
        } else {
            alert(`请在微信中搜索添加好友: ${wechatId}`);
        }
    }
    
    showQRCode(wechatId) {
        // 创建二维码显示模态框
        const modal = document.createElement('div');
        modal.className = 'qr-code-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; text-align: center; max-width: 300px;">
                <h3 style="margin-top: 0;">微信二维码</h3>
                <div style="margin: 20px 0; padding: 20px; background: #f5f5f5; border-radius: 10px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📱</div>
                    <div style="font-weight: bold; color: #333;">${wechatId}</div>
                    <div style="color: #666; font-size: 14px; margin-top: 10px;">微信扫一扫添加好友</div>
                </div>
                <div style="color: #666; font-size: 14px; margin-bottom: 20px;">
                    或搜索微信号: <strong>${wechatId}</strong>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #07c160; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    关闭
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    showWechatInstructions(wechatId) {
        const instructions = `
            <strong>添加微信好友步骤：</strong>
            <ol style="text-align: left; margin: 15px 0; padding-left: 20px;">
                <li>打开微信 → 点击右上角"+"号</li>
                <li>选择"添加朋友"</li>
                <li>在搜索框输入: <strong>${wechatId}</strong></li>
                <li>点击搜索到的用户</li>
                <li>点击"添加到通讯录"</li>
                <li>在验证信息中备注: "来自店铺小程序"</li>
                <li>等待对方通过验证</li>
            </ol>
            <div style="color: #666; font-size: 14px;">
                💡 提示: 添加后即可直接聊天联系
            </div>
        `;
        
        alert(instructions);
    }
    
    showMapSelection(mapOptions, address) {
        let optionsText = '选择地图App导航:\n\n';
        mapOptions.forEach((option, index) => {
            optionsText += `${index + 1}. ${option.name}\n`;
        });
        optionsText += `\n目的地: ${address}`;
        
        const choice = prompt(optionsText + '\n\n输入数字选择(1-5)，或直接点击确定使用默认地图:');
        
        if (choice && !isNaN(choice) && choice >= 1 && choice <= mapOptions.length) {
            const selectedMap = mapOptions[parseInt(choice) - 1];
            window.location.href = selectedMap.url;
        } else {
            // 默认使用第一个可用的地图
            window.location.href = mapOptions[0].url;
        }
    }
    
    showActionSheet(title, options, wechatId) {
        if (this.isMobileDevice()) {
            // 移动端：显示操作列表
            let optionsText = `${title}\n微信号: ${wechatId}\n\n`;
            options.forEach((option, index) => {
                optionsText += `${index + 1}. ${option.icon} ${option.text}\n`;
            });
            
            const choice = prompt(optionsText + '\n输入数字选择操作:');
            
            if (choice && !isNaN(choice) && choice >= 1 && choice <= options.length) {
                options[parseInt(choice) - 1].action();
            }
        } else {
            // 桌面端：显示对话框选择
            let optionsHTML = `<strong>${title}</strong><br>微信号: <code>${wechatId}</code><br><br>`;
            options.forEach((option, index) => {
                optionsHTML += `<button onclick="window.mobileEnhancements?.selectOption(${index})" 
                    style="display: block; width: 100%; margin: 5px 0; padding: 10px; text-align: left; background: #f0f0f0; border: none; border-radius: 5px; cursor: pointer;">
                    ${option.icon} ${option.text}
                </button>`;
            });
            
            const dialog = document.createElement('div');
            dialog.className = 'action-sheet-dialog';
            dialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                z-index: 1000;
                min-width: 300px;
            `;
            
            dialog.innerHTML = optionsHTML + `
                <button onclick="this.parentElement.remove()" 
                    style="margin-top: 15px; padding: 8px 15px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    取消
                </button>
            `;
            
            document.body.appendChild(dialog);
            
            // 存储选项供按钮调用
            window.mobileEnhancements = window.mobileEnhancements || this;
            window.mobileEnhancements.currentOptions = options;
            window.mobileEnhancements.selectOption = (index) => {
                if (window.mobileEnhancements.currentOptions[index]) {
                    window.mobileEnhancements.currentOptions[index].action();
                }
                dialog.remove();
            };
            
            // 点击背景关闭
            const backdrop = document.createElement('div');
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 999;
            `;
            backdrop.onclick = () => {
                dialog.remove();
                backdrop.remove();
            };
            document.body.appendChild(backdrop);
        }
    }
    
    addPhoneHint(element, phoneNumber) {
        const hint = document.createElement('div');
        hint.className = 'phone-hint';
        hint.style.cssText = `
            font-size: 12px;
            color: #07c160;
            margin-top: 5px;
            display: flex;
            align-items: center;
            gap: 5px;
        `;
        hint.innerHTML = `📱 点击直接拨打`;
        
        element.parentNode.insertBefore(hint, element.nextSibling);
    }
    
    addNavigationIcon(element) {
        const icon = document.createElement('span');
        icon.className = 'navigation-icon';
        icon.style.cssText = `
            margin-left: 8px;
            color: #4361ee;
            font-size: 1.2em;
        `;
        icon.textContent = '📍';
        
        element.appendChild(icon);
    }
    
    addBusinessStatusIndicator(element, hours) {
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        const openTime = parseInt(hours.open.replace(':', ''));
        const closeTime = parseInt(hours.close.replace(':', ''));
        
        let statusText = '';
        let statusColor = '';
        
        if (currentTime >= openTime && currentTime <= closeTime) {
            statusText = '🟢 营业中';
            statusColor = '#38a169';
        } else if (currentTime < openTime) {
            const hoursLeft = Math.ceil((openTime - currentTime) / 100);
            statusText = `🔴 未营业 (${hoursLeft}小时后营业)`;
            statusColor = '#e53e3e';
        } else {
            statusText = '🔴 已打烊';
            statusColor = '#e53e3e';
        }
        
        const statusElement = document.createElement('div');
        statusElement.className = 'business-status';
        statusElement.style.cssText = `
            display: inline-block;
            margin-left: 10px;
            padding: 2px 8px;
            border-radius: 12px;
            background: ${statusColor}15;
            color: ${statusColor};
            font-size: 12px;
            font-weight: 500;
        `;
        statusElement.textContent = statusText;
        
        element.appendChild(statusElement);
    }
    
    createPhoneButton() {
        const phoneContainer = document.querySelector('.contact-info, .shop-info, .header') || document.body;
        
        const phoneButton = document.createElement('div');
        phoneButton.className = 'enhanced-phone-button';
        phoneButton.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 15px;
            background: linear-gradient(135deg, #38a169, #2f855a);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            margin: 10px 0;
            box-shadow: 0 3px 10px rgba(56, 161, 105, 0.3);
        `;
        phoneButton.innerHTML = `
            <span style="font-size: 1.2em;">📞</span>
            <span style="font-weight: bold;">${this.shopInfo.phone}</span>
            <span style="font-size: 0.9em; opacity: 0.9;">(一键拨打)</span>
        `;
        
        phoneButton.addEventListener('click', () => {
            this.makePhoneCall(this.shopInfo.phone);
        });
        
        phoneContainer.appendChild(phoneButton);
    }
    
    createAddressButton() {
        const addressContainer = document.querySelector('.contact-info, .shop-info, .header') || document.body;
        
        const addressButton = document.createElement('div');
        addressButton.className = 'enhanced-address-button';
        addressButton.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 15px;
            background: linear-gradient(135deg, #4361ee, #3a56d4);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            margin: 10px 0;
            box-shadow: 0 3px 10px rgba(67, 97, 238, 0.3);
        `;
        addressButton.innerHTML = `
            <span style="font-size: 1.2em;">📍</span>
            <span>${this.shopInfo.address}</span>
            <span style="font-size: 0.9em; opacity: 0.9;">(一键导航)</span>
        `;
        
        addressButton.addEventListener('click', () => {
            this.openNavigation(this.shopInfo.address);
        });
        
        addressContainer.appendChild(addressButton);
    }
    
    createWechatButton() {
        const wechatContainer = document.querySelector('.contact-info, .action-buttons, .header') || document.body;
        
        const wechatButton = document.createElement('button');
        wechatButton.className = 'enhanced-wechat-button';
        wechatButton.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            background: linear-gradient(135deg, #07c160, #06ad56);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            margin: 10px 0;
            font-size: 16px;
            box-shadow: 0 3px 10px rgba(7, 193, 96, 0.3);
        `;
        wechatButton.innerHTML = `
            <span style="font-size: 1.2em;">💬</span>
            <span style="font-weight: bold;">联系微信</span>
        `;
        
        wechatButton.addEventListener('click', () => {
            this.showWechatOptions(this.shopInfo.wechat_id);
        });
        
        wechatContainer.appendChild(wechatButton);
    }
    
    createBusinessHoursDisplay() {
        const hoursContainer = document.querySelector('.shop-info, .contact-info, .header') || document.body;
        
        const hoursDisplay = document.createElement('div');
        hoursDisplay.className = 'enhanced-business-hours';
        hoursDisplay.style.cssText = `
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
            margin: 10px 0;
            border-left: 4px solid #d69e2e;
        `;
        
        const parsedHours = this.parseBusinessHours(this.shopInfo.business_hours);
        hoursDisplay.innerHTML = this.formatBusinessHours(parsedHours);
        
        hoursContainer.appendChild(hoursDisplay);
    }
}

// 自动初始化
if (typeof window !== 'undefined') {
    window.MobileEnhancements = MobileEnhancements;
    
    // 页面加载后自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.mobileEnhancer = new MobileEnhancements();
        });
    } else {
        window.mobileEnhancer = new MobileEnhancements();
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileEnhancements;
}