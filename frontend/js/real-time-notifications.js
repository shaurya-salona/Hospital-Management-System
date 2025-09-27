/**
 * Real-Time Notifications System for HMIS
 * Handles WebSocket connections, live notifications, and emergency alerts
 */

class RealTimeNotifications {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 5000;
        this.notifications = [];
        this.emergencyAlerts = [];
        this.connectedUsers = [];

        this.init();
    }

    init() {
        this.createNotificationContainer();
        this.setupEventListeners();
        this.connectToServer();
        this.setupPeriodicTasks();
    }

    createNotificationContainer() {
        // Check if notification container already exists
        if (document.getElementById('notification-container')) return;

        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        container.innerHTML = `
            <div class="notification-header">
                <h3><i class="fas fa-bell"></i> Notifications</h3>
                <div class="notification-controls">
                    <button id="mark-all-read" class="notification-btn" title="Mark all as read">
                        <i class="fas fa-check-double"></i>
                    </button>
                    <button id="clear-notifications" class="notification-btn" title="Clear all">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button id="notification-settings" class="notification-btn" title="Settings">
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
            </div>
            <div id="notification-list" class="notification-list"></div>
            <div class="notification-footer">
                <span id="notification-count">0 notifications</span>
                <button id="load-more-notifications" class="load-more-btn">Load More</button>
            </div>
        `;

        document.body.appendChild(container);
    }

    setupEventListeners() {
        // Mark all as read
        document.getElementById('mark-all-read')?.addEventListener('click', () => {
            this.markAllAsRead();
        });

        // Clear notifications
        document.getElementById('clear-notifications')?.addEventListener('click', () => {
            this.clearAllNotifications();
        });

        // Notification settings
        document.getElementById('notification-settings')?.addEventListener('click', () => {
            this.showNotificationSettings();
        });

        // Load more notifications
        document.getElementById('load-more-notifications')?.addEventListener('click', () => {
            this.loadMoreNotifications();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.toggleNotificationContainer();
            }
        });

        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseNotifications();
            } else {
                this.resumeNotifications();
            }
        });
    }

    connectToServer() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('No authentication token found');
                return;
            }

            // Connect to WebSocket server
            this.socket = io(window.CONFIG?.WS_URL || 'http://localhost:5000', {
                auth: { token },
                transports: ['websocket', 'polling'],
                timeout: 10000,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectInterval
            });

            this.setupSocketEventListeners();

        } catch (error) {
            console.error('Failed to connect to WebSocket server:', error);
            this.handleConnectionError();
        }
    }

    setupSocketEventListeners() {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.showConnectionStatus('connected');
            console.log('Connected to WebSocket server');
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            this.showConnectionStatus('disconnected');
            console.log('Disconnected from WebSocket server:', reason);
        });

        this.socket.on('connect_error', (error) => {
            this.handleConnectionError();
            console.error('WebSocket connection error:', error);
        });

        // Authentication events
        this.socket.on('authenticated', (data) => {
            console.log('WebSocket authenticated:', data);
            this.connectedUsers = data.connectedUsers || [];
            this.updateConnectedUsersDisplay();
        });

        this.socket.on('auth_error', (error) => {
            console.error('WebSocket authentication error:', error);
            this.showNotification('Authentication failed', 'error');
        });

        // Notification events
        this.socket.on('notification', (notification) => {
            this.handleNewNotification(notification);
        });

        this.socket.on('emergency_alert', (alert) => {
            this.handleEmergencyAlert(alert);
        });

        this.socket.on('system_alert', (alert) => {
            this.handleSystemAlert(alert);
        });

        // Live update events
        this.socket.on('live_update', (update) => {
            this.handleLiveUpdate(update);
        });

        this.socket.on('patient_status_update', (update) => {
            this.handlePatientStatusUpdate(update);
        });

        this.socket.on('appointment_update', (update) => {
            this.handleAppointmentUpdate(update);
        });

        this.socket.on('inventory_update', (update) => {
            this.handleInventoryUpdate(update);
        });

        // Chat events
        this.socket.on('chat_message', (message) => {
            this.handleChatMessage(message);
        });

        this.socket.on('user_typing', (data) => {
            this.handleUserTyping(data);
        });

        this.socket.on('user_stopped_typing', (data) => {
            this.handleUserStoppedTyping(data);
        });

        // User events
        this.socket.on('user_connected', (user) => {
            this.handleUserConnected(user);
        });

        this.socket.on('user_disconnected', (user) => {
            this.handleUserDisconnected(user);
        });

        // Heartbeat
        this.socket.on('heartbeat', (data) => {
            this.handleHeartbeat(data);
        });

        // Error handling
        this.socket.on('error', (error) => {
            console.error('WebSocket error:', error);
            this.showNotification('Connection error occurred', 'error');
        });
    }

    handleNewNotification(notification) {
        // Add to notifications array
        this.notifications.unshift(notification);

        // Limit notifications to 100
        if (this.notifications.length > 100) {
            this.notifications = this.notifications.slice(0, 100);
        }

        // Update display
        this.updateNotificationDisplay();

        // Show browser notification if permission granted
        this.showBrowserNotification(notification);

        // Play notification sound
        this.playNotificationSound(notification.type);

        // Update notification count
        this.updateNotificationCount();

        // Auto-remove after 10 seconds for info notifications
        if (notification.type === 'info') {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, 10000);
        }
    }

    handleEmergencyAlert(alert) {
        // Add to emergency alerts
        this.emergencyAlerts.unshift(alert);

        // Show emergency notification
        this.showEmergencyNotification(alert);

        // Play emergency sound
        this.playEmergencySound();

        // Flash screen for critical emergencies
        if (alert.emergencyType === 'critical') {
            this.flashScreen();
        }

        // Auto-acknowledge after 30 seconds if not acknowledged
        setTimeout(() => {
            if (!alert.acknowledgedBy.includes(this.getCurrentUserId())) {
                this.acknowledgeEmergency(alert.id);
            }
        }, 30000);
    }

    handleSystemAlert(alert) {
        // Show system alert notification
        this.showSystemAlert(alert);

        // Log system alert
        console.warn('System Alert:', alert);

        // Auto-resolve info alerts after 1 hour
        if (alert.severity === 'info') {
            setTimeout(() => {
                this.resolveSystemAlert(alert.id);
            }, 60 * 60 * 1000);
        }
    }

    handleLiveUpdate(update) {
        // Update live data displays
        this.updateLiveData(update.type, update.data);

        // Show update notification
        this.showNotification(`Live update: ${update.type}`, 'info');
    }

    handlePatientStatusUpdate(update) {
        // Update patient status displays
        this.updatePatientStatus(update);

        // Show status update notification
        this.showNotification(`Patient status updated: ${update.status}`, 'info');
    }

    handleAppointmentUpdate(update) {
        // Update appointment displays
        this.updateAppointmentDisplay(update);

        // Show appointment update notification
        this.showNotification(`Appointment updated: ${update.status}`, 'info');
    }

    handleInventoryUpdate(update) {
        // Update inventory displays
        this.updateInventoryDisplay(update);

        // Show inventory update notification
        this.showNotification(`Inventory updated: ${update.action}`, 'info');
    }

    handleChatMessage(message) {
        // Update chat displays
        this.updateChatDisplay(message);

        // Show chat notification
        this.showNotification(`New message from ${message.from.name}`, 'info');
    }

    handleUserTyping(data) {
        // Show typing indicator
        this.showTypingIndicator(data);
    }

    handleUserStoppedTyping(data) {
        // Hide typing indicator
        this.hideTypingIndicator(data);
    }

    handleUserConnected(user) {
        // Add to connected users
        this.connectedUsers.push(user);
        this.updateConnectedUsersDisplay();

        // Show user connected notification
        this.showNotification(`${user.name} connected`, 'info');
    }

    handleUserDisconnected(user) {
        // Remove from connected users
        this.connectedUsers = this.connectedUsers.filter(u => u.userId !== user.userId);
        this.updateConnectedUsersDisplay();

        // Show user disconnected notification
        this.showNotification(`${user.name} disconnected`, 'info');
    }

    handleHeartbeat(data) {
        // Update connection status
        this.updateConnectionStatus('connected');
    }

    handleConnectionError() {
        this.isConnected = false;
        this.reconnectAttempts++;

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
                this.connectToServer();
            }, this.reconnectInterval);
        } else {
            this.showConnectionStatus('failed');
            this.showNotification('Connection failed. Please refresh the page.', 'error');
        }
    }

    // Notification display methods
    updateNotificationDisplay() {
        const notificationList = document.getElementById('notification-list');
        if (!notificationList) return;

        notificationList.innerHTML = this.notifications.map(notification =>
            this.createNotificationElement(notification)
        ).join('');
    }

    createNotificationElement(notification) {
        const timeAgo = this.getTimeAgo(notification.timestamp);
        const priorityClass = notification.priority || 'normal';
        const typeClass = notification.type || 'info';

        return `
            <div class="notification-item ${priorityClass} ${typeClass}" data-id="${notification.id}">
                <div class="notification-icon">
                    <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-header">
                        <span class="notification-from">${notification.from?.name || 'System'}</span>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-actions">
                        <button class="notification-action-btn" onclick="window.realTimeNotifications.markAsRead('${notification.id}')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="notification-action-btn" onclick="window.realTimeNotifications.removeNotification('${notification.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getNotificationIcon(type) {
        const icons = {
            'info': 'info-circle',
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'error': 'times-circle',
            'emergency': 'exclamation-circle',
            'system': 'cog',
            'chat': 'comments',
            'appointment': 'calendar',
            'patient': 'user',
            'inventory': 'box'
        };
        return icons[type] || 'bell';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return `${seconds}s ago`;
    }

    // Browser notification methods
    async showBrowserNotification(notification) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.from?.name || 'HMIS', {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id,
                requireInteraction: notification.priority === 'high'
            });

            browserNotification.onclick = () => {
                window.focus();
                browserNotification.close();
            };
        }
    }

    async requestNotificationPermission() {
        if (!('Notification' in window)) return false;

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return Notification.permission === 'granted';
    }

    // Sound methods
    playNotificationSound(type) {
        const audio = new Audio();
        audio.src = this.getNotificationSound(type);
        audio.volume = 0.3;
        audio.play().catch(() => {
            // Ignore audio play errors
        });
    }

    playEmergencySound() {
        const audio = new Audio();
        audio.src = '/sounds/emergency.mp3';
        audio.volume = 0.5;
        audio.loop = true;
        audio.play().catch(() => {
            // Fallback to beep sound
            this.playBeepSound();
        });

        // Stop after 10 seconds
        setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
        }, 10000);
    }

    playBeepSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    getNotificationSound(type) {
        const sounds = {
            'info': '/sounds/notification.mp3',
            'success': '/sounds/success.mp3',
            'warning': '/sounds/warning.mp3',
            'error': '/sounds/error.mp3',
            'emergency': '/sounds/emergency.mp3'
        };
        return sounds[type] || '/sounds/notification.mp3';
    }

    // Visual effects
    flashScreen() {
        const flash = document.createElement('div');
        flash.className = 'emergency-flash';
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 0, 0, 0.3);
            z-index: 10000;
            pointer-events: none;
            animation: emergencyFlash 0.5s ease-in-out;
        `;

        document.body.appendChild(flash);

        setTimeout(() => {
            flash.remove();
        }, 500);
    }

    // Utility methods
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.updateNotificationDisplay();
            this.updateNotificationCount();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.updateNotificationDisplay();
        this.updateNotificationCount();
    }

    removeNotification(notificationId) {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.updateNotificationDisplay();
        this.updateNotificationCount();
    }

    clearAllNotifications() {
        this.notifications = [];
        this.updateNotificationDisplay();
        this.updateNotificationCount();
    }

    updateNotificationCount() {
        const countElement = document.getElementById('notification-count');
        if (countElement) {
            const unreadCount = this.notifications.filter(n => !n.read).length;
            countElement.textContent = `${unreadCount} notifications`;
        }
    }

    updateConnectedUsersDisplay() {
        // Update connected users display if exists
        const usersDisplay = document.getElementById('connected-users');
        if (usersDisplay) {
            usersDisplay.innerHTML = this.connectedUsers.map(user =>
                `<span class="connected-user">${user.name}</span>`
            ).join(', ');
        }
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.className = `connection-status ${status}`;
            statusElement.textContent = status;
        }
    }

    showConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status') || this.createConnectionStatusElement();
        statusElement.className = `connection-status ${status}`;
        statusElement.textContent = status;
    }

    createConnectionStatusElement() {
        const element = document.createElement('div');
        element.id = 'connection-status';
        element.className = 'connection-status';
        element.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            z-index: 1000;
        `;
        document.body.appendChild(element);
        return element;
    }

    // Public methods
    sendNotification(targetUsers, targetRoles, message, type, priority) {
        if (this.socket && this.isConnected) {
            this.socket.emit('send_notification', {
                targetUsers,
                targetRoles,
                message,
                type,
                priority
            });
        }
    }

    sendEmergencyAlert(patientId, patientName, emergencyType, location, description) {
        if (this.socket && this.isConnected) {
            this.socket.emit('emergency_alert', {
                patientId,
                patientName,
                emergencyType,
                location,
                description
            });
        }
    }

    joinRoom(room) {
        if (this.socket && this.isConnected) {
            this.socket.emit('join_room', room);
        }
    }

    leaveRoom(room) {
        if (this.socket && this.isConnected) {
            this.socket.emit('leave_room', room);
        }
    }

    requestLiveUpdate(updateType, filters) {
        if (this.socket && this.isConnected) {
            this.socket.emit('request_live_update', {
                updateType,
                filters
            });
        }
    }

    getCurrentUserId() {
        // Get current user ID from token or user data
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.userId;
            } catch (error) {
                console.error('Error parsing token:', error);
            }
        }
        return null;
    }

    // Setup periodic tasks
    setupPeriodicTasks() {
        // Request notification permission on load
        this.requestNotificationPermission();

        // Update notification display every 30 seconds
        setInterval(() => {
            this.updateNotificationDisplay();
        }, 30000);

        // Check connection status every 10 seconds
        setInterval(() => {
            if (!this.isConnected) {
                this.connectToServer();
            }
        }, 10000);
    }

    // Pause/resume notifications
    pauseNotifications() {
        // Pause notification sounds and animations
        this.isPaused = true;
    }

    resumeNotifications() {
        // Resume notification sounds and animations
        this.isPaused = false;
    }

    // Toggle notification container
    toggleNotificationContainer() {
        const container = document.getElementById('notification-container');
        if (container) {
            container.classList.toggle('active');
        }
    }

    // Show notification settings
    showNotificationSettings() {
        // Implement notification settings modal
        console.log('Show notification settings');
    }

    // Load more notifications
    loadMoreNotifications() {
        // Implement load more notifications
        console.log('Load more notifications');
    }
}

// Initialize real-time notifications when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.realTimeNotifications = new RealTimeNotifications();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealTimeNotifications;
}


