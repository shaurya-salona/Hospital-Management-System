// Common Dashboard Functions - Shared across all dashboards

class DashboardCommon {
    constructor() {
        this.notifications = [];
        this.init();
    }

    init() {
        this.setupCommonEventListeners();
        this.initializeNotifications();
    }

    setupCommonEventListeners() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    initializeNotifications() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10001;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
    }

    // Modal Functions
    showModal(title, content, size = 'medium') {
        const modalOverlay = document.getElementById('modal-overlay');
        if (!modalOverlay) {
            this.createModalOverlay();
        }

        const modal = document.getElementById('modal-overlay');
        modal.innerHTML = `
            <div class="modal ${size}">
                <div class="modal-header">
                    <h3><i class="fas fa-${this.getModalIcon(title)}"></i> ${title}</h3>
                    <button class="modal-close" onclick="dashboardCommon.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    createModalOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
    }

    closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    getModalIcon(title) {
        const icons = {
            'Add User': 'user-plus',
            'Edit User': 'user-edit',
            'Add Patient': 'user-injured',
            'Edit Patient': 'user-edit',
            'Schedule Appointment': 'calendar-plus',
            'Edit Appointment': 'calendar-edit',
            'Create Bill': 'money-bill-wave',
            'Edit Bill': 'money-bill-wave',
            'Add Inventory': 'plus-circle',
            'Edit Inventory': 'edit',
            'View Details': 'eye',
            'Delete': 'trash',
            'Confirm': 'check-circle',
            'Warning': 'exclamation-triangle',
            'Error': 'times-circle'
        };
        return icons[title] || 'info-circle';
    }

    // Notification Functions
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-header">
                <div class="notification-title">
                    <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                    ${this.getNotificationTitle(type)}
                </div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="notification-message">${message}</div>
        `;

        const container = document.getElementById('notification-container');
        container.appendChild(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto remove
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'times-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'bell';
    }

    getNotificationTitle(type) {
        const titles = {
            'success': 'Success',
            'error': 'Error',
            'warning': 'Warning',
            'info': 'Information'
        };
        return titles[type] || 'Notification';
    }

    // Utility Functions
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateTime(date) {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // API Helper Functions
    async apiRequest(endpoint, options = {}) {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        try {
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}${endpoint}`, {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Handle unauthorized access
                    this.showNotification('Session expired. Please login again.', 'error');
                    setTimeout(() => {
                        window.location.href = '/index.html';
                    }, 2000);
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            this.showNotification('Connection failed. Using demo data.', 'warning');
            // Return mock data for demo purposes
            return this.getMockData(endpoint);
        }
    }

    // Form Validation
    validateForm(formElement) {
        const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('error');
                isValid = false;
            } else {
                input.classList.remove('error');
            }
        });

        return isValid;
    }

    // Loading States
    showLoading(element) {
        if (element) {
            element.innerHTML = '<div class="loading-spinner"></div>';
        }
    }

    hideLoading(element, originalContent) {
        if (element && originalContent) {
            element.innerHTML = originalContent;
        }
    }

    // Mock Data for Demo
    getMockData(endpoint) {
        const mockData = {
            '/api/users': {
                users: [
                    { id: 1, name: 'Dr. John Smith', email: 'john.smith@hospital.com', role: 'doctor', status: 'active' },
                    { id: 2, name: 'Sarah Johnson', email: 'sarah.johnson@hospital.com', role: 'receptionist', status: 'active' },
                    { id: 3, name: 'Emily Rodriguez', email: 'emily.rodriguez@hospital.com', role: 'nurse', status: 'active' },
                    { id: 4, name: 'Dr. Michael Chen', email: 'michael.chen@hospital.com', role: 'pharmacist', status: 'active' }
                ]
            },
            '/api/patients': {
                patients: [
                    { id: 1, name: 'John Doe', age: 45, phone: '+91-9876543210', email: 'john.doe@email.com', status: 'active' },
                    { id: 2, name: 'Jane Smith', age: 32, phone: '+91-9876543211', email: 'jane.smith@email.com', status: 'active' },
                    { id: 3, name: 'Bob Johnson', age: 28, phone: '+91-9876543212', email: 'bob.johnson@email.com', status: 'active' }
                ]
            },
            '/api/appointments': {
                appointments: [
                    { id: 1, patient: 'John Doe', doctor: 'Dr. Smith', date: '2025-01-15', time: '10:00', status: 'scheduled' },
                    { id: 2, patient: 'Jane Smith', doctor: 'Dr. Brown', date: '2025-01-15', time: '11:00', status: 'confirmed' },
                    { id: 3, patient: 'Bob Johnson', doctor: 'Dr. Smith', date: '2025-01-16', time: '09:00', status: 'pending' }
                ]
            },
            '/api/analytics/dashboard': {
                totalPatients: 156,
                totalDoctors: 12,
                totalAppointments: 45,
                totalRevenue: 2850000,
                criticalPatients: 2,
                bedOccupancy: 78,
                pendingApprovals: 4,
                totalNurses: 24
            }
        };

        return mockData[endpoint] || { message: 'No data available' };
    }

    // Data Export
    exportToCSV(data, filename) {
        if (!data || data.length === 0) {
            this.showNotification('No data to export', 'warning');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.showNotification('Data exported successfully', 'success');
    }

    // Search and Filter
    filterTable(tableId, searchTerm, columnIndex = -1) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr');
        const term = searchTerm.toLowerCase();

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            let shouldShow = false;

            if (columnIndex >= 0 && cells[columnIndex]) {
                shouldShow = cells[columnIndex].textContent.toLowerCase().includes(term);
            } else {
                shouldShow = Array.from(cells).some(cell => 
                    cell.textContent.toLowerCase().includes(term)
                );
            }

            row.style.display = shouldShow ? '' : 'none';
        });
    }

    // Confirmation Dialog
    showConfirmation(message, callback) {
        const confirmed = confirm(message);
        if (confirmed && callback) {
            callback();
        }
        return confirmed;
    }

    // Error Handling
    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        this.showNotification(
            `An error occurred${context ? ` in ${context}` : ''}. Please try again.`,
            'error'
        );
    }
}

// Initialize global dashboard common instance
window.dashboardCommon = new DashboardCommon();
