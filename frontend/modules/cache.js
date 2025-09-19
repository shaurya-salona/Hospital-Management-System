/**
 * Cache System Module
 * Implements intelligent caching for API responses and application data
 */

class CacheSystem {
    constructor(options = {}) {
        this.defaultTTL = options.defaultTTL || 300000; // 5 minutes
        this.maxSize = options.maxSize || 100;
        this.storage = new Map();
        this.timers = new Map();
        this.hitCount = 0;
        this.missCount = 0;

        // Cache configuration for different types of data
        this.cacheConfig = {
            'user-profile': { ttl: 600000, maxAge: 600000 }, // 10 minutes
            'patient-list': { ttl: 300000, maxAge: 300000 }, // 5 minutes
            'appointment-list': { ttl: 120000, maxAge: 120000 }, // 2 minutes
            'medical-records': { ttl: 600000, maxAge: 600000 }, // 10 minutes
            'inventory': { ttl: 300000, maxAge: 300000 }, // 5 minutes
            'analytics': { ttl: 300000, maxAge: 300000 }, // 5 minutes
            'static-data': { ttl: 3600000, maxAge: 3600000 }, // 1 hour
            'default': { ttl: this.defaultTTL, maxAge: this.defaultTTL }
        };

        this.init();
    }

    init() {
        // Clean up expired entries periodically
        setInterval(() => {
            this.cleanup();
        }, 60000); // Every minute

        // Listen for storage events (for multi-tab synchronization)
        window.addEventListener('storage', (e) => {
            if (e.key === 'hmis-cache') {
                this.loadFromStorage();
            }
        });

        // Load cache from localStorage on init
        this.loadFromStorage();
    }

    /**
     * Generate cache key from endpoint and parameters
     */
    generateKey(endpoint, params = {}) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((result, key) => {
                result[key] = params[key];
                return result;
            }, {});

        return `${endpoint}:${JSON.stringify(sortedParams)}`;
    }

    /**
     * Get cache configuration for a specific endpoint
     */
    getCacheConfig(endpoint) {
        // Check for specific endpoint configuration
        for (const [pattern, config] of Object.entries(this.cacheConfig)) {
            if (pattern !== 'default' && endpoint.includes(pattern)) {
                return config;
            }
        }
        return this.cacheConfig.default;
    }

    /**
     * Set cache entry
     */
    set(key, value, ttl = null) {
        const config = this.getCacheConfig(key);
        const entryTTL = ttl || config.ttl;
        const expiresAt = Date.now() + entryTTL;

        // Remove existing timer if any
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        // Set cache entry
        this.storage.set(key, {
            value,
            expiresAt,
            createdAt: Date.now(),
            accessCount: 0,
            lastAccessed: Date.now()
        });

        // Set expiration timer
        const timer = setTimeout(() => {
            this.delete(key);
        }, entryTTL);

        this.timers.set(key, timer);

        // Enforce max size
        if (this.storage.size > this.maxSize) {
            this.evictLRU();
        }

        // Persist to localStorage for important data
        this.persistToStorage(key, value, expiresAt);
    }

    /**
     * Get cache entry
     */
    get(key) {
        const entry = this.storage.get(key);

        if (!entry) {
            this.missCount++;
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.delete(key);
            this.missCount++;
            return null;
        }

        // Update access statistics
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        this.hitCount++;

        return entry.value;
    }

    /**
     * Delete cache entry
     */
    delete(key) {
        const entry = this.storage.get(key);
        if (entry) {
            this.storage.delete(key);

            // Clear timer
            if (this.timers.has(key)) {
                clearTimeout(this.timers.get(key));
                this.timers.delete(key);
            }

            // Remove from localStorage
            this.removeFromStorage(key);
        }
    }

    /**
     * Clear all cache entries
     */
    clear() {
        // Clear all timers
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();

        // Clear storage
        this.storage.clear();

        // Clear localStorage
        localStorage.removeItem('hmis-cache');

        // Reset statistics
        this.hitCount = 0;
        this.missCount = 0;
    }

    /**
     * Check if key exists and is not expired
     */
    has(key) {
        const entry = this.storage.get(key);
        return entry && Date.now() <= entry.expiresAt;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const totalRequests = this.hitCount + this.missCount;
        const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests * 100).toFixed(2) : 0;

        return {
            size: this.storage.size,
            maxSize: this.maxSize,
            hitCount: this.hitCount,
            missCount: this.missCount,
            hitRate: `${hitRate}%`,
            entries: Array.from(this.storage.keys())
        };
    }

    /**
     * Evict least recently used entry
     */
    evictLRU() {
        let oldestKey = null;
        let oldestTime = Date.now();

        for (const [key, entry] of this.storage.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.delete(oldestKey);
        }
    }

    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        const expiredKeys = [];

        for (const [key, entry] of this.storage.entries()) {
            if (now > entry.expiresAt) {
                expiredKeys.push(key);
            }
        }

        expiredKeys.forEach(key => this.delete(key));
    }

    /**
     * Persist important data to localStorage
     */
    persistToStorage(key, value, expiresAt) {
        try {
            const cacheData = JSON.parse(localStorage.getItem('hmis-cache') || '{}');

            // Only persist certain types of data
            if (this.shouldPersist(key)) {
                cacheData[key] = {
                    value,
                    expiresAt,
                    createdAt: Date.now()
                };

                localStorage.setItem('hmis-cache', JSON.stringify(cacheData));
            }
        } catch (error) {
            console.warn('Failed to persist cache to localStorage:', error);
        }
    }

    /**
     * Load cache from localStorage
     */
    loadFromStorage() {
        try {
            const cacheData = JSON.parse(localStorage.getItem('hmis-cache') || '{}');
            const now = Date.now();

            for (const [key, entry] of Object.entries(cacheData)) {
                if (now <= entry.expiresAt) {
                    this.storage.set(key, {
                        value: entry.value,
                        expiresAt: entry.expiresAt,
                        createdAt: entry.createdAt,
                        accessCount: 0,
                        lastAccessed: now
                    });
                }
            }
        } catch (error) {
            console.warn('Failed to load cache from localStorage:', error);
        }
    }

    /**
     * Remove entry from localStorage
     */
    removeFromStorage(key) {
        try {
            const cacheData = JSON.parse(localStorage.getItem('hmis-cache') || '{}');
            delete cacheData[key];
            localStorage.setItem('hmis-cache', JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to remove cache from localStorage:', error);
        }
    }

    /**
     * Determine if data should be persisted to localStorage
     */
    shouldPersist(key) {
        const persistPatterns = ['user-profile', 'static-data', 'medical-records'];
        return persistPatterns.some(pattern => key.includes(pattern));
    }

    /**
     * Invalidate cache entries matching pattern
     */
    invalidate(pattern) {
        const keysToDelete = [];

        for (const key of this.storage.keys()) {
            if (key.includes(pattern)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.delete(key));
    }

    /**
     * Preload data for better performance
     */
    async preload(endpoint, params = {}, fetcher) {
        const key = this.generateKey(endpoint, params);

        if (this.has(key)) {
            return this.get(key);
        }

        try {
            const data = await fetcher();
            this.set(key, data);
            return data;
        } catch (error) {
            console.error('Preload failed:', error);
            throw error;
        }
    }

    /**
     * Cache with background refresh
     */
    async cacheWithRefresh(key, fetcher, ttl = null) {
        const cached = this.get(key);

        if (cached) {
            // Return cached data immediately
            // Refresh in background if close to expiration
            const entry = this.storage.get(key);
            const timeUntilExpiry = entry.expiresAt - Date.now();
            const refreshThreshold = 60000; // 1 minute

            if (timeUntilExpiry < refreshThreshold) {
                // Refresh in background
                fetcher().then(data => {
                    this.set(key, data, ttl);
                }).catch(error => {
                    console.warn('Background refresh failed:', error);
                });
            }

            return cached;
        }

        // No cache, fetch and store
        const data = await fetcher();
        this.set(key, data, ttl);
        return data;
    }
}

// Make CacheSystem available globally
window.CacheSystem = CacheSystem;
