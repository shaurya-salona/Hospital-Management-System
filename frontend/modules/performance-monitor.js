/**
 * Performance Monitoring System
 * Tracks and reports performance metrics for HMIS application
 */

class PerformanceMonitor {
    constructor(options = {}) {
        this.enabled = options.enabled !== false;
        this.sampleRate = options.sampleRate || 1.0; // 100% sampling by default
        this.metrics = {
            pageLoad: [],
            apiCalls: [],
            userInteractions: [],
            errors: [],
            memory: [],
            network: []
        };
        this.thresholds = {
            pageLoad: 3000, // 3 seconds
            apiCall: 2000, // 2 seconds
            userInteraction: 100 // 100ms
        };
        this.observers = [];
        this.reportingEndpoint = options.reportingEndpoint || '/api/metrics';
        this.reportingInterval = options.reportingInterval || 30000; // 30 seconds
        this.maxMetrics = options.maxMetrics || 1000;

        this.init();
    }

    init() {
        if (!this.enabled) return;

        // Setup performance observers
        this.setupPerformanceObservers();

        // Setup error tracking
        this.setupErrorTracking();

        // Setup memory monitoring
        this.setupMemoryMonitoring();

        // Setup network monitoring
        this.setupNetworkMonitoring();

        // Setup user interaction tracking
        this.setupUserInteractionTracking();

        // Setup periodic reporting
        this.setupPeriodicReporting();

        // Track page load
        this.trackPageLoad();
    }

    /**
     * Setup Performance API observers
     */
    setupPerformanceObservers() {
        if (!window.PerformanceObserver) return;

        // Navigation timing
        const navObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'navigation') {
                    this.trackNavigationTiming(entry);
                }
            }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);

        // Resource timing
        const resourceObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'resource') {
                    this.trackResourceTiming(entry);
                }
            }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);

        // Long task detection
        if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.trackLongTask(entry);
                }
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });
            this.observers.push(longTaskObserver);
        }

        // Layout shift detection
        if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
            const layoutShiftObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.trackLayoutShift(entry);
                }
            });
            layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
            this.observers.push(layoutShiftObserver);
        }
    }

    /**
     * Setup error tracking
     */
    setupErrorTracking() {
        // JavaScript errors
        window.addEventListener('error', (event) => {
            this.trackError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: Date.now()
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                stack: event.reason?.stack,
                timestamp: Date.now()
            });
        });

        // Resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.trackError({
                    type: 'resource',
                    message: `Failed to load ${event.target.tagName}`,
                    src: event.target.src || event.target.href,
                    timestamp: Date.now()
                });
            }
        }, true);
    }

    /**
     * Setup memory monitoring
     */
    setupMemoryMonitoring() {
        if (!performance.memory) return;

        const trackMemory = () => {
            this.trackMemoryUsage({
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                timestamp: Date.now()
            });
        };

        // Track memory every 30 seconds
        setInterval(trackMemory, 30000);
        trackMemory(); // Initial measurement
    }

    /**
     * Setup network monitoring
     */
    setupNetworkMonitoring() {
        // Monitor fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0];

            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();

                this.trackApiCall({
                    url: url.toString(),
                    method: 'GET', // Default, could be enhanced
                    duration: endTime - startTime,
                    status: response.status,
                    success: response.ok,
                    timestamp: Date.now()
                });

                return response;
            } catch (error) {
                const endTime = performance.now();

                this.trackApiCall({
                    url: url.toString(),
                    method: 'GET',
                    duration: endTime - startTime,
                    status: 0,
                    success: false,
                    error: error.message,
                    timestamp: Date.now()
                });

                throw error;
            }
        };
    }

    /**
     * Setup user interaction tracking
     */
    setupUserInteractionTracking() {
        const interactionTypes = ['click', 'keydown', 'scroll', 'resize'];

        interactionTypes.forEach(type => {
            document.addEventListener(type, (event) => {
                if (Math.random() < this.sampleRate) {
                    this.trackUserInteraction({
                        type,
                        target: event.target.tagName,
                        timestamp: Date.now(),
                        x: event.clientX,
                        y: event.clientY
                    });
                }
            }, { passive: true });
        });
    }

    /**
     * Setup periodic reporting
     */
    setupPeriodicReporting() {
        setInterval(() => {
            this.reportMetrics();
        }, this.reportingInterval);
    }

    /**
     * Track page load performance
     */
    trackPageLoad() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    this.trackNavigationTiming(navigation);
                }
            }, 0);
        });
    }

    /**
     * Track navigation timing
     */
    trackNavigationTiming(entry) {
        const metrics = {
            page: window.location.pathname,
            loadTime: entry.loadEventEnd - entry.loadEventStart,
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            firstByte: entry.responseStart - entry.requestStart,
            dns: entry.domainLookupEnd - entry.domainLookupStart,
            tcp: entry.connectEnd - entry.connectStart,
            ssl: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
            timestamp: Date.now()
        };

        this.addMetric('pageLoad', metrics);
        this.checkThreshold('pageLoad', metrics.loadTime);
    }

    /**
     * Track resource timing
     */
    trackResourceTiming(entry) {
        const metrics = {
            name: entry.name,
            type: this.getResourceType(entry.name),
            duration: entry.duration,
            size: entry.transferSize,
            timestamp: Date.now()
        };

        this.addMetric('network', metrics);
    }

    /**
     * Track long tasks
     */
    trackLongTask(entry) {
        const metrics = {
            duration: entry.duration,
            startTime: entry.startTime,
            timestamp: Date.now()
        };

        this.addMetric('userInteractions', {
            type: 'longtask',
            duration: entry.duration,
            timestamp: Date.now()
        });
    }

    /**
     * Track layout shift
     */
    trackLayoutShift(entry) {
        if (entry.hadRecentInput) return; // Ignore user-initiated shifts

        this.addMetric('userInteractions', {
            type: 'layoutshift',
            value: entry.value,
            timestamp: Date.now()
        });
    }

    /**
     * Track API call
     */
    trackApiCall(metrics) {
        this.addMetric('apiCalls', metrics);
        this.checkThreshold('apiCall', metrics.duration);
    }

    /**
     * Track user interaction
     */
    trackUserInteraction(metrics) {
        this.addMetric('userInteractions', metrics);
        this.checkThreshold('userInteraction', 0); // Placeholder
    }

    /**
     * Track error
     */
    trackError(metrics) {
        this.addMetric('errors', metrics);
    }

    /**
     * Track memory usage
     */
    trackMemoryUsage(metrics) {
        this.addMetric('memory', metrics);
    }

    /**
     * Add metric to collection
     */
    addMetric(type, metric) {
        if (!this.enabled) return;

        this.metrics[type].push(metric);

        // Limit metrics to prevent memory issues
        if (this.metrics[type].length > this.maxMetrics) {
            this.metrics[type].shift();
        }
    }

    /**
     * Check performance thresholds
     */
    checkThreshold(type, value) {
        const threshold = this.thresholds[type];
        if (value > threshold) {
            console.warn(`Performance threshold exceeded for ${type}: ${value}ms > ${threshold}ms`);

            // Could trigger alerts or notifications here
            this.trackError({
                type: 'performance',
                message: `${type} threshold exceeded`,
                value,
                threshold,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Get resource type from URL
     */
    getResourceType(url) {
        if (url.includes('.js')) return 'script';
        if (url.includes('.css')) return 'stylesheet';
        if (url.includes('.png') || url.includes('.jpg') || url.includes('.gif')) return 'image';
        if (url.includes('.woff') || url.includes('.ttf')) return 'font';
        return 'other';
    }

    /**
     * Report metrics to server
     */
    async reportMetrics() {
        if (!this.enabled || !this.hasMetrics()) return;

        try {
            const payload = {
                sessionId: this.getSessionId(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: Date.now(),
                metrics: this.getMetricsSummary()
            };

            await fetch(this.reportingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            // Clear reported metrics
            this.clearMetrics();
        } catch (error) {
            console.warn('Failed to report metrics:', error);
        }
    }

    /**
     * Check if there are metrics to report
     */
    hasMetrics() {
        return Object.values(this.metrics).some(metricArray => metricArray.length > 0);
    }

    /**
     * Get metrics summary
     */
    getMetricsSummary() {
        const summary = {};

        for (const [type, metrics] of Object.entries(this.metrics)) {
            if (metrics.length === 0) continue;

            summary[type] = {
                count: metrics.length,
                latest: metrics[metrics.length - 1],
                average: this.calculateAverage(metrics, 'duration'),
                max: this.calculateMax(metrics, 'duration'),
                min: this.calculateMin(metrics, 'duration')
            };

            // Add specific calculations for different metric types
            if (type === 'pageLoad') {
                summary[type].averageLoadTime = this.calculateAverage(metrics, 'loadTime');
            } else if (type === 'apiCalls') {
                summary[type].successRate = this.calculateSuccessRate(metrics);
            } else if (type === 'errors') {
                summary[type].errorTypes = this.groupBy(metrics, 'type');
            }
        }

        return summary;
    }

    /**
     * Calculate average value
     */
    calculateAverage(metrics, field) {
        const values = metrics.map(m => m[field]).filter(v => typeof v === 'number');
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    }

    /**
     * Calculate maximum value
     */
    calculateMax(metrics, field) {
        const values = metrics.map(m => m[field]).filter(v => typeof v === 'number');
        return values.length > 0 ? Math.max(...values) : 0;
    }

    /**
     * Calculate minimum value
     */
    calculateMin(metrics, field) {
        const values = metrics.map(m => m[field]).filter(v => typeof v === 'number');
        return values.length > 0 ? Math.min(...values) : 0;
    }

    /**
     * Calculate success rate
     */
    calculateSuccessRate(metrics) {
        const total = metrics.length;
        const successful = metrics.filter(m => m.success).length;
        return total > 0 ? (successful / total * 100).toFixed(2) : 0;
    }

    /**
     * Group metrics by field
     */
    groupBy(metrics, field) {
        return metrics.reduce((groups, metric) => {
            const key = metric[field];
            groups[key] = (groups[key] || 0) + 1;
            return groups;
        }, {});
    }

    /**
     * Clear metrics
     */
    clearMetrics() {
        for (const type of Object.keys(this.metrics)) {
            this.metrics[type] = [];
        }
    }

    /**
     * Get session ID
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('hmis-session-id');
        if (!sessionId) {
            sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('hmis-session-id', sessionId);
        }
        return sessionId;
    }

    /**
     * Get current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        const summary = {
            pageLoad: this.getPageLoadSummary(),
            apiCalls: this.getApiCallsSummary(),
            errors: this.getErrorsSummary(),
            memory: this.getMemorySummary()
        };

        return summary;
    }

    /**
     * Get page load summary
     */
    getPageLoadSummary() {
        const pageLoads = this.metrics.pageLoad;
        if (pageLoads.length === 0) return null;

        return {
            count: pageLoads.length,
            averageLoadTime: this.calculateAverage(pageLoads, 'loadTime'),
            slowestLoad: this.calculateMax(pageLoads, 'loadTime'),
            fastestLoad: this.calculateMin(pageLoads, 'loadTime')
        };
    }

    /**
     * Get API calls summary
     */
    getApiCallsSummary() {
        const apiCalls = this.metrics.apiCalls;
        if (apiCalls.length === 0) return null;

        return {
            count: apiCalls.length,
            averageDuration: this.calculateAverage(apiCalls, 'duration'),
            slowestCall: this.calculateMax(apiCalls, 'duration'),
            successRate: this.calculateSuccessRate(apiCalls)
        };
    }

    /**
     * Get errors summary
     */
    getErrorsSummary() {
        const errors = this.metrics.errors;
        if (errors.length === 0) return null;

        return {
            count: errors.length,
            types: this.groupBy(errors, 'type'),
            recent: errors.slice(-5) // Last 5 errors
        };
    }

    /**
     * Get memory summary
     */
    getMemorySummary() {
        const memory = this.metrics.memory;
        if (memory.length === 0) return null;

        const latest = memory[memory.length - 1];
        return {
            current: latest,
            average: this.calculateAverage(memory, 'used'),
            peak: this.calculateMax(memory, 'used')
        };
    }

    /**
     * Enable/disable monitoring
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.clearMetrics();
        }
    }

    /**
     * Cleanup observers
     */
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
    }
}

// Make PerformanceMonitor available globally
window.PerformanceMonitor = PerformanceMonitor;
