/**
 * Emergency Alert System for HMIS
 * Handles critical emergency alerts, escalation, and response protocols
 */

class EmergencyAlertSystem {
    constructor() {
        this.activeAlerts = new Map();
        this.alertHistory = [];
        this.alertSettings = {
            autoEscalate: true,
            escalationTime: 5 * 60 * 1000, // 5 minutes
            soundEnabled: true,
            flashEnabled: true,
            notificationEnabled: true
        };

        this.init();
    }

    init() {
        this.createEmergencyInterface();
        this.setupEventListeners();
        this.loadAlertSettings();
        this.setupPeriodicTasks();
    }

    createEmergencyInterface() {
        // Check if emergency interface already exists
        if (document.getElementById('emergency-alert-system')) return;

        const container = document.createElement('div');
        container.id = 'emergency-alert-system';
        container.className = 'emergency-alert-system';
        container.innerHTML = `
            <div class="emergency-header">
                <h3><i class="fas fa-exclamation-triangle"></i> Emergency Alerts</h3>
                <div class="emergency-controls">
                    <button id="emergency-settings" class="emergency-btn" title="Settings">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button id="emergency-history" class="emergency-btn" title="History">
                        <i class="fas fa-history"></i>
                    </button>
                    <button id="emergency-test" class="emergency-btn" title="Test Alert">
                        <i class="fas fa-vial"></i>
                    </button>
                </div>
            </div>
            <div id="active-emergencies" class="active-emergencies"></div>
            <div class="emergency-actions">
                <button id="create-emergency" class="create-emergency-btn">
                    <i class="fas fa-plus"></i> Create Emergency Alert
                </button>
            </div>
        `;

        document.body.appendChild(container);
    }

    setupEventListeners() {
        // Create emergency button
        document.getElementById('create-emergency')?.addEventListener('click', () => {
            this.showCreateEmergencyModal();
        });

        // Emergency settings
        document.getElementById('emergency-settings')?.addEventListener('click', () => {
            this.showEmergencySettings();
        });

        // Emergency history
        document.getElementById('emergency-history')?.addEventListener('click', () => {
            this.showEmergencyHistory();
        });

        // Test emergency
        document.getElementById('emergency-test')?.addEventListener('click', () => {
            this.testEmergencyAlert();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                this.showCreateEmergencyModal();
            }
        });

        // Listen for emergency alerts from WebSocket
        if (window.realTimeNotifications) {
            window.realTimeNotifications.socket?.on('emergency_alert', (alert) => {
                this.handleEmergencyAlert(alert);
            });
        }
    }

    showCreateEmergencyModal() {
        const modal = document.createElement('div');
        modal.className = 'emergency-modal';
        modal.innerHTML = `
            <div class="emergency-modal-content">
                <div class="emergency-modal-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> Create Emergency Alert</h3>
                    <button class="emergency-modal-close">&times;</button>
                </div>
                <div class="emergency-modal-body">
                    <form id="emergency-form">
                        <div class="form-group">
                            <label for="patient-id">Patient ID:</label>
                            <input type="text" id="patient-id" name="patientId" required>
                        </div>
                        <div class="form-group">
                            <label for="patient-name">Patient Name:</label>
                            <input type="text" id="patient-name" name="patientName" required>
                        </div>
                        <div class="form-group">
                            <label for="emergency-type">Emergency Type:</label>
                            <select id="emergency-type" name="emergencyType" required>
                                <option value="">Select Emergency Type</option>
                                <option value="cardiac">Cardiac Arrest</option>
                                <option value="respiratory">Respiratory Distress</option>
                                <option value="trauma">Trauma</option>
                                <option value="stroke">Stroke</option>
                                <option value="seizure">Seizure</option>
                                <option value="allergic">Allergic Reaction</option>
                                <option value="overdose">Drug Overdose</option>
                                <option value="psychiatric">Psychiatric Emergency</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="location">Location:</label>
                            <input type="text" id="location" name="location" placeholder="Room number, ward, etc." required>
                        </div>
                        <div class="form-group">
                            <label for="description">Description:</label>
                            <textarea id="description" name="description" rows="3" placeholder="Describe the emergency situation..."></textarea>
                        </div>
                        <div class="form-group">
                            <label for="priority">Priority:</label>
                            <select id="priority" name="priority">
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="emergency-modal-footer">
                    <button class="emergency-cancel-btn">Cancel</button>
                    <button class="emergency-submit-btn">Create Alert</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelector('.emergency-modal-close').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.emergency-cancel-btn').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.emergency-submit-btn').addEventListener('click', () => {
            this.submitEmergencyAlert(modal);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    submitEmergencyAlert(modal) {
        const form = modal.querySelector('#emergency-form');
        const formData = new FormData(form);

        const alertData = {
            patientId: formData.get('patientId'),
            patientName: formData.get('patientName'),
            emergencyType: formData.get('emergencyType'),
            location: formData.get('location'),
            description: formData.get('description'),
            priority: formData.get('priority')
        };

        // Validate form
        if (!alertData.patientId || !alertData.patientName || !alertData.emergencyType || !alertData.location) {
            this.showAlert('Please fill in all required fields', 'error');
            return;
        }

        // Send emergency alert
        if (window.realTimeNotifications) {
            window.realTimeNotifications.sendEmergencyAlert(
                alertData.patientId,
                alertData.patientName,
                alertData.emergencyType,
                alertData.location,
                alertData.description
            );
        }

        // Close modal
        modal.remove();

        // Show success message
        this.showAlert('Emergency alert created successfully', 'success');
    }

    handleEmergencyAlert(alert) {
        // Add to active alerts
        this.activeAlerts.set(alert.id, alert);

        // Add to history
        this.alertHistory.unshift(alert);

        // Update display
        this.updateActiveAlertsDisplay();

        // Show emergency notification
        this.showEmergencyNotification(alert);

        // Play emergency sound
        if (this.alertSettings.soundEnabled) {
            this.playEmergencySound(alert.emergencyType);
        }

        // Flash screen for critical alerts
        if (alert.emergencyType === 'critical' && this.alertSettings.flashEnabled) {
            this.flashScreen();
        }

        // Auto-escalate if enabled
        if (this.alertSettings.autoEscalate) {
            setTimeout(() => {
                this.escalateAlert(alert.id);
            }, this.alertSettings.escalationTime);
        }
    }

    showEmergencyNotification(alert) {
        const notification = document.createElement('div');
        notification.className = `emergency-notification ${alert.emergencyType}`;
        notification.innerHTML = `
            <div class="emergency-notification-header">
                <i class="fas fa-exclamation-triangle"></i>
                <span class="emergency-type">${this.getEmergencyTypeName(alert.emergencyType)}</span>
                <span class="emergency-time">${new Date(alert.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="emergency-notification-body">
                <div class="patient-info">
                    <strong>Patient:</strong> ${alert.patientName} (ID: ${alert.patientId})
                </div>
                <div class="location-info">
                    <strong>Location:</strong> ${alert.location}
                </div>
                <div class="description-info">
                    <strong>Description:</strong> ${alert.description || 'No description provided'}
                </div>
            </div>
            <div class="emergency-notification-actions">
                <button class="acknowledge-btn" onclick="window.emergencyAlertSystem.acknowledgeAlert('${alert.id}')">
                    <i class="fas fa-check"></i> Acknowledge
                </button>
                <button class="resolve-btn" onclick="window.emergencyAlertSystem.resolveAlert('${alert.id}')">
                    <i class="fas fa-check-double"></i> Resolve
                </button>
                <button class="escalate-btn" onclick="window.emergencyAlertSystem.escalateAlert('${alert.id}')">
                    <i class="fas fa-arrow-up"></i> Escalate
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 30 seconds if not acknowledged
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 30000);
    }

    updateActiveAlertsDisplay() {
        const container = document.getElementById('active-emergencies');
        if (!container) return;

        if (this.activeAlerts.size === 0) {
            container.innerHTML = '<div class="no-emergencies">No active emergencies</div>';
            return;
        }

        container.innerHTML = Array.from(this.activeAlerts.values()).map(alert =>
            this.createAlertElement(alert)
        ).join('');
    }

    createAlertElement(alert) {
        const timeAgo = this.getTimeAgo(alert.timestamp);
        const statusClass = alert.status || 'active';
        const priorityClass = alert.priority || 'high';

        return `
            <div class="emergency-alert-item ${statusClass} ${priorityClass}" data-id="${alert.id}">
                <div class="alert-header">
                    <div class="alert-type">
                        <i class="fas fa-${this.getEmergencyIcon(alert.emergencyType)}"></i>
                        <span>${this.getEmergencyTypeName(alert.emergencyType)}</span>
                    </div>
                    <div class="alert-time">${timeAgo}</div>
                </div>
                <div class="alert-content">
                    <div class="patient-info">
                        <strong>Patient:</strong> ${alert.patientName} (ID: ${alert.patientId})
                    </div>
                    <div class="location-info">
                        <strong>Location:</strong> ${alert.location}
                    </div>
                    <div class="description-info">
                        <strong>Description:</strong> ${alert.description || 'No description provided'}
                    </div>
                    <div class="reported-by">
                        <strong>Reported by:</strong> ${alert.reportedBy.name} (${alert.reportedBy.role})
                    </div>
                </div>
                <div class="alert-actions">
                    <button class="alert-action-btn acknowledge" onclick="window.emergencyAlertSystem.acknowledgeAlert('${alert.id}')">
                        <i class="fas fa-check"></i> Acknowledge
                    </button>
                    <button class="alert-action-btn resolve" onclick="window.emergencyAlertSystem.resolveAlert('${alert.id}')">
                        <i class="fas fa-check-double"></i> Resolve
                    </button>
                    <button class="alert-action-btn escalate" onclick="window.emergencyAlertSystem.escalateAlert('${alert.id}')">
                        <i class="fas fa-arrow-up"></i> Escalate
                    </button>
                </div>
            </div>
        `;
    }

    acknowledgeAlert(alertId) {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.acknowledgedBy = alert.acknowledgedBy || [];
            alert.acknowledgedBy.push(this.getCurrentUserId());
            alert.status = 'acknowledged';

            // Update display
            this.updateActiveAlertsDisplay();

            // Show acknowledgment notification
            this.showAlert('Emergency alert acknowledged', 'success');

            // Log acknowledgment
            console.log(`Emergency alert ${alertId} acknowledged by ${this.getCurrentUserId()}`);
        }
    }

    resolveAlert(alertId) {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.status = 'resolved';
            alert.resolvedAt = new Date();
            alert.resolvedBy = this.getCurrentUserId();

            // Remove from active alerts
            this.activeAlerts.delete(alertId);

            // Update display
            this.updateActiveAlertsDisplay();

            // Show resolution notification
            this.showAlert('Emergency alert resolved', 'success');

            // Log resolution
            console.log(`Emergency alert ${alertId} resolved by ${this.getCurrentUserId()}`);
        }
    }

    escalateAlert(alertId) {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.status = 'escalated';
            alert.escalatedAt = new Date();
            alert.escalatedBy = this.getCurrentUserId();

            // Update display
            this.updateActiveAlertsDisplay();

            // Show escalation notification
            this.showAlert('Emergency alert escalated', 'warning');

            // Log escalation
            console.log(`Emergency alert ${alertId} escalated by ${this.getCurrentUserId()}`);
        }
    }

    testEmergencyAlert() {
        const testAlert = {
            id: 'test_' + Date.now(),
            patientId: 'TEST001',
            patientName: 'Test Patient',
            emergencyType: 'cardiac',
            location: 'Test Room 1',
            description: 'This is a test emergency alert',
            reportedBy: {
                userId: this.getCurrentUserId(),
                name: 'Test User',
                role: 'doctor'
            },
            timestamp: new Date(),
            status: 'active',
            acknowledgedBy: []
        };

        this.handleEmergencyAlert(testAlert);
        this.showAlert('Test emergency alert created', 'info');
    }

    showEmergencySettings() {
        const modal = document.createElement('div');
        modal.className = 'emergency-modal';
        modal.innerHTML = `
            <div class="emergency-modal-content">
                <div class="emergency-modal-header">
                    <h3><i class="fas fa-cog"></i> Emergency Settings</h3>
                    <button class="emergency-modal-close">&times;</button>
                </div>
                <div class="emergency-modal-body">
                    <form id="emergency-settings-form">
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="auto-escalate" ${this.alertSettings.autoEscalate ? 'checked' : ''}>
                                Auto-escalate alerts after ${this.alertSettings.escalationTime / 60000} minutes
                            </label>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="sound-enabled" ${this.alertSettings.soundEnabled ? 'checked' : ''}>
                                Enable emergency sounds
                            </label>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="flash-enabled" ${this.alertSettings.flashEnabled ? 'checked' : ''}>
                                Enable screen flashing for critical alerts
                            </label>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="notification-enabled" ${this.alertSettings.notificationEnabled ? 'checked' : ''}>
                                Enable browser notifications
                            </label>
                        </div>
                    </form>
                </div>
                <div class="emergency-modal-footer">
                    <button class="emergency-cancel-btn">Cancel</button>
                    <button class="emergency-submit-btn">Save Settings</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelector('.emergency-modal-close').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.emergency-cancel-btn').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.emergency-submit-btn').addEventListener('click', () => {
            this.saveEmergencySettings(modal);
        });
    }

    saveEmergencySettings(modal) {
        const form = modal.querySelector('#emergency-settings-form');

        this.alertSettings.autoEscalate = form.querySelector('#auto-escalate').checked;
        this.alertSettings.soundEnabled = form.querySelector('#sound-enabled').checked;
        this.alertSettings.flashEnabled = form.querySelector('#flash-enabled').checked;
        this.alertSettings.notificationEnabled = form.querySelector('#notification-enabled').checked;

        // Save to localStorage
        localStorage.setItem('emergency-alert-settings', JSON.stringify(this.alertSettings));

        modal.remove();
        this.showAlert('Emergency settings saved', 'success');
    }

    showEmergencyHistory() {
        const modal = document.createElement('div');
        modal.className = 'emergency-modal';
        modal.innerHTML = `
            <div class="emergency-modal-content">
                <div class="emergency-modal-header">
                    <h3><i class="fas fa-history"></i> Emergency History</h3>
                    <button class="emergency-modal-close">&times;</button>
                </div>
                <div class="emergency-modal-body">
                    <div id="emergency-history-list" class="emergency-history-list">
                        ${this.alertHistory.map(alert => this.createHistoryElement(alert)).join('')}
                    </div>
                </div>
                <div class="emergency-modal-footer">
                    <button class="emergency-cancel-btn">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelector('.emergency-modal-close').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.emergency-cancel-btn').addEventListener('click', () => {
            modal.remove();
        });
    }

    createHistoryElement(alert) {
        const timeAgo = this.getTimeAgo(alert.timestamp);
        const statusClass = alert.status || 'resolved';

        return `
            <div class="emergency-history-item ${statusClass}">
                <div class="history-header">
                    <span class="emergency-type">${this.getEmergencyTypeName(alert.emergencyType)}</span>
                    <span class="history-time">${timeAgo}</span>
                </div>
                <div class="history-content">
                    <div class="patient-info">${alert.patientName} (${alert.patientId})</div>
                    <div class="location-info">${alert.location}</div>
                    <div class="status-info">Status: ${statusClass}</div>
                </div>
            </div>
        `;
    }

    // Utility methods
    getEmergencyTypeName(type) {
        const types = {
            'cardiac': 'Cardiac Arrest',
            'respiratory': 'Respiratory Distress',
            'trauma': 'Trauma',
            'stroke': 'Stroke',
            'seizure': 'Seizure',
            'allergic': 'Allergic Reaction',
            'overdose': 'Drug Overdose',
            'psychiatric': 'Psychiatric Emergency',
            'other': 'Other'
        };
        return types[type] || type;
    }

    getEmergencyIcon(type) {
        const icons = {
            'cardiac': 'heartbeat',
            'respiratory': 'lungs',
            'trauma': 'band-aid',
            'stroke': 'brain',
            'seizure': 'bolt',
            'allergic': 'exclamation-triangle',
            'overdose': 'pills',
            'psychiatric': 'user-md',
            'other': 'exclamation-circle'
        };
        return icons[type] || 'exclamation-triangle';
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

    playEmergencySound(type) {
        const audio = new Audio();
        audio.src = this.getEmergencySound(type);
        audio.volume = 0.5;
        audio.play().catch(() => {
            // Fallback to beep sound
            this.playBeepSound();
        });
    }

    getEmergencySound(type) {
        const sounds = {
            'cardiac': '/sounds/cardiac.mp3',
            'respiratory': '/sounds/respiratory.mp3',
            'trauma': '/sounds/trauma.mp3',
            'stroke': '/sounds/stroke.mp3',
            'seizure': '/sounds/seizure.mp3',
            'allergic': '/sounds/allergic.mp3',
            'overdose': '/sounds/overdose.mp3',
            'psychiatric': '/sounds/psychiatric.mp3',
            'other': '/sounds/emergency.mp3'
        };
        return sounds[type] || '/sounds/emergency.mp3';
    }

    playBeepSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

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

    showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        if (type === 'success') alert.style.background = '#10b981';
        if (type === 'error') alert.style.background = '#ef4444';
        if (type === 'warning') alert.style.background = '#f59e0b';
        if (type === 'info') alert.style.background = '#3b82f6';

        document.body.appendChild(alert);

        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    getCurrentUserId() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.userId;
            } catch (error) {
                console.error('Error parsing token:', error);
            }
        }
        return 'unknown';
    }

    loadAlertSettings() {
        const saved = localStorage.getItem('emergency-alert-settings');
        if (saved) {
            this.alertSettings = { ...this.alertSettings, ...JSON.parse(saved) };
        }
    }

    setupPeriodicTasks() {
        // Clean up old alerts every hour
        setInterval(() => {
            this.cleanupOldAlerts();
        }, 60 * 60 * 1000);

        // Update display every 30 seconds
        setInterval(() => {
            this.updateActiveAlertsDisplay();
        }, 30000);
    }

    cleanupOldAlerts() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // Remove old resolved alerts from history
        this.alertHistory = this.alertHistory.filter(alert =>
            alert.timestamp > oneHourAgo || alert.status !== 'resolved'
        );
    }
}

// Initialize emergency alert system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.emergencyAlertSystem = new EmergencyAlertSystem();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmergencyAlertSystem;
}


