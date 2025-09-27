/**
 * Service Worker for HMIS PWA
 * Provides offline support, caching, and background sync
 */

const CACHE_NAME = 'hmis-v1.0.0';
const STATIC_CACHE_NAME = 'hmis-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'hmis-dynamic-v1.0.0';
const API_CACHE_NAME = 'hmis-api-v1.0.0';

// Files to cache for offline use
const STATIC_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/js/theme-manager.js',
    '/js/advanced-search.js',
    '/js/export-manager.js',
    '/js/real-time-notifications.js',
    '/js/emergency-alert-system.js',
    '/js/live-dashboard.js',
    '/js/reporting-dashboard.js',
    '/js/security-dashboard.js',
    '/js/api-service.js',
    '/js/config.js',
    '/js/security.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/offline.html'
];

// API endpoints to cache
const API_ENDPOINTS = [
    '/api/health',
    '/api/patients',
    '/api/doctors',
    '/api/appointments',
    '/api/notifications'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');

    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Failed to cache static files', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE_NAME &&
                            cacheName !== DYNAMIC_CACHE_NAME &&
                            cacheName !== API_CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle different types of requests
    if (request.destination === 'document') {
        event.respondWith(handleDocumentRequest(request));
    } else if (request.destination === 'script' || request.destination === 'style') {
        event.respondWith(handleStaticRequest(request));
    } else if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleAPIRequest(request));
    } else if (request.destination === 'image') {
        event.respondWith(handleImageRequest(request));
    } else {
        event.respondWith(handleGenericRequest(request));
    }
});

// Handle document requests (HTML pages)
async function handleDocumentRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }

        throw new Error('Network response not ok');
    } catch (error) {
        console.log('Service Worker: Network failed, trying cache for document');

        // Try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/offline.html');
        }

        throw error;
    }
}

// Handle static resource requests (CSS, JS)
async function handleStaticRequest(request) {
    try {
        // Try cache first for static resources
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Try network
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Failed to fetch static resource', request.url);
        throw error;
    }
}

// Handle API requests
async function handleAPIRequest(request) {
    try {
        // Try network first for API requests
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // Cache successful API responses
            const cache = await caches.open(API_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Network failed, trying cache for API');

        // Try cache for API requests
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline response for API requests
        return new Response(
            JSON.stringify({
                success: false,
                message: 'You are offline. Please check your internet connection.',
                offline: true
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}

// Handle image requests
async function handleImageRequest(request) {
    try {
        // Try cache first for images
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Try network
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Failed to fetch image', request.url);
        // Return a placeholder image or let it fail gracefully
        throw error;
    }
}

// Handle generic requests
async function handleGenericRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Network failed, trying cache');

        // Try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        throw error;
    }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered', event.tag);

    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// Background sync implementation
async function doBackgroundSync() {
    try {
        console.log('Service Worker: Performing background sync');

        // Get pending offline actions from IndexedDB
        const pendingActions = await getPendingActions();

        for (const action of pendingActions) {
            try {
                await syncAction(action);
                await removePendingAction(action.id);
                console.log('Service Worker: Synced action', action.id);
            } catch (error) {
                console.error('Service Worker: Failed to sync action', action.id, error);
            }
        }
    } catch (error) {
        console.error('Service Worker: Background sync failed', error);
    }
}

// Get pending actions from IndexedDB
async function getPendingActions() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('hmis-offline', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['pending-actions'], 'readonly');
            const store = transaction.objectStore('pending-actions');
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = () => resolve(getAllRequest.result);
            getAllRequest.onerror = () => reject(getAllRequest.error);
        };
    });
}

// Sync individual action
async function syncAction(action) {
    const response = await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body
    });

    if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
    }

    return response;
}

// Remove synced action from IndexedDB
async function removePendingAction(actionId) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('hmis-offline', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['pending-actions'], 'readwrite');
            const store = transaction.objectStore('pending-actions');
            const deleteRequest = store.delete(actionId);

            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
        };
    });
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');

    const options = {
        body: event.data ? event.data.text() : 'New notification from HMIS',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View Details',
                icon: '/icons/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icons/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('HMIS Notification', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked', event.action);

    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/notifications.html')
        );
    } else if (event.action === 'close') {
        // Just close the notification
        return;
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE_NAME)
                .then((cache) => {
                    return cache.addAll(event.data.urls);
                })
        );
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('Service Worker: Periodic sync triggered', event.tag);

    if (event.tag === 'content-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker: Error occurred', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker: Unhandled promise rejection', event.reason);
});

console.log('Service Worker: Loaded successfully');


