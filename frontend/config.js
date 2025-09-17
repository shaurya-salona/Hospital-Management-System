// Configuration file for HMIS Dashboard
const CONFIG = {
    // API Configuration
    API_BASE_URL: 'http://localhost:5000/api',
    
    // WebSocket Configuration
    WS_URL: 'http://localhost:5000',
    
    // Application Settings
    APP_NAME: 'Hospital Management Information System',
    VERSION: '1.0.0',
    
    // Dashboard Settings
    AUTO_REFRESH_INTERVAL: 30000, // 30 seconds
    NOTIFICATION_DURATION: 5000, // 5 seconds
    
    // Chart Colors
    CHART_COLORS: {
        primary: '#667eea',
        secondary: '#764ba2',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
    },
    
    // User Roles
    ROLES: {
        ADMIN: 'admin',
        DOCTOR: 'doctor',
        NURSE: 'nurse',
        RECEPTIONIST: 'receptionist',
        PHARMACIST: 'pharmacist',
        PATIENT: 'patient'
    },
    
    // Status Types
    STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        PENDING: 'pending',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
        SCHEDULED: 'scheduled',
        CONFIRMED: 'confirmed',
        PAID: 'paid',
        OVERDUE: 'overdue'
    },
    
    // Priority Levels
    PRIORITY: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        URGENT: 'urgent',
        CRITICAL: 'critical'
    }
};

// Make CONFIG available globally
window.CONFIG = CONFIG;
