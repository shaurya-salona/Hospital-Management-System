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
        const token = localStorage.getItem('token');
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            this.showNotification('Network error occurred', 'error');
            throw error;
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
