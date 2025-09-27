/**
 * Mobile Optimization Manager for HMIS
 * Provides PWA features, responsive design, and offline support
 */

class MobileOptimizer {
    constructor() {
        this.isOnline = navigator.onLine;
        this.isMobile = this.detectMobile();
        this.isPWA = this.detectPWA();
        this.connectionQuality = 'unknown';
        this.offlineQueue = [];
        this.syncInProgress = false;

        this.init();
    }

    init() {
        this.setupPWA();
        this.setupOfflineSupport();
        this.setupResponsiveDesign();
        this.setupTouchOptimizations();
        this.setupPerformanceOptimizations();
        this.setupConnectionMonitoring();
        this.setupBackgroundSync();

        console.log('Mobile Optimizer initialized');
    }

    // PWA Setup
    setupPWA() {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered successfully');
                    this.setupServiceWorkerEvents(registration);
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });
        }

        // Install prompt handling
        this.setupInstallPrompt();

        // PWA lifecycle events
        this.setupPWALifecycle();
    }

    setupServiceWorkerEvents(registration) {
        // Handle updates
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    this.showUpdateNotification();
                }
            });
        });

        // Handle messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.handleServiceWorkerMessage(event.data);
        });
    }

    setupInstallPrompt() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            deferredPrompt = event;
            this.showInstallButton(deferredPrompt);
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            this.hideInstallButton();
        });
    }

    setupPWALifecycle() {
        // Handle app visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleAppBackground();
            } else {
                this.handleAppForeground();
            }
        });

        // Handle app focus/blur
        window.addEventListener('focus', () => {
            this.handleAppFocus();
        });

        window.addEventListener('blur', () => {
            this.handleAppBlur();
        });
    }

    // Offline Support
    setupOfflineSupport() {
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.handleOffline();
        });

        // Setup offline queue
        this.setupOfflineQueue();
    }

    setupOfflineQueue() {
        // Load existing offline actions from IndexedDB
        this.loadOfflineQueue();
    }

    async loadOfflineQueue() {
        try {
            const db = await this.openIndexedDB();
            const transaction = db.transaction(['offline-queue'], 'readonly');
            const store = transaction.objectStore('offline-queue');
            const request = store.getAll();

            request.onsuccess = () => {
                this.offlineQueue = request.result || [];
                console.log('Loaded offline queue:', this.offlineQueue.length, 'items');
            };
        } catch (error) {
            console.error('Failed to load offline queue:', error);
        }
    }

    async addToOfflineQueue(action) {
        try {
            const db = await this.openIndexedDB();
            const transaction = db.transaction(['offline-queue'], 'readwrite');
            const store = transaction.objectStore('offline-queue');

            const offlineAction = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                action: action,
                status: 'pending'
            };

            store.add(offlineAction);
            this.offlineQueue.push(offlineAction);

            console.log('Added to offline queue:', offlineAction);
        } catch (error) {
            console.error('Failed to add to offline queue:', error);
        }
    }

    async syncOfflineQueue() {
        if (this.syncInProgress || !this.isOnline) {
            return;
        }

        this.syncInProgress = true;
        console.log('Starting offline queue sync...');

        try {
            for (const item of this.offlineQueue) {
                if (item.status === 'pending') {
                    await this.syncOfflineAction(item);
                }
            }

            console.log('Offline queue sync completed');
        } catch (error) {
            console.error('Offline queue sync failed:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    async syncOfflineAction(item) {
        try {
            const response = await fetch(item.action.url, {
                method: item.action.method,
                headers: item.action.headers,
                body: item.action.body
            });

            if (response.ok) {
                item.status = 'completed';
                await this.removeFromOfflineQueue(item.id);
                console.log('Synced offline action:', item.id);
            } else {
                throw new Error(`Sync failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to sync offline action:', item.id, error);
            item.status = 'failed';
        }
    }

    async removeFromOfflineQueue(id) {
        try {
            const db = await this.openIndexedDB();
            const transaction = db.transaction(['offline-queue'], 'readwrite');
            const store = transaction.objectStore('offline-queue');
            store.delete(id);

            this.offlineQueue = this.offlineQueue.filter(item => item.id !== id);
        } catch (error) {
            console.error('Failed to remove from offline queue:', error);
        }
    }

    // Responsive Design
    setupResponsiveDesign() {
        // Handle viewport changes
        this.handleViewportChanges();

        // Setup responsive breakpoints
        this.setupResponsiveBreakpoints();

        // Handle orientation changes
        this.handleOrientationChanges();
    }

    handleViewportChanges() {
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                this.updateResponsiveClasses(entry.contentRect.width);
            }
        });

        resizeObserver.observe(document.body);
    }

    setupResponsiveBreakpoints() {
        this.breakpoints = {
            mobile: 768,
            tablet: 1024,
            desktop: 1200
        };
    }

    updateResponsiveClasses(width) {
        const body = document.body;

        // Remove existing responsive classes
        body.classList.remove('mobile', 'tablet', 'desktop');

        if (width < this.breakpoints.mobile) {
            body.classList.add('mobile');
        } else if (width < this.breakpoints.tablet) {
            body.classList.add('tablet');
        } else {
            body.classList.add('desktop');
        }
    }

    handleOrientationChanges() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.updateResponsiveClasses(window.innerWidth);
            }, 100);
        });
    }

    // Touch Optimizations
    setupTouchOptimizations() {
        if (this.isMobile) {
            this.setupTouchGestures();
            this.setupTouchFeedback();
            this.setupSwipeNavigation();
        }
    }

    setupTouchGestures() {
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Setup touch gestures
        this.setupTouchGesture('swipe-left', (startX, startY, endX, endY) => {
            return startX - endX > 50 && Math.abs(startY - endY) < 100;
        });

        this.setupTouchGesture('swipe-right', (startX, startY, endX, endY) => {
            return endX - startX > 50 && Math.abs(startY - endY) < 100;
        });

        this.setupTouchGesture('swipe-up', (startX, startY, endX, endY) => {
            return startY - endY > 50 && Math.abs(startX - endX) < 100;
        });

        this.setupTouchGesture('swipe-down', (startX, startY, endX, endY) => {
            return endY - startY > 50 && Math.abs(startX - endX) < 100;
        });
    }

    setupTouchGesture(name, condition) {
        let startX, startY, endX, endY;

        document.addEventListener('touchstart', (event) => {
            const touch = event.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        });

        document.addEventListener('touchend', (event) => {
            const touch = event.changedTouches[0];
            endX = touch.clientX;
            endY = touch.clientY;

            if (condition(startX, startY, endX, endY)) {
                this.handleTouchGesture(name, { startX, startY, endX, endY });
            }
        });
    }

    setupTouchFeedback() {
        // Add touch feedback to interactive elements
        const interactiveElements = document.querySelectorAll('button, a, [role="button"]');

        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', () => {
                element.classList.add('touch-active');
            });

            element.addEventListener('touchend', () => {
                setTimeout(() => {
                    element.classList.remove('touch-active');
                }, 150);
            });
        });
    }

    setupSwipeNavigation() {
        // Implement swipe navigation for mobile
        this.handleTouchGesture('swipe-left', () => {
            this.navigateNext();
        });

        this.handleTouchGesture('swipe-right', () => {
            this.navigatePrevious();
        });
    }

    // Performance Optimizations
    setupPerformanceOptimizations() {
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.setupResourcePreloading();
        this.setupMemoryManagement();
    }

    setupLazyLoading() {
        // Lazy load images
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    setupImageOptimization() {
        // Optimize images based on device capabilities
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (ctx) {
            // Check for WebP support
            const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

            if (webpSupported) {
                document.body.classList.add('webp-supported');
            }
        }
    }

    setupResourcePreloading() {
        // Preload critical resources
        const criticalResources = [
            '/styles.css',
            '/js/api-service.js',
            '/js/config.js'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.endsWith('.css') ? 'style' : 'script';
            document.head.appendChild(link);
        });
    }

    setupMemoryManagement() {
        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
                    this.triggerMemoryCleanup();
                }
            }, 30000);
        }
    }

    // Connection Monitoring
    setupConnectionMonitoring() {
        this.monitorConnectionQuality();
        this.setupConnectionEvents();
    }

    monitorConnectionQuality() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.connectionQuality = connection.effectiveType;

            connection.addEventListener('change', () => {
                this.connectionQuality = connection.effectiveType;
                this.handleConnectionChange();
            });
        }
    }

    setupConnectionEvents() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.handleOffline();
        });
    }

    // Background Sync
    setupBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.sync.register('background-sync');
            });
        }
    }

    // Event Handlers
    handleOnline() {
        console.log('Connection restored');
        this.showConnectionStatus('online');
        this.syncOfflineQueue();
    }

    handleOffline() {
        console.log('Connection lost');
        this.showConnectionStatus('offline');
    }

    handleAppBackground() {
        console.log('App backgrounded');
        this.pauseNonCriticalTasks();
    }

    handleAppForeground() {
        console.log('App foregrounded');
        this.resumeTasks();
        this.syncOfflineQueue();
    }

    handleAppFocus() {
        console.log('App focused');
        this.resumeTasks();
    }

    handleAppBlur() {
        console.log('App blurred');
        this.pauseNonCriticalTasks();
    }

    handleConnectionChange() {
        console.log('Connection quality changed:', this.connectionQuality);
        this.adjustPerformanceForConnection();
    }

    // Utility Methods
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    detectPWA() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    }

    showConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.className = `connection-status ${status}`;
            statusElement.innerHTML = status === 'online'
                ? '<i class="fas fa-wifi"></i><span>Online</span>'
                : '<i class="fas fa-wifi-slash"></i><span>Offline</span>';
        }
    }

    showUpdateNotification() {
        if (confirm('A new version of HMIS is available. Would you like to update?')) {
            window.location.reload();
        }
    }

    showInstallButton(deferredPrompt) {
        const installButton = document.createElement('button');
        installButton.className = 'install-pwa-btn';
        installButton.innerHTML = '<i class="fas fa-download"></i> Install App';
        installButton.onclick = () => {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                deferredPrompt = null;
            });
        };

        document.body.appendChild(installButton);
    }

    hideInstallButton() {
        const installButton = document.querySelector('.install-pwa-btn');
        if (installButton) {
            installButton.remove();
        }
    }

    handleTouchGesture(name, coordinates) {
        console.log('Touch gesture detected:', name);
        // Implement gesture-specific actions
    }

    navigateNext() {
        // Implement next navigation
        console.log('Navigate next');
    }

    navigatePrevious() {
        // Implement previous navigation
        console.log('Navigate previous');
    }

    adjustPerformanceForConnection() {
        // Adjust performance based on connection quality
        if (this.connectionQuality === 'slow-2g' || this.connectionQuality === '2g') {
            this.enableLowBandwidthMode();
        } else {
            this.disableLowBandwidthMode();
        }
    }

    enableLowBandwidthMode() {
        document.body.classList.add('low-bandwidth');
        console.log('Low bandwidth mode enabled');
    }

    disableLowBandwidthMode() {
        document.body.classList.remove('low-bandwidth');
        console.log('Low bandwidth mode disabled');
    }

    pauseNonCriticalTasks() {
        // Pause non-critical tasks when app is backgrounded
        console.log('Pausing non-critical tasks');
    }

    resumeTasks() {
        // Resume tasks when app is foregrounded
        console.log('Resuming tasks');
    }

    triggerMemoryCleanup() {
        // Trigger memory cleanup
        console.log('Triggering memory cleanup');
        if (window.gc) {
            window.gc();
        }
    }

    handleServiceWorkerMessage(data) {
        console.log('Service Worker message:', data);
        // Handle messages from service worker
    }

    async openIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('hmis-offline', 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('offline-queue')) {
                    db.createObjectStore('offline-queue', { keyPath: 'id' });
                }
            };
        });
    }
}

// Initialize Mobile Optimizer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mobileOptimizer = new MobileOptimizer();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileOptimizer;
}


