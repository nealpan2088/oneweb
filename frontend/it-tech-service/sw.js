// IT技术服务站 Service Worker
// 版本: 1.0.0
// 日期: 2026-03-29

const CACHE_NAME = 'it-tech-service-v1.0.0';
const OFFLINE_CACHE = 'it-tech-service-offline-v1';

// 需要缓存的资源
const STATIC_CACHE_URLS = [
    '/it-tech-service/',
    '/it-tech-service/index.html',
    '/it-tech-service/about.html',
    '/it-tech-service/gallery.html',
    '/it-tech-service/beian.html',
    '/it-tech-service/admin.html',
    '/it-tech-service/test.html',
    
    // CSS文件
    '/it-tech-service/css/style.css',
    
    // JavaScript文件
    '/it-tech-service/js/main-enhanced.js',
    '/it-tech-service/js/api.js',
    '/it-tech-service/js/main.js',
    
    // 字体和图标
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    
    // 图片资源
    '/it-tech-service/images/logo.svg',
    '/it-tech-service/images/favicon.ico',
    
    // 离线页面
    '/it-tech-service/offline.html'
];

// 需要缓存的API端点
const API_CACHE_URLS = [
    '/api/health',
    '/api/messages',
    '/api/gallery'
];

// 安装事件
self.addEventListener('install', event => {
    console.log('🔄 Service Worker 安装中...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 缓存静态资源...');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('✅ Service Worker 安装完成');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Service Worker 安装失败:', error);
            })
    );
});

// 激活事件
self.addEventListener('activate', event => {
    console.log('🔄 Service Worker 激活中...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // 删除旧版本的缓存
                    if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
                        console.log(`🗑️ 删除旧缓存: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('✅ Service Worker 激活完成');
            return self.clients.claim();
        })
    );
});

// 获取事件 - 缓存优先策略
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // 跳过非GET请求
    if (request.method !== 'GET') {
        return;
    }
    
    // 跳过浏览器扩展等
    if (request.url.startsWith('chrome-extension://')) {
        return;
    }
    
    // 处理API请求
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            handleApiRequest(request)
        );
        return;
    }
    
    // 处理静态资源请求
    event.respondWith(
        handleStaticRequest(request)
    );
});

// 处理API请求 - 网络优先，失败时使用缓存
async function handleApiRequest(request) {
    const cache = await caches.open(OFFLINE_CACHE);
    
    try {
        // 尝试从网络获取
        const networkResponse = await fetch(request);
        
        // 如果成功，更新缓存
        if (networkResponse.ok) {
            const clonedResponse = networkResponse.clone();
            cache.put(request, clonedResponse);
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('🌐 网络请求失败，尝试从缓存获取:', request.url);
        
        // 从缓存获取
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // 缓存也没有，返回离线响应
        return new Response(
            JSON.stringify({
                success: false,
                message: '网络连接失败，请检查网络后重试',
                offline: true
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// 处理静态资源请求 - 缓存优先
async function handleStaticRequest(request) {
    const cache = await caches.open(CACHE_NAME);
    
    // 首先尝试从缓存获取
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        // 同时也在后台更新缓存
        event.waitUntil(
            updateCache(request, cache)
        );
        return cachedResponse;
    }
    
    // 缓存没有，尝试网络
    try {
        const networkResponse = await fetch(request);
        
        // 如果成功，添加到缓存
        if (networkResponse.ok) {
            const clonedResponse = networkResponse.clone();
            cache.put(request, clonedResponse);
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('🌐 网络请求失败:', request.url);
        
        // 如果是页面请求，返回离线页面
        if (request.headers.get('Accept').includes('text/html')) {
            const offlinePage = await cache.match('/it-tech-service/offline.html');
            if (offlinePage) {
                return offlinePage;
            }
        }
        
        // 返回离线响应
        return new Response(
            '<h1>离线模式</h1><p>请检查网络连接后重试</p>',
            {
                status: 503,
                headers: { 'Content-Type': 'text/html' }
            }
        );
    }
}

// 更新缓存
async function updateCache(request, cache) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
    } catch (error) {
        // 静默失败，不影响用户体验
    }
}

// 后台同步 - 用于同步离线数据
self.addEventListener('sync', event => {
    console.log('🔄 后台同步事件:', event.tag);
    
    if (event.tag === 'sync-messages') {
        event.waitUntil(syncOfflineMessages());
    }
});

// 同步离线留言
async function syncOfflineMessages() {
    try {
        // 从IndexedDB获取离线留言
        const offlineMessages = await getOfflineMessages();
        
        if (offlineMessages.length === 0) {
            console.log('📭 没有需要同步的离线留言');
            return;
        }
        
        console.log(`📤 同步 ${offlineMessages.length} 条离线留言`);
        
        // 发送到服务器
        for (const message of offlineMessages) {
            try {
                const response = await fetch('/api/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(message)
                });
                
                if (response.ok) {
                    // 同步成功，从离线存储中删除
                    await removeOfflineMessage(message.id);
                    console.log(`✅ 留言同步成功: ${message.id}`);
                }
            } catch (error) {
                console.error(`❌ 留言同步失败: ${message.id}`, error);
            }
        }
        
    } catch (error) {
        console.error('❌ 同步过程出错:', error);
    }
}

// 消息事件 - 与页面通信
self.addEventListener('message', event => {
    console.log('📨 收到消息:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then(cache => cache.addAll(event.data.urls))
        );
    }
});

// IndexedDB操作（简化版）
function getOfflineMessages() {
    return new Promise((resolve) => {
        // 这里应该实现IndexedDB操作
        // 为了简化，我们使用localStorage
        try {
            const messages = JSON.parse(localStorage.getItem('offlineMessages') || '[]');
            resolve(messages);
        } catch (error) {
            resolve([]);
        }
    });
}

function removeOfflineMessage(id) {
    return new Promise((resolve) => {
        try {
            const messages = JSON.parse(localStorage.getItem('offlineMessages') || '[]');
            const filtered = messages.filter(msg => msg.id !== id);
            localStorage.setItem('offlineMessages', JSON.stringify(filtered));
            resolve();
        } catch (error) {
            resolve();
        }
    });
}

// 推送通知（如果需要）
self.addEventListener('push', event => {
    console.log('🔔 收到推送通知');
    
    const options = {
        body: event.data ? event.data.text() : 'IT技术服务站通知',
        icon: '/it-tech-service/images/logo.png',
        badge: '/it-tech-service/images/badge.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        },
        actions: [
            {
                action: 'explore',
                title: '查看详情',
                icon: '/it-tech-service/images/check.png'
            },
            {
                action: 'close',
                title: '关闭',
                icon: '/it-tech-service/images/close.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('IT技术服务站', options)
    );
});

self.addEventListener('notificationclick', event => {
    console.log('🔔 通知被点击');
    
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then(clientList => {
                // 如果已经有打开的窗口，聚焦它
                for (const client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // 否则打开新窗口
                if (clients.openWindow) {
                    return clients.openWindow('/it-tech-service/');
                }
            })
    );
});

console.log('✅ Service Worker 加载完成');