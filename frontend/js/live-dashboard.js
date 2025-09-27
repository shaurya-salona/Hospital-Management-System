/**
 * Live Dashboard Updates for HMIS
 * Provides real-time updates for all dashboard components
 */

class LiveDashboard {
    constructor() {
        this.updateIntervals = new Map();
        this.lastUpdates = new Map();
        this.isConnected = false;
        this.updateSettings = {
            patients: { interval: 30000, enabled: true },
            appointments: { interval: 15000, enabled: true },
            inventory: { interval: 60000, enabled: true },
            staff: { interval: 120000, enabled: true },
            notifications: { interval: 10000, enabled: true }
        };

        this.init();
    }

    init() {
        this.createLiveDashboardInterface();
        this.setupEventListeners();
        this.startLiveUpdates();
        this.loadUpdateSettings();
    }

    createLiveDashboardInterface() {
        // Check if live dashboard already exists
        if (document.getElementById('live-dashboard')) return;

        const container = document.createElement('div');
        container.id = 'live-dashboard';
        container.className = 'live-dashboard';
        container.innerHTML = `
            <div class="live-dashboard-header">
                <h3><i class="fas fa-sync-alt"></i> Live Updates</h3>
                <div class="live-controls">
                    <button id="live-settings" class="live-btn" title="Settings">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button id="live-refresh" class="live-btn" title="Refresh All">
                        <i class="fas fa-sync"></i>
                    </button>
                    <button id="live-pause" class="live-btn" title="Pause Updates">
                        <i class="fas fa-pause"></i>
                    </button>
                </div>
            </div>
            <div class="live-status">
                <div class="status-indicator">
                    <span id="connection-status" class="status-dot disconnected"></span>
                    <span id="connection-text">Disconnected</span>
                </div>
                <div class="last-update">
                    <span id="last-update-time">Never</span>
                </div>
            </div>
            <div class="live-metrics">
                <div class="metric-item">
                    <span class="metric-label">Patients:</span>
                    <span id="live-patient-count" class="metric-value">-</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Appointments:</span>
                    <span id="live-appointment-count" class="metric-value">-</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Active Alerts:</span>
                    <span id="live-alert-count" class="metric-value">-</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Online Staff:</span>
                    <span id="live-staff-count" class="metric-value">-</span>
                </div>
            </div>
        `;

        document.body.appendChild(container);
    }

    setupEventListeners() {
        // Live settings
        document.getElementById('live-settings')?.addEventListener('click', () => {
            this.showLiveSettings();
        });

        // Live refresh
        document.getElementById('live-refresh')?.addEventListener('click', () => {
            this.refreshAllData();
        });

        // Live pause
        document.getElementById('live-pause')?.addEventListener('click', () => {
            this.toggleLiveUpdates();
        });

        // Listen for WebSocket events
        if (window.realTimeNotifications) {
            window.realTimeNotifications.socket?.on('live_update', (update) => {
                this.handleLiveUpdate(update);
            });

            window.realTimeNotifications.socket?.on('patient_status_update', (update) => {
                this.handlePatientStatusUpdate(update);
            });

            window.realTimeNotifications.socket?.on('appointment_update', (update) => {
                this.handleAppointmentUpdate(update);
            });

            window.realTimeNotifications.socket?.on('inventory_update', (update) => {
                this.handleInventoryUpdate(update);
            });

            window.realTimeNotifications.socket?.on('connect', () => {
                this.isConnected = true;
                this.updateConnectionStatus('connected');
            });

            window.realTimeNotifications.socket?.on('disconnect', () => {
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');
            });
        }

        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseLiveUpdates();
            } else {
                this.resumeLiveUpdates();
            }
        });
    }

    startLiveUpdates() {
        // Start live updates for each component
        Object.keys(this.updateSettings).forEach(component => {
            if (this.updateSettings[component].enabled) {
                this.startComponentUpdate(component);
            }
        });
    }

    startComponentUpdate(component) {
        const interval = this.updateSettings[component].interval;

        const updateFunction = () => {
            this.updateComponent(component);
        };

        // Clear existing interval if any
        if (this.updateIntervals.has(component)) {
            clearInterval(this.updateIntervals.get(component));
        }

        // Start new interval
        const intervalId = setInterval(updateFunction, interval);
        this.updateIntervals.set(component, intervalId);

        // Initial update
        updateFunction();
    }

    updateComponent(component) {
        switch (component) {
            case 'patients':
                this.updatePatientsData();
                break;
            case 'appointments':
                this.updateAppointmentsData();
                break;
            case 'inventory':
                this.updateInventoryData();
                break;
            case 'staff':
                this.updateStaffData();
                break;
            case 'notifications':
                this.updateNotificationsData();
                break;
        }

        this.lastUpdates.set(component, new Date());
        this.updateLastUpdateTime();
    }

    async updatePatientsData() {
        try {
            const response = await fetch('/api/patients/live', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updatePatientDisplay(data);
            }
        } catch (error) {
            console.error('Error updating patients data:', error);
        }
    }

    async updateAppointmentsData() {
        try {
            const response = await fetch('/api/appointments/live', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateAppointmentDisplay(data);
            }
        } catch (error) {
            console.error('Error updating appointments data:', error);
        }
    }

    async updateInventoryData() {
        try {
            const response = await fetch('/api/inventory/live', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateInventoryDisplay(data);
            }
        } catch (error) {
            console.error('Error updating inventory data:', error);
        }
    }

    async updateStaffData() {
        try {
            const response = await fetch('/api/staff/live', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateStaffDisplay(data);
            }
        } catch (error) {
            console.error('Error updating staff data:', error);
        }
    }

    async updateNotificationsData() {
        try {
            const response = await fetch('/api/notifications/live', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateNotificationDisplay(data);
            }
        } catch (error) {
            console.error('Error updating notifications data:', error);
        }
    }

    updatePatientDisplay(data) {
        // Update patient count
        const patientCount = document.getElementById('live-patient-count');
        if (patientCount) {
            patientCount.textContent = data.total || 0;
        }

        // Update patient list if exists
        const patientList = document.getElementById('patient-list');
        if (patientList && data.patients) {
            this.updatePatientList(patientList, data.patients);
        }

        // Update patient status indicators
        if (data.statusUpdates) {
            data.statusUpdates.forEach(update => {
                this.updatePatientStatusIndicator(update);
            });
        }
    }

    updateAppointmentDisplay(data) {
        // Update appointment count
        const appointmentCount = document.getElementById('live-appointment-count');
        if (appointmentCount) {
            appointmentCount.textContent = data.total || 0;
        }

        // Update appointment list if exists
        const appointmentList = document.getElementById('appointment-list');
        if (appointmentList && data.appointments) {
            this.updateAppointmentList(appointmentList, data.appointments);
        }

        // Update appointment status indicators
        if (data.statusUpdates) {
            data.statusUpdates.forEach(update => {
                this.updateAppointmentStatusIndicator(update);
            });
        }
    }

    updateInventoryDisplay(data) {
        // Update inventory metrics
        if (data.metrics) {
            this.updateInventoryMetrics(data.metrics);
        }

        // Update inventory list if exists
        const inventoryList = document.getElementById('inventory-list');
        if (inventoryList && data.items) {
            this.updateInventoryList(inventoryList, data.items);
        }

        // Update low stock alerts
        if (data.lowStock) {
            this.updateLowStockAlerts(data.lowStock);
        }
    }

    updateStaffDisplay(data) {
        // Update staff count
        const staffCount = document.getElementById('live-staff-count');
        if (staffCount) {
            staffCount.textContent = data.online || 0;
        }

        // Update staff list if exists
        const staffList = document.getElementById('staff-list');
        if (staffList && data.staff) {
            this.updateStaffList(staffList, data.staff);
        }

        // Update staff status indicators
        if (data.statusUpdates) {
            data.statusUpdates.forEach(update => {
                this.updateStaffStatusIndicator(update);
            });
        }
    }

    updateNotificationDisplay(data) {
        // Update alert count
        const alertCount = document.getElementById('live-alert-count');
        if (alertCount) {
            alertCount.textContent = data.activeAlerts || 0;
        }

        // Update notification list if exists
        const notificationList = document.getElementById('notification-list');
        if (notificationList && data.notifications) {
            this.updateNotificationList(notificationList, data.notifications);
        }
    }

    // Handle real-time updates from WebSocket
    handleLiveUpdate(update) {
        switch (update.type) {
            case 'patients':
                this.updatePatientDisplay(update.data);
                break;
            case 'appointments':
                this.updateAppointmentDisplay(update.data);
                break;
            case 'inventory':
                this.updateInventoryDisplay(update.data);
                break;
            case 'staff':
                this.updateStaffDisplay(update.data);
                break;
        }

        this.updateLastUpdateTime();
    }

    handlePatientStatusUpdate(update) {
        // Update patient status in real-time
        this.updatePatientStatusIndicator(update);

        // Show status update notification
        this.showUpdateNotification(`Patient status updated: ${update.status}`);
    }

    handleAppointmentUpdate(update) {
        // Update appointment status in real-time
        this.updateAppointmentStatusIndicator(update);

        // Show appointment update notification
        this.showUpdateNotification(`Appointment updated: ${update.status}`);
    }

    handleInventoryUpdate(update) {
        // Update inventory status in real-time
        this.updateInventoryStatusIndicator(update);

        // Show inventory update notification
        this.showUpdateNotification(`Inventory updated: ${update.action}`);
    }

    // Display update methods
    updatePatientList(container, patients) {
        container.innerHTML = patients.map(patient => `
            <div class="patient-item" data-id="${patient.id}">
                <div class="patient-info">
                    <span class="patient-name">${patient.name}</span>
                    <span class="patient-id">${patient.id}</span>
                </div>
                <div class="patient-status ${patient.status}">
                    ${patient.status}
                </div>
            </div>
        `).join('');
    }

    updateAppointmentList(container, appointments) {
        container.innerHTML = appointments.map(appointment => `
            <div class="appointment-item" data-id="${appointment.id}">
                <div class="appointment-info">
                    <span class="appointment-time">${appointment.time}</span>
                    <span class="appointment-patient">${appointment.patientName}</span>
                </div>
                <div class="appointment-status ${appointment.status}">
                    ${appointment.status}
                </div>
            </div>
        `).join('');
    }

    updateInventoryList(container, items) {
        container.innerHTML = items.map(item => `
            <div class="inventory-item" data-id="${item.id}">
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-stock">Stock: ${item.stock}</span>
                </div>
                <div class="item-status ${item.stock < item.minStock ? 'low-stock' : 'normal'}">
                    ${item.stock < item.minStock ? 'Low Stock' : 'Normal'}
                </div>
            </div>
        `).join('');
    }

    updateStaffList(container, staff) {
        container.innerHTML = staff.map(member => `
            <div class="staff-item" data-id="${member.id}">
                <div class="staff-info">
                    <span class="staff-name">${member.name}</span>
                    <span class="staff-role">${member.role}</span>
                </div>
                <div class="staff-status ${member.status}">
                    ${member.status}
                </div>
            </div>
        `).join('');
    }

    updateNotificationList(container, notifications) {
        container.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.type}" data-id="${notification.id}">
                <div class="notification-content">
                    <span class="notification-message">${notification.message}</span>
                    <span class="notification-time">${this.getTimeAgo(notification.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }

    // Status indicator updates
    updatePatientStatusIndicator(update) {
        const indicator = document.querySelector(`[data-patient-id="${update.patientId}"] .patient-status`);
        if (indicator) {
            indicator.textContent = update.status;
            indicator.className = `patient-status ${update.status}`;
        }
    }

    updateAppointmentStatusIndicator(update) {
        const indicator = document.querySelector(`[data-appointment-id="${update.appointmentId}"] .appointment-status`);
        if (indicator) {
            indicator.textContent = update.status;
            indicator.className = `appointment-status ${update.status}`;
        }
    }

    updateInventoryStatusIndicator(update) {
        const indicator = document.querySelector(`[data-item-id="${update.itemId}"] .item-status`);
        if (indicator) {
            indicator.textContent = update.action;
            indicator.className = `item-status ${update.action}`;
        }
    }

    updateStaffStatusIndicator(update) {
        const indicator = document.querySelector(`[data-staff-id="${update.staffId}"] .staff-status`);
        if (indicator) {
            indicator.textContent = update.status;
            indicator.className = `staff-status ${update.status}`;
        }
    }

    // Utility methods
    updateConnectionStatus(status) {
        const statusDot = document.getElementById('connection-status');
        const statusText = document.getElementById('connection-text');

        if (statusDot) {
            statusDot.className = `status-dot ${status}`;
        }

        if (statusText) {
            statusText.textContent = status;
        }
    }

    updateLastUpdateTime() {
        const lastUpdateTime = document.getElementById('last-update-time');
        if (lastUpdateTime) {
            lastUpdateTime.textContent = new Date().toLocaleTimeString();
        }
    }

    showUpdateNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            padding: 8px 16px;
            background: #3b82f6;
            color: white;
            border-radius: 4px;
            font-size: 14px;
            z-index: 1000;
            animation: slideInLeft 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return `${seconds}s ago`;
    }

    // Settings and controls
    showLiveSettings() {
        const modal = document.createElement('div');
        modal.className = 'live-settings-modal';
        modal.innerHTML = `
            <div class="live-settings-content">
                <div class="live-settings-header">
                    <h3><i class="fas fa-cog"></i> Live Update Settings</h3>
                    <button class="live-settings-close">&times;</button>
                </div>
                <div class="live-settings-body">
                    <form id="live-settings-form">
                        ${Object.keys(this.updateSettings).map(component => `
                            <div class="setting-group">
                                <label>
                                    <input type="checkbox" id="${component}-enabled" ${this.updateSettings[component].enabled ? 'checked' : ''}>
                                    Enable ${component} updates
                                </label>
                                <div class="interval-setting">
                                    <label for="${component}-interval">Update interval (seconds):</label>
                                    <input type="number" id="${component}-interval" value="${this.updateSettings[component].interval / 1000}" min="5" max="300">
                                </div>
                            </div>
                        `).join('')}
                    </form>
                </div>
                <div class="live-settings-footer">
                    <button class="live-settings-cancel">Cancel</button>
                    <button class="live-settings-save">Save Settings</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelector('.live-settings-close').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.live-settings-cancel').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.live-settings-save').addEventListener('click', () => {
            this.saveLiveSettings(modal);
        });
    }

    saveLiveSettings(modal) {
        const form = modal.querySelector('#live-settings-form');

        Object.keys(this.updateSettings).forEach(component => {
            const enabled = form.querySelector(`#${component}-enabled`).checked;
            const interval = parseInt(form.querySelector(`#${component}-interval`).value) * 1000;

            this.updateSettings[component] = { enabled, interval };

            if (enabled) {
                this.startComponentUpdate(component);
            } else {
                this.stopComponentUpdate(component);
            }
        });

        // Save to localStorage
        localStorage.setItem('live-dashboard-settings', JSON.stringify(this.updateSettings));

        modal.remove();
        this.showUpdateNotification('Live update settings saved');
    }

    refreshAllData() {
        Object.keys(this.updateSettings).forEach(component => {
            this.updateComponent(component);
        });

        this.showUpdateNotification('All data refreshed');
    }

    toggleLiveUpdates() {
        const pauseBtn = document.getElementById('live-pause');
        const isPaused = pauseBtn.classList.contains('paused');

        if (isPaused) {
            this.resumeLiveUpdates();
            pauseBtn.classList.remove('paused');
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            this.pauseLiveUpdates();
            pauseBtn.classList.add('paused');
            pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    pauseLiveUpdates() {
        this.updateIntervals.forEach(intervalId => {
            clearInterval(intervalId);
        });
        this.updateIntervals.clear();
    }

    resumeLiveUpdates() {
        this.startLiveUpdates();
    }

    stopComponentUpdate(component) {
        if (this.updateIntervals.has(component)) {
            clearInterval(this.updateIntervals.get(component));
            this.updateIntervals.delete(component);
        }
    }

    loadUpdateSettings() {
        const saved = localStorage.getItem('live-dashboard-settings');
        if (saved) {
            this.updateSettings = { ...this.updateSettings, ...JSON.parse(saved) };
        }
    }
}

// Initialize live dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.liveDashboard = new LiveDashboard();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LiveDashboard;
}


