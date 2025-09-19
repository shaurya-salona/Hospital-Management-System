/**
 * Main Application Module
 * Core application initialization and management
 */

class HMISApp {
    constructor() {
        this.modules = {};
        this.initialized = false;
        this.currentUser = null;
        this.currentRole = null;
    }

    async init() {
        if (this.initialized) return;

        try {
            // Initialize core modules
            await this.initializeModules();

            // Setup global event listeners
            this.setupGlobalEventListeners();

            // Initialize authentication
            await this.initializeAuth();

            // Setup page-specific functionality
            this.setupPageSpecificFeatures();

            this.initialized = true;
            console.log('HMIS App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize HMIS App:', error);
            this.showError('Failed to initialize application');
        }
    }

    async initializeModules() {
        // Initialize notification system
        this.modules.notifications = new NotificationSystem();

        // Initialize modal system
        this.modules.modal = new ModalSystem();

        // Initialize API service
        this.modules.api = new APIService();

        // Initialize auth service
        this.modules.auth = new AuthService();

        // Initialize dashboard common
        this.modules.dashboard = new DashboardCommon();
    }

    setupGlobalEventListeners() {
        // Handle authentication state changes
        window.addEventListener('auth:login', (event) => {
            this.handleLogin(event.detail);
        });

        window.addEventListener('auth:logout', (event) => {
            this.handleLogout(event.detail);
        });

        // Handle API errors globally
        window.addEventListener('api:error', (event) => {
            this.handleApiError(event.detail);
        });

        // Handle network status
        window.addEventListener('online', () => {
            this.showNotification('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('Connection lost', 'warning');
        });
    }

    async initializeAuth() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');

        if (token && userData) {
            try {
                const user = JSON.parse(userData);
                this.currentUser = user;
                this.currentRole = user.role;

                // Verify token is still valid
                const response = await this.modules.api.getProfile();
                if (response.success) {
                    this.currentUser = response.data;
                    localStorage.setItem('userData', JSON.stringify(response.data));
                } else {
                    this.logout();
                }
            } catch (error) {
                console.error('Auth verification failed:', error);
                this.logout();
            }
        }
    }

    setupPageSpecificFeatures() {
        const currentPage = this.getCurrentPage();

        switch (currentPage) {
            case 'admin-dashboard':
                this.initializeAdminDashboard();
                break;
            case 'doctor-dashboard':
                this.initializeDoctorDashboard();
                break;
            case 'nurse-dashboard':
                this.initializeNurseDashboard();
                break;
            case 'patient-dashboard':
                this.initializePatientDashboard();
                break;
            case 'receptionist-dashboard':
                this.initializeReceptionistDashboard();
                break;
            case 'pharmacist-dashboard':
                this.initializePharmacistDashboard();
                break;
            case 'analytics-dashboard':
                this.initializeAnalyticsDashboard();
                break;
            default:
                this.initializeGenericDashboard();
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename.replace('.html', '');
    }

    initializeAdminDashboard() {
        if (window.AdminDashboard) {
            new AdminDashboard();
        }
    }

    initializeDoctorDashboard() {
        if (window.DoctorDashboard) {
            new DoctorDashboard();
        }
    }

    initializeNurseDashboard() {
        if (window.NurseDashboard) {
            new NurseDashboard();
        }
    }

    initializePatientDashboard() {
        if (window.PatientDashboard) {
            new PatientDashboard();
        }
    }

    initializeReceptionistDashboard() {
        if (window.ReceptionistDashboard) {
            new ReceptionistDashboard();
        }
    }

    initializePharmacistDashboard() {
        if (window.PharmacistDashboard) {
            new PharmacistDashboard();
        }
    }

    initializeAnalyticsDashboard() {
        if (window.AnalyticsDashboard) {
            new AnalyticsDashboard();
        }
    }

    initializeGenericDashboard() {
        // Generic dashboard initialization
        this.setupCommonDashboardFeatures();
    }

    setupCommonDashboardFeatures() {
        // Setup common dashboard features
        this.setupNavigation();
        this.setupUserMenu();
        this.setupNotifications();
        this.setupSearch();
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href && href !== '#') {
                    window.location.href = href;
                }
            });
        });
    }

    setupUserMenu() {
        const userMenu = document.getElementById('user-menu');
        if (userMenu) {
            userMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserMenu();
            });
        }

        // Close user menu when clicking outside
        document.addEventListener('click', () => {
            this.closeUserMenu();
        });
    }

    setupNotifications() {
        const notificationBtn = document.getElementById('notification-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.showNotificationsPanel();
            });
        }
    }

    setupSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            const debouncedSearch = Utils.debounce((query) => {
                this.performSearch(query);
            }, 300);

            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }
    }

    handleLogin(userData) {
        this.currentUser = userData.user;
        this.currentRole = userData.role;
        this.showNotification('Login successful', 'success');

        // Redirect to appropriate dashboard
        const dashboardUrl = this.modules.auth.getDashboardUrl();
        if (dashboardUrl) {
            window.location.href = dashboardUrl;
        }
    }

    handleLogout() {
        this.currentUser = null;
        this.currentRole = null;
        this.showNotification('Logged out successfully', 'info');

        // Redirect to login
        window.location.href = '/index.html';
    }

    handleApiError(error) {
        console.error('API Error:', error);

        if (error.status === 401) {
            this.logout();
        } else if (error.status === 403) {
            this.showNotification('Access denied', 'error');
        } else if (error.status >= 500) {
            this.showNotification('Server error. Please try again.', 'error');
        } else {
            this.showNotification(error.message || 'An error occurred', 'error');
        }
    }

    async logout() {
        try {
            await this.modules.api.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            this.handleLogout();
        }
    }

    showNotification(message, type = 'info', options = {}) {
        if (this.modules.notifications) {
            this.modules.notifications.show(message, type, options);
        } else {
            console.log(`Notification: ${message}`);
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    toggleUserMenu() {
        const userMenu = document.getElementById('user-menu');
        const dropdown = document.getElementById('user-dropdown');

        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    closeUserMenu() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }

    showNotificationsPanel() {
        // Implementation for notifications panel
        this.showNotification('Notifications panel coming soon', 'info');
    }

    performSearch(query) {
        if (!query || query.length < 2) return;

        // Implementation for global search
        console.log('Searching for:', query);
    }

    // Utility methods
    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentRole() {
        return this.currentRole;
    }

    hasPermission(requiredRole) {
        return Utils.hasPermission(this.currentRole, requiredRole);
    }

    isAuthenticated() {
        return !!this.currentUser;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hmisApp = new HMISApp();
    window.hmisApp.init();
});

// Make HMISApp available globally
window.HMISApp = HMISApp;
