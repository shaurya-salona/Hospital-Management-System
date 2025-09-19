// Authentication Service - Centralized authentication logic
class AuthService {
    constructor() {
        this.API_BASE_URL = 'http://localhost:5000/api';
        this.ROLE_DASHBOARD_MAP = {
            'admin': 'admin-dashboard.html',
            'doctor': 'doctor-dashboard.html',
            'nurse': 'nurse-dashboard.html',
            'receptionist': 'receptionist-dashboard.html',
            'pharmacist': 'pharmacist-dashboard.html',
            'patient': 'patient-dashboard.html'
        };
    }

    // Login user with username and password
    async login(username, password) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                console.log('Login successful, storing auth data:', data.data);
                // Store authentication data
                this.storeAuthData(data.data);
                console.log('Auth data stored, current role:', this.getCurrentRole());
                console.log('Dashboard URL:', this.getDashboardUrl());
                return {
                    success: true,
                    user: data.data.user,
                    role: data.data.role || data.data.user.role,
                    message: data.message
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Login failed'
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Connection error. Please try again.'
            };
        }
    }

    // Store authentication data in localStorage
    storeAuthData(authData) {
        localStorage.setItem('authToken', authData.token);
        localStorage.setItem('token', authData.token); // Added for consistency
        
        // Get role from either authData.role or authData.user.role
        const userRole = authData.role || (authData.user && authData.user.role);
        if (!userRole) {
            console.error('No role found in auth data:', authData);
            throw new Error('User role not found in authentication data');
        }
        
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userData', JSON.stringify(authData.user));
        localStorage.setItem('loginTime', new Date().toISOString());
        
        console.log('Auth data stored successfully:', {
            token: authData.token ? 'Present' : 'Missing',
            role: userRole,
            user: authData.user ? 'Present' : 'Missing'
        });
    }

    // Get current user data
    getCurrentUser() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    }

    // Get current user role
    getCurrentRole() {
        return localStorage.getItem('userRole');
    }

    // Get authentication token
    getToken() {
        return localStorage.getItem('authToken');
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getToken();
        const userRole = this.getCurrentRole();
        return !!(token && userRole);
    }

    // Get dashboard URL for current user role
    getDashboardUrl(role = null) {
        const userRole = role || this.getCurrentRole();
        return this.ROLE_DASHBOARD_MAP[userRole] || 'index.html';
    }

    // Redirect to appropriate dashboard based on role
    redirectToDashboard(role = null) {
        const userRole = role || this.getCurrentRole();
        const dashboardUrl = this.getDashboardUrl(role);
        
        console.log('=== REDIRECTION DEBUG ===');
        console.log('Requested role:', role);
        console.log('Current role:', userRole);
        console.log('Dashboard URL:', dashboardUrl);
        console.log('Current user:', this.getCurrentUser());
        console.log('Role mapping:', this.ROLE_DASHBOARD_MAP);
        console.log('========================');
        
        if (!userRole) {
            console.error('No user role found for redirection');
            this.showNotification('Authentication error: No user role found', 'error');
            return;
        }
        
        if (!dashboardUrl || dashboardUrl === 'index.html') {
            console.error('Invalid dashboard URL for role:', userRole);
            this.showNotification(`No dashboard available for role: ${userRole}`, 'error');
            return;
        }
        
        // Add a small delay to ensure any pending operations complete
        setTimeout(() => {
            console.log('Executing redirection to:', dashboardUrl);
            window.location.href = dashboardUrl;
        }, 100);
    }

    // Logout user
    async logout() {
        try {
            const token = this.getToken();
            if (token) {
                await fetch(`${this.API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear all authentication data
            this.clearAuthData();
            // Redirect to login page
            window.location.href = 'index.html';
        }
    }

    // Clear authentication data
    clearAuthData() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('token'); // Added for consistency
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
        localStorage.removeItem('loginTime');
    }

    // Check if user has specific role
    hasRole(role) {
        return this.getCurrentRole() === role;
    }

    // Check if user has any of the specified roles
    hasAnyRole(roles) {
        const userRole = this.getCurrentRole();
        return roles.includes(userRole);
    }

    // Validate dashboard access
    validateDashboardAccess(expectedRole) {
        const userRole = this.getCurrentRole();
        
        if (!this.isAuthenticated()) {
            return {
                valid: false,
                message: 'Authentication required',
                redirectTo: 'index.html'
            };
        }

        if (expectedRole && userRole !== expectedRole) {
            return {
                valid: false,
                message: `Access denied. This dashboard is for ${expectedRole}s only.`,
                redirectTo: this.getDashboardUrl(userRole)
            };
        }

        return {
            valid: true,
            message: 'Access granted'
        };
    }

    // Demo login for testing
    demoLogin(role) {
        const demoUsers = {
            'admin': { id: 1, first_name: 'System', last_name: 'Administrator', email: 'admin@hospital.com', role: 'admin' },
            'doctor': { id: 2, first_name: 'Dr. John', last_name: 'Smith', email: 'dr.smith@hospital.com', role: 'doctor' },
            'nurse': { id: 3, first_name: 'Sarah', last_name: 'Jones', email: 'nurse.jones@hospital.com', role: 'nurse' },
            'receptionist': { id: 4, first_name: 'Mike', last_name: 'Johnson', email: 'reception.mike@hospital.com', role: 'receptionist' },
            'pharmacist': { id: 5, first_name: 'Emily', last_name: 'Wilson', email: 'pharm.wilson@hospital.com', role: 'pharmacist' },
            'patient': { id: 6, first_name: 'Jane', last_name: 'Doe', email: 'patient@hospital.com', role: 'patient' }
        };

        const user = demoUsers[role];
        if (user) {
            console.log('Demo login for role:', role, 'user:', user);
            this.storeAuthData({
                token: 'demo-token',
                user: user,
                role: role
            });
            console.log('Demo auth data stored, current role:', this.getCurrentRole());
            console.log('Demo dashboard URL:', this.getDashboardUrl());
            return {
                success: true,
                user: user,
                role: role,
                message: 'Demo login successful'
            };
        }

        return {
            success: false,
            message: 'Invalid demo role'
        };
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Create global instance
window.authService = new AuthService();
