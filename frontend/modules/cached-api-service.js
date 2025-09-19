/**
 * Enhanced API Service with Caching
 * Extends APIService with intelligent caching capabilities
 */

class CachedAPIService extends APIService {
    constructor(options = {}) {
        super();
        this.cache = new CacheSystem(options.cache || {});
        this.cacheEnabled = options.cacheEnabled !== false;
        this.retryAttempts = options.retryAttempts || 3;
        this.retryDelay = options.retryDelay || 1000;
    }

    /**
     * Enhanced request method with caching and retry logic
     */
    async request(endpoint, options = {}) {
        const {
            useCache = true,
            cacheTTL = null,
            retry = true,
            ...requestOptions
        } = options;

        const cacheKey = this.generateCacheKey(endpoint, requestOptions);

        // Try cache first if enabled and GET request
        if (this.cacheEnabled && useCache && (!requestOptions.method || requestOptions.method === 'GET')) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }

        // Make request with retry logic
        let lastError;
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await this.makeRequest(endpoint, requestOptions);

                // Cache successful GET responses
                if (this.cacheEnabled && useCache && (!requestOptions.method || requestOptions.method === 'GET')) {
                    this.cache.set(cacheKey, response, cacheTTL);
                }

                return response;
            } catch (error) {
                lastError = error;

                // Don't retry on client errors (4xx) or if retry is disabled
                if (error.status >= 400 && error.status < 500) {
                    throw error;
                }

                if (!retry || attempt === this.retryAttempts) {
                    throw error;
                }

                // Wait before retry
                await this.delay(this.retryDelay * attempt);
            }
        }

        throw lastError;
    }

    /**
     * Make actual HTTP request
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers
            },
            ...options
        };

        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                this.clearToken();
                window.location.href = '/login.html';
                throw new Error('Authentication required');
            }
            throw new Error(data.message || 'Request failed');
        }

        return data;
    }

    /**
     * Generate cache key from endpoint and options
     */
    generateCacheKey(endpoint, options = {}) {
        const params = {
            method: options.method || 'GET',
            body: options.body,
            ...options.params
        };

        return this.cache.generateKey(endpoint, params);
    }

    /**
     * Delay utility for retry logic
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Enhanced login with caching
     */
    async login(username, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            useCache: false
        });

        if (response.success) {
            this.setToken(response.data.token);
            localStorage.setItem('userData', JSON.stringify(response.data.user));

            // Cache user profile
            this.cache.set('user-profile', response.data.user, 600000); // 10 minutes
        }

        return response;
    }

    /**
     * Enhanced logout with cache clearing
     */
    async logout() {
        try {
            await this.request('/auth/logout', {
                method: 'POST',
                useCache: false
            });
        } finally {
            this.clearToken();
            this.cache.clear(); // Clear all cached data on logout
        }
    }

    /**
     * Enhanced getProfile with caching
     */
    async getProfile() {
        return await this.request('/auth/profile', {
            useCache: true,
            cacheTTL: 600000 // 10 minutes
        });
    }

    /**
     * Enhanced getPatients with intelligent caching
     */
    async getPatients(page = 1, limit = 10, filters = {}) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
        });

        return await this.request(`/patients?${params}`, {
            useCache: true,
            cacheTTL: 300000 // 5 minutes
        });
    }

    /**
     * Enhanced getAppointments with caching
     */
    async getAppointments(page = 1, limit = 10, filters = {}) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
        });

        return await this.request(`/appointments?${params}`, {
            useCache: true,
            cacheTTL: 120000 // 2 minutes
        });
    }

    /**
     * Enhanced getMedicalRecords with caching
     */
    async getMedicalRecords(patientId, page = 1, limit = 10) {
        const params = new URLSearchParams({
            patientId,
            page: page.toString(),
            limit: limit.toString()
        });

        return await this.request(`/medical/records?${params}`, {
            useCache: true,
            cacheTTL: 600000 // 10 minutes
        });
    }

    /**
     * Enhanced getInventory with caching
     */
    async getInventory(page = 1, limit = 10, filters = {}) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
        });

        return await this.request(`/inventory?${params}`, {
            useCache: true,
            cacheTTL: 300000 // 5 minutes
        });
    }

    /**
     * Enhanced getAnalytics with caching
     */
    async getAnalytics(type, period = 'month', filters = {}) {
        const params = new URLSearchParams({
            type,
            period,
            ...filters
        });

        return await this.request(`/analytics?${params}`, {
            useCache: true,
            cacheTTL: 300000 // 5 minutes
        });
    }

    /**
     * Create operations that invalidate related cache
     */
    async createPatient(patientData) {
        const response = await this.request('/patients', {
            method: 'POST',
            body: JSON.stringify(patientData),
            useCache: false
        });

        if (response.success) {
            // Invalidate patient list cache
            this.cache.invalidate('patient-list');
        }

        return response;
    }

    async updatePatient(patientId, updateData) {
        const response = await this.request(`/patients/${patientId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
            useCache: false
        });

        if (response.success) {
            // Invalidate patient-related caches
            this.cache.invalidate('patient-list');
            this.cache.invalidate(`patient-${patientId}`);
        }

        return response;
    }

    async createAppointment(appointmentData) {
        const response = await this.request('/appointments', {
            method: 'POST',
            body: JSON.stringify(appointmentData),
            useCache: false
        });

        if (response.success) {
            // Invalidate appointment-related caches
            this.cache.invalidate('appointment-list');
        }

        return response;
    }

    async updateAppointment(appointmentId, updateData) {
        const response = await this.request(`/appointments/${appointmentId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
            useCache: false
        });

        if (response.success) {
            // Invalidate appointment-related caches
            this.cache.invalidate('appointment-list');
            this.cache.invalidate(`appointment-${appointmentId}`);
        }

        return response;
    }

    /**
     * Preload critical data for better performance
     */
    async preloadCriticalData() {
        const preloadPromises = [];

        // Preload user profile
        preloadPromises.push(
            this.cache.preload('user-profile', {}, () => this.getProfile())
        );

        // Preload based on user role
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const role = userData.role;

        switch (role) {
            case 'admin':
                preloadPromises.push(
                    this.cache.preload('analytics-dashboard', {}, () => this.getAnalytics('dashboard')),
                    this.cache.preload('user-list', {}, () => this.request('/users'))
                );
                break;
            case 'doctor':
                preloadPromises.push(
                    this.cache.preload('doctor-appointments', {}, () => this.getAppointments(1, 20, { doctorId: userData.id })),
                    this.cache.preload('doctor-patients', {}, () => this.getPatients(1, 20, { doctorId: userData.id }))
                );
                break;
            case 'nurse':
                preloadPromises.push(
                    this.cache.preload('nurse-patients', {}, () => this.getPatients(1, 20, { assignedNurse: userData.id }))
                );
                break;
            case 'receptionist':
                preloadPromises.push(
                    this.cache.preload('receptionist-appointments', {}, () => this.getAppointments(1, 20, { status: 'scheduled' }))
                );
                break;
            case 'pharmacist':
                preloadPromises.push(
                    this.cache.preload('pharmacist-inventory', {}, () => this.getInventory(1, 20))
                );
                break;
        }

        try {
            await Promise.all(preloadPromises);
            console.log('Critical data preloaded successfully');
        } catch (error) {
            console.warn('Some preload operations failed:', error);
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }

    /**
     * Clear cache manually
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Invalidate specific cache patterns
     */
    invalidateCache(pattern) {
        this.cache.invalidate(pattern);
    }

    /**
     * Enable/disable caching
     */
    setCacheEnabled(enabled) {
        this.cacheEnabled = enabled;
        if (!enabled) {
            this.cache.clear();
        }
    }
}

// Make CachedAPIService available globally
window.CachedAPIService = CachedAPIService;
