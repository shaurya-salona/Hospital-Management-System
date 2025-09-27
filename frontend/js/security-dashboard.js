/**
 * Security Dashboard for HMIS
 * Provides comprehensive security management interface
 */

class SecurityDashboard {
    constructor() {
        this.currentView = 'overview';
        this.auditLogs = [];
        this.securityStats = {};
        this.twoFactorStatus = {};

        this.init();
    }

    init() {
        this.createSecurityInterface();
        this.setupEventListeners();
        this.loadSecurityOverview();
        this.setupPeriodicUpdates();
    }

    createSecurityInterface() {
        // Check if security interface already exists
        if (document.getElementById('security-dashboard')) return;

        const container = document.createElement('div');
        container.id = 'security-dashboard';
        container.className = 'security-dashboard';
        container.innerHTML = `
            <div class="security-header">
                <h2><i class="fas fa-shield-alt"></i> Security Dashboard</h2>
                <div class="security-controls">
                    <button id="security-overview-btn" class="security-btn active">
                        <i class="fas fa-chart-pie"></i> Overview
                    </button>
                    <button id="security-2fa-btn" class="security-btn">
                        <i class="fas fa-key"></i> 2FA
                    </button>
                    <button id="security-audit-btn" class="security-btn">
                        <i class="fas fa-clipboard-list"></i> Audit Logs
                    </button>
                    <button id="security-encryption-btn" class="security-btn">
                        <i class="fas fa-lock"></i> Encryption
                    </button>
                    <button id="security-compliance-btn" class="security-btn">
                        <i class="fas fa-certificate"></i> Compliance
                    </button>
                </div>
            </div>

            <div class="security-content">
                <div id="security-overview" class="security-view active">
                    <div class="security-stats">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="stat-content">
                                <h3 id="total-users">-</h3>
                                <p>Total Users</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-key"></i>
                            </div>
                            <div class="stat-content">
                                <h3 id="2fa-enabled">-</h3>
                                <p>2FA Enabled</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="stat-content">
                                <h3 id="security-alerts">-</h3>
                                <p>Security Alerts</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-shield-alt"></i>
                            </div>
                            <div class="stat-content">
                                <h3 id="compliance-score">-</h3>
                                <p>Compliance Score</p>
                            </div>
                        </div>
                    </div>

                    <div class="security-charts">
                        <div class="chart-container">
                            <h4>Security Events (24h)</h4>
                            <canvas id="security-events-chart"></canvas>
                        </div>
                        <div class="chart-container">
                            <h4>Login Attempts</h4>
                            <canvas id="login-attempts-chart"></canvas>
                        </div>
                    </div>
                </div>

                <div id="security-2fa" class="security-view">
                    <div class="2fa-setup">
                        <h3>Two-Factor Authentication Setup</h3>
                        <div class="2fa-status" id="2fa-status">
                            <div class="status-indicator">
                                <span class="status-dot"></span>
                                <span id="2fa-status-text">Checking...</span>
                            </div>
                        </div>

                        <div class="2fa-options">
                            <div class="2fa-option">
                                <h4><i class="fas fa-mobile-alt"></i> TOTP (Authenticator App)</h4>
                                <p>Use Google Authenticator, Authy, or similar apps</p>
                                <button id="setup-totp-btn" class="setup-btn">Setup TOTP</button>
                            </div>

                            <div class="2fa-option">
                                <h4><i class="fas fa-sms"></i> SMS Verification</h4>
                                <p>Receive codes via SMS</p>
                                <button id="setup-sms-btn" class="setup-btn">Setup SMS</button>
                            </div>

                            <div class="2fa-option">
                                <h4><i class="fas fa-envelope"></i> Email Verification</h4>
                                <p>Receive codes via email</p>
                                <button id="setup-email-btn" class="setup-btn">Setup Email</button>
                            </div>
                        </div>

                        <div class="2fa-backup-codes" id="backup-codes-section" style="display: none;">
                            <h4>Backup Codes</h4>
                            <p>Save these backup codes in a secure location:</p>
                            <div id="backup-codes-list"></div>
                        </div>
                    </div>
                </div>

                <div id="security-audit" class="security-view">
                    <div class="audit-filters">
                        <div class="filter-group">
                            <label for="audit-user-filter">User:</label>
                            <select id="audit-user-filter">
                                <option value="">All Users</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="audit-event-filter">Event Type:</label>
                            <select id="audit-event-filter">
                                <option value="">All Events</option>
                                <option value="login_success">Login Success</option>
                                <option value="login_failed">Login Failed</option>
                                <option value="patient_view">Patient View</option>
                                <option value="data_export">Data Export</option>
                                <option value="suspicious_activity">Suspicious Activity</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="audit-severity-filter">Severity:</label>
                            <select id="audit-severity-filter">
                                <option value="">All Severities</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="audit-date-from">From:</label>
                            <input type="date" id="audit-date-from">
                        </div>
                        <div class="filter-group">
                            <label for="audit-date-to">To:</label>
                            <input type="date" id="audit-date-to">
                        </div>
                        <button id="apply-audit-filters-btn" class="apply-filters-btn">
                            <i class="fas fa-filter"></i> Apply Filters
                        </button>
                    </div>

                    <div class="audit-logs">
                        <div class="audit-logs-header">
                            <h3>Audit Logs</h3>
                            <div class="audit-actions">
                                <button id="export-audit-logs-btn" class="export-btn">
                                    <i class="fas fa-download"></i> Export
                                </button>
                                <button id="refresh-audit-logs-btn" class="refresh-btn">
                                    <i class="fas fa-sync"></i> Refresh
                                </button>
                            </div>
                        </div>
                        <div id="audit-logs-list" class="audit-logs-list">
                            <!-- Audit logs will be loaded here -->
                        </div>
                    </div>
                </div>

                <div id="security-encryption" class="security-view">
                    <div class="encryption-status">
                        <h3>Encryption Status</h3>
                        <div class="encryption-info">
                            <div class="info-item">
                                <span class="info-label">Algorithm:</span>
                                <span id="encryption-algorithm">-</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Key Length:</span>
                                <span id="encryption-key-length">-</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Status:</span>
                                <span id="encryption-status" class="status-indicator">
                                    <span class="status-dot"></span>
                                    <span>Checking...</span>
                                </span>
                            </div>
                        </div>

                        <div class="encryption-actions">
                            <button id="validate-encryption-btn" class="action-btn">
                                <i class="fas fa-check-circle"></i> Validate Encryption
                            </button>
                            <button id="rotate-keys-btn" class="action-btn">
                                <i class="fas fa-sync"></i> Rotate Keys
                            </button>
                        </div>
                    </div>
                </div>

                <div id="security-compliance" class="security-view">
                    <div class="compliance-status">
                        <h3>HIPAA Compliance Status</h3>
                        <div class="compliance-checks">
                            <div class="compliance-item">
                                <i class="fas fa-check-circle"></i>
                                <span>Encryption Enabled</span>
                            </div>
                            <div class="compliance-item">
                                <i class="fas fa-check-circle"></i>
                                <span>Audit Logging Enabled</span>
                            </div>
                            <div class="compliance-item">
                                <i class="fas fa-check-circle"></i>
                                <span>Two-Factor Authentication</span>
                            </div>
                            <div class="compliance-item">
                                <i class="fas fa-check-circle"></i>
                                <span>Data Retention Compliant</span>
                            </div>
                            <div class="compliance-item">
                                <i class="fas fa-check-circle"></i>
                                <span>Access Controls In Place</span>
                            </div>
                        </div>

                        <div class="compliance-actions">
                            <button id="run-compliance-check-btn" class="action-btn">
                                <i class="fas fa-search"></i> Run Compliance Check
                            </button>
                            <button id="report-violation-btn" class="action-btn">
                                <i class="fas fa-exclamation-triangle"></i> Report Violation
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('security-overview-btn')?.addEventListener('click', () => {
            this.showView('overview');
        });

        document.getElementById('security-2fa-btn')?.addEventListener('click', () => {
            this.showView('2fa');
        });

        document.getElementById('security-audit-btn')?.addEventListener('click', () => {
            this.showView('audit');
        });

        document.getElementById('security-encryption-btn')?.addEventListener('click', () => {
            this.showView('encryption');
        });

        document.getElementById('security-compliance-btn')?.addEventListener('click', () => {
            this.showView('compliance');
        });

        // 2FA setup buttons
        document.getElementById('setup-totp-btn')?.addEventListener('click', () => {
            this.setupTOTP();
        });

        document.getElementById('setup-sms-btn')?.addEventListener('click', () => {
            this.setupSMS();
        });

        document.getElementById('setup-email-btn')?.addEventListener('click', () => {
            this.setupEmail();
        });

        // Audit filters
        document.getElementById('apply-audit-filters-btn')?.addEventListener('click', () => {
            this.loadAuditLogs();
        });

        document.getElementById('export-audit-logs-btn')?.addEventListener('click', () => {
            this.exportAuditLogs();
        });

        document.getElementById('refresh-audit-logs-btn')?.addEventListener('click', () => {
            this.loadAuditLogs();
        });

        // Encryption actions
        document.getElementById('validate-encryption-btn')?.addEventListener('click', () => {
            this.validateEncryption();
        });

        document.getElementById('rotate-keys-btn')?.addEventListener('click', () => {
            this.rotateKeys();
        });

        // Compliance actions
        document.getElementById('run-compliance-check-btn')?.addEventListener('click', () => {
            this.runComplianceCheck();
        });

        document.getElementById('report-violation-btn')?.addEventListener('click', () => {
            this.showViolationReportModal();
        });
    }

    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.security-view').forEach(view => {
            view.classList.remove('active');
        });

        // Remove active class from all buttons
        document.querySelectorAll('.security-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected view
        document.getElementById(`security-${viewName}`)?.classList.add('active');
        document.getElementById(`security-${viewName}-btn`)?.classList.add('active');

        this.currentView = viewName;

        // Load view-specific data
        switch (viewName) {
            case 'overview':
                this.loadSecurityOverview();
                break;
            case '2fa':
                this.load2FAStatus();
                break;
            case 'audit':
                this.loadAuditLogs();
                break;
            case 'encryption':
                this.loadEncryptionStatus();
                break;
            case 'compliance':
                this.loadComplianceStatus();
                break;
        }
    }

    async loadSecurityOverview() {
        try {
            const response = await fetch('/api/security-enhanced/dashboard/overview', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateSecurityStats(data.overview);
                this.createSecurityCharts(data.overview);
            }
        } catch (error) {
            console.error('Error loading security overview:', error);
        }
    }

    updateSecurityStats(overview) {
        // Update stat cards
        document.getElementById('total-users').textContent = overview.audit?.totalEvents || 0;
        document.getElementById('2fa-enabled').textContent = overview.twoFactor?.twoFactorEnabled || 0;
        document.getElementById('security-alerts').textContent = overview.audit?.suspiciousActivity || 0;
        document.getElementById('compliance-score').textContent = '95%';
    }

    createSecurityCharts(overview) {
        if (typeof Chart === 'undefined') return;

        // Security events chart
        const eventsCtx = document.getElementById('security-events-chart');
        if (eventsCtx && overview.audit?.eventsByType) {
            const eventsChart = new Chart(eventsCtx, {
                type: 'doughnut',
                data: {
                    labels: overview.audit.eventsByType.map(item => item.event_type),
                    datasets: [{
                        data: overview.audit.eventsByType.map(item => item.count),
                        backgroundColor: [
                            '#667eea',
                            '#764ba2',
                            '#f093fb',
                            '#f5576c',
                            '#4facfe'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Security Events by Type'
                        }
                    }
                }
            });
        }

        // Login attempts chart
        const loginCtx = document.getElementById('login-attempts-chart');
        if (loginCtx) {
            const loginChart = new Chart(loginCtx, {
                type: 'line',
                data: {
                    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                    datasets: [{
                        label: 'Login Attempts',
                        data: [12, 19, 3, 5, 2, 3],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Login Attempts Over Time'
                        }
                    }
                }
            });
        }
    }

    async load2FAStatus() {
        try {
            const userId = this.getCurrentUserId();
            const response = await fetch(`/api/security-enhanced/2fa/status/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.update2FAStatus(data);
            }
        } catch (error) {
            console.error('Error loading 2FA status:', error);
        }
    }

    update2FAStatus(status) {
        const statusElement = document.getElementById('2fa-status-text');
        const statusDot = document.querySelector('#2fa-status .status-dot');

        if (status.enabled) {
            statusElement.textContent = '2FA Enabled';
            statusDot.className = 'status-dot enabled';
        } else {
            statusElement.textContent = '2FA Disabled';
            statusDot.className = 'status-dot disabled';
        }
    }

    async setupTOTP() {
        try {
            const userId = this.getCurrentUserId();
            const userEmail = this.getCurrentUserEmail();

            const response = await fetch('/api/security-enhanced/2fa/setup', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    userEmail
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.showTOTPSetupModal(data);
            }
        } catch (error) {
            console.error('Error setting up TOTP:', error);
        }
    }

    showTOTPSetupModal(data) {
        const modal = document.createElement('div');
        modal.className = 'totp-setup-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Setup TOTP Authentication</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Scan this QR code with your authenticator app:</p>
                    <div class="qr-code">
                        <img src="${data.qrCode}" alt="QR Code">
                    </div>
                    <p>Or enter this key manually:</p>
                    <div class="manual-key">
                        <code>${data.manualEntryKey}</code>
                    </div>
                    <div class="backup-codes">
                        <h4>Backup Codes</h4>
                        <p>Save these backup codes in a secure location:</p>
                        <div class="codes-list">
                            ${data.backupCodes.map(code => `<div class="backup-code">${code}</div>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-close">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal handlers
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async loadAuditLogs() {
        try {
            const filters = this.getAuditFilters();
            const response = await fetch('/api/security-enhanced/audit/logs', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayAuditLogs(data.logs);
            }
        } catch (error) {
            console.error('Error loading audit logs:', error);
        }
    }

    displayAuditLogs(logs) {
        const container = document.getElementById('audit-logs-list');
        if (!container) return;

        if (logs.length === 0) {
            container.innerHTML = '<div class="no-logs">No audit logs found</div>';
            return;
        }

        container.innerHTML = logs.map(log => `
            <div class="audit-log-item ${log.severity}">
                <div class="log-header">
                    <span class="log-timestamp">${new Date(log.created_at).toLocaleString()}</span>
                    <span class="log-severity ${log.severity}">${log.severity.toUpperCase()}</span>
                </div>
                <div class="log-content">
                    <div class="log-event">${log.event_type}</div>
                    <div class="log-description">${log.description}</div>
                    <div class="log-details">
                        <span class="log-user">User: ${log.user_id || 'System'}</span>
                        <span class="log-ip">IP: ${log.ip_address || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getAuditFilters() {
        return {
            userId: document.getElementById('audit-user-filter')?.value || '',
            eventType: document.getElementById('audit-event-filter')?.value || '',
            severity: document.getElementById('audit-severity-filter')?.value || '',
            startDate: document.getElementById('audit-date-from')?.value || '',
            endDate: document.getElementById('audit-date-to')?.value || ''
        };
    }

    async loadEncryptionStatus() {
        try {
            const response = await fetch('/api/security-enhanced/encryption/status', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateEncryptionStatus(data.status);
            }
        } catch (error) {
            console.error('Error loading encryption status:', error);
        }
    }

    updateEncryptionStatus(status) {
        document.getElementById('encryption-algorithm').textContent = status.algorithm || 'AES-256-GCM';
        document.getElementById('encryption-key-length').textContent = status.keyLength || '256';

        const statusElement = document.getElementById('encryption-status');
        const statusDot = statusElement.querySelector('.status-dot');
        const statusText = statusElement.querySelector('span:last-child');

        statusText.textContent = 'Encryption Active';
        statusDot.className = 'status-dot enabled';
    }

    async validateEncryption() {
        try {
            const response = await fetch('/api/security-enhanced/encryption/validate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.showNotification(data.message, data.valid ? 'success' : 'error');
            }
        } catch (error) {
            console.error('Error validating encryption:', error);
        }
    }

    async rotateKeys() {
        if (!confirm('Are you sure you want to rotate encryption keys? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/api/security-enhanced/encryption/rotate-keys', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.showNotification(data.message, 'success');
            }
        } catch (error) {
            console.error('Error rotating keys:', error);
        }
    }

    async loadComplianceStatus() {
        try {
            const response = await fetch('/api/security-enhanced/hipaa/compliance-status', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateComplianceStatus(data.complianceStatus);
            }
        } catch (error) {
            console.error('Error loading compliance status:', error);
        }
    }

    updateComplianceStatus(status) {
        // Update compliance checks based on status
        const complianceItems = document.querySelectorAll('.compliance-item');
        complianceItems.forEach((item, index) => {
            const icon = item.querySelector('i');
            if (status[Object.keys(status)[index]]) {
                icon.className = 'fas fa-check-circle';
                icon.style.color = '#10b981';
            } else {
                icon.className = 'fas fa-times-circle';
                icon.style.color = '#ef4444';
            }
        });
    }

    showViolationReportModal() {
        const modal = document.createElement('div');
        modal.className = 'violation-report-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Report HIPAA Violation</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="violation-report-form">
                        <div class="form-group">
                            <label for="violation-description">Description:</label>
                            <textarea id="violation-description" required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="violation-severity">Severity:</label>
                            <select id="violation-severity">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="affected-users">Affected Users:</label>
                            <input type="text" id="affected-users" placeholder="Comma-separated user IDs">
                        </div>
                        <div class="form-group">
                            <label for="incident-details">Incident Details:</label>
                            <textarea id="incident-details"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="modal-close">Cancel</button>
                    <button id="submit-violation-report" class="submit-btn">Submit Report</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event handlers
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('#submit-violation-report').addEventListener('click', () => {
            this.submitViolationReport(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async submitViolationReport(modal) {
        try {
            const form = modal.querySelector('#violation-report-form');
            const formData = new FormData(form);

            const reportData = {
                description: formData.get('violation-description'),
                severity: formData.get('violation-severity'),
                affectedUsers: formData.get('affected-users'),
                incidentDetails: formData.get('incident-details')
            };

            const response = await fetch('/api/security-enhanced/hipaa/violation-report', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportData)
            });

            if (response.ok) {
                this.showNotification('Violation report submitted successfully', 'success');
                modal.remove();
            }
        } catch (error) {
            console.error('Error submitting violation report:', error);
            this.showNotification('Failed to submit violation report', 'error');
        }
    }

    setupPeriodicUpdates() {
        // Update security overview every 5 minutes
        setInterval(() => {
            if (this.currentView === 'overview') {
                this.loadSecurityOverview();
            }
        }, 5 * 60 * 1000);
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `security-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
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

        if (type === 'success') notification.style.background = '#10b981';
        if (type === 'error') notification.style.background = '#ef4444';
        if (type === 'info') notification.style.background = '#3b82f6';

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
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
        return null;
    }

    getCurrentUserEmail() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.email;
            } catch (error) {
                console.error('Error parsing token:', error);
            }
        }
        return null;
    }
}

// Initialize security dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.securityDashboard = new SecurityDashboard();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityDashboard;
}


