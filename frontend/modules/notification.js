/**
 * Notification System Module
 * Handles toast notifications and alerts
 */

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.init();
    }

    init() {
        this.createContainer();
        this.setupStyles();
    }

    createContainer() {
        if (document.getElementById('notification-container')) return;

        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            pointer-events: none;
            max-width: 400px;
        `;
        document.body.appendChild(this.container);
    }

    setupStyles() {
        if (document.getElementById('notification-styles')) return;

        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                margin-bottom: 10px;
                padding: 16px;
                pointer-events: auto;
                position: relative;
                transform: translateX(100%);
                transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
                opacity: 0;
                border-left: 4px solid #3b82f6;
                max-width: 100%;
                word-wrap: break-word;
            }

            .notification.show {
                transform: translateX(0);
                opacity: 1;
            }

            .notification.success {
                border-left-color: #10b981;
            }

            .notification.warning {
                border-left-color: #f59e0b;
            }

            .notification.error {
                border-left-color: #ef4444;
            }

            .notification.info {
                border-left-color: #3b82f6;
            }

            .notification-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .notification-title {
                font-weight: 600;
                color: #1f2937;
                margin: 0;
                font-size: 14px;
            }

            .notification-close {
                background: none;
                border: none;
                color: #6b7280;
                cursor: pointer;
                font-size: 18px;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .notification-message {
                color: #6b7280;
                margin: 0;
                font-size: 13px;
                line-height: 1.4;
            }

            .notification-icon {
                margin-right: 8px;
                font-size: 16px;
            }

            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 0 0 8px 8px;
                transition: width linear;
            }
        `;
        document.head.appendChild(style);
    }

    show(message, type = 'info', options = {}) {
        const notification = this.createNotification(message, type, options);
        this.container.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto remove
        const duration = options.duration || this.getDefaultDuration(type);
        if (duration > 0) {
            this.autoRemove(notification, duration);
        }

        return notification;
    }

    createNotification(message, type, options) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const icons = {
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'info': 'ℹ️'
        };

        const titles = {
            'success': 'Success',
            'warning': 'Warning',
            'error': 'Error',
            'info': 'Information'
        };

        const title = options.title || titles[type] || 'Notification';
        const icon = options.icon || icons[type] || icons.info;

        notification.innerHTML = `
            <div class="notification-header">
                <div style="display: flex; align-items: center;">
                    <span class="notification-icon">${icon}</span>
                    <h4 class="notification-title">${title}</h4>
                </div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
            <p class="notification-message">${message}</p>
            <div class="notification-progress"></div>
        `;

        // Add click handler for close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.remove(notification);
        });

        return notification;
    }

    autoRemove(notification, duration) {
        const progressBar = notification.querySelector('.notification-progress');
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.style.transition = `width ${duration}ms linear`;
        }

        setTimeout(() => {
            this.remove(notification);
        }, duration);
    }

    remove(notification) {
        if (!notification || !notification.parentNode) return;

        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    getDefaultDuration(type) {
        const durations = {
            'success': 3000,
            'info': 4000,
            'warning': 5000,
            'error': 6000
        };
        return durations[type] || 4000;
    }

    // Convenience methods
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    // Clear all notifications
    clear() {
        const notifications = this.container.querySelectorAll('.notification');
        notifications.forEach(notification => {
            this.remove(notification);
        });
    }

    // Show loading notification
    showLoading(message = 'Loading...', options = {}) {
        const loadingNotification = this.show(message, 'info', {
            ...options,
            duration: 0, // Don't auto-remove
            icon: '⏳'
        });

        // Add spinner
        const icon = loadingNotification.querySelector('.notification-icon');
        if (icon) {
            icon.innerHTML = `
                <div style="
                    border: 2px solid #f3f4f6;
                    border-top: 2px solid #3b82f6;
                    border-radius: 50%;
                    width: 16px;
                    height: 16px;
                    animation: spin 1s linear infinite;
                "></div>
            `;
        }

        return loadingNotification;
    }

    // Update loading notification
    updateLoading(notification, message) {
        if (!notification) return;

        const messageEl = notification.querySelector('.notification-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
    }

    // Hide loading notification
    hideLoading(notification) {
        if (notification) {
            this.remove(notification);
        }
    }
}

// Make NotificationSystem available globally
window.NotificationSystem = NotificationSystem;
