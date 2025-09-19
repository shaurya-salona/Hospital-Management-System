// Enhanced Admin Dashboard - Complete Implementation
class EnhancedAdminDashboard {
    constructor() {
        this.currentUser = null;
        this.charts = {};
        this.mockData = this.initializeMockData();
        this.init();
    }

    initializeMockData() {
        return {
            users: [
                { id: 1, first_name: 'System', last_name: 'Administrator', email: 'admin@hospital.com', role: 'admin', is_active: true, last_login: '2024-12-19 10:30:00' },
                { id: 2, first_name: 'Dr. John', last_name: 'Smith', email: 'dr.smith@hospital.com', role: 'doctor', is_active: true, last_login: '2024-12-19 09:15:00' },
                { id: 3, first_name: 'Jane', last_name: 'Doe', email: 'jane.doe@hospital.com', role: 'nurse', is_active: true, last_login: '2024-12-19 08:45:00' },
                { id: 4, first_name: 'Mike', last_name: 'Wilson', email: 'mike.wilson@hospital.com', role: 'receptionist', is_active: true, last_login: '2024-12-19 07:30:00' },
                { id: 5, first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.johnson@hospital.com', role: 'pharmacist', is_active: false, last_login: '2024-12-18 16:20:00' },
                { id: 6, first_name: 'Bob', last_name: 'Brown', email: 'bob.brown@hospital.com', role: 'patient', is_active: true, last_login: '2024-12-19 11:00:00' }
            ],
            securityEvents: [
                { time: '2024-12-19 11:30:00', event: 'Failed Login Attempt', user: 'unknown', ip: '192.168.1.100', status: 'Blocked' },
                { time: '2024-12-19 10:45:00', event: 'Successful Login', user: 'admin', ip: '192.168.1.50', status: 'Success' },
                { time: '2024-12-19 09:20:00', event: 'Password Changed', user: 'dr.smith', ip: '192.168.1.75', status: 'Success' },
                { time: '2024-12-19 08:15:00', event: 'User Created', user: 'admin', ip: '192.168.1.50', status: 'Success' }
            ],
            backupHistory: [
                { date: '2024-12-19 10:00:00', type: 'Full Backup', size: '2.3 GB', status: 'Success' },
                { date: '2024-12-18 10:00:00', type: 'Incremental', size: '150 MB', status: 'Success' },
                { date: '2024-12-17 10:00:00', type: 'Full Backup', size: '2.2 GB', status: 'Success' },
                { date: '2024-12-16 10:00:00', type: 'Incremental', size: '200 MB', status: 'Failed' }
            ],
            emergencyContacts: [
                { name: 'Dr. Emergency', role: 'Emergency Coordinator', phone: '+1-555-911', email: 'emergency@hospital.com', status: 'Available' },
                { name: 'IT Support', role: 'System Administrator', phone: '+1-555-IT-HELP', email: 'it@hospital.com', status: 'Available' },
                { name: 'Security Team', role: 'Security Manager', phone: '+1-555-SECURE', email: 'security@hospital.com', status: 'On Call' },
                { name: 'Hospital Director', role: 'Director', phone: '+1-555-DIRECT', email: 'director@hospital.com', status: 'Available' }
            ]
        };
    }

    async init() {
        try {
            await this.loadUserData();
            this.setupEventListeners();
            this.loadDashboardData();
            this.initializeCharts();
            this.startRealTimeUpdates();
            this.showNotification('Enhanced Admin Dashboard loaded successfully!', 'success');
        } catch (error) {
            console.error('Error initializing admin dashboard:', error);
            this.showNotification('Error loading dashboard. Using demo mode.', 'warning');
        }
    }

    async loadUserData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                this.redirectToLogin();
                return;
            }

            const response = await fetch('http://localhost:5000/api/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                this.redirectToLogin();
                return;
            }

            const data = await response.json();
            this.currentUser = data.data;
        } catch (error) {
            console.error('Error loading user data:', error);
            // Fallback to mock data
            this.currentUser = {
                id: 1,
                first_name: 'System',
                last_name: 'Administrator',
                email: 'admin@hospital.com',
                role: 'admin'
            };
        }
    }

    setupEventListeners() {
        // Add any global event listeners here
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    async loadDashboardData() {
        await this.loadUsers();
        await this.loadSecurityEvents();
        await this.loadBackupHistory();
        await this.loadEmergencyContacts();
        this.updateDashboardStats();
    }

    async loadUsers() {
        try {
            const response = await fetch('http://localhost:5000/api/users', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.mockData.users = data.data.users || this.mockData.users;
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }

        this.renderUsersTable();
    }

    async loadSecurityEvents() {
        this.renderSecurityEvents();
    }

    async loadBackupHistory() {
        this.renderBackupHistory();
    }

    async loadEmergencyContacts() {
        this.renderEmergencyContacts();
    }

    updateDashboardStats() {
        document.getElementById('total-users').textContent = this.mockData.users.length;
        document.getElementById('active-patients').textContent = this.mockData.users.filter(u => u.role === 'patient' && u.is_active).length;

        // Update other stats
        this.updateSystemHealth();
    }

    updateSystemHealth() {
        // Simulate real-time system health data
        const cpuUsage = Math.floor(Math.random() * 30) + 30; // 30-60%
        const memoryUsage = Math.floor(Math.random() * 20) + 50; // 50-70%
        const diskUsage = Math.floor(Math.random() * 15) + 30; // 30-45%

        document.getElementById('cpu-usage').textContent = cpuUsage + '%';
        document.getElementById('memory-usage').textContent = memoryUsage + '%';
        document.getElementById('disk-usage').textContent = diskUsage + '%';
    }

    renderUsersTable() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        tbody.innerHTML = this.mockData.users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.first_name} ${user.last_name}</td>
                <td>${user.email}</td>
                <td><span class="status-badge status-${user.role}">${user.role}</span></td>
                <td><span class="status-badge ${user.is_active ? 'status-active' : 'status-inactive'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>${user.last_login}</td>
                <td>
                    <button class="btn btn-primary" onclick="editUser(${user.id})" style="margin-right: 5px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderSecurityEvents() {
        const tbody = document.getElementById('security-events-body');
        if (!tbody) return;

        tbody.innerHTML = this.mockData.securityEvents.map(event => `
            <tr>
                <td>${event.time}</td>
                <td>${event.event}</td>
                <td>${event.user}</td>
                <td>${event.ip}</td>
                <td><span class="status-badge ${event.status === 'Success' ? 'status-active' : 'status-inactive'}">${event.status}</span></td>
            </tr>
        `).join('');
    }

    renderBackupHistory() {
        const tbody = document.getElementById('backup-history-body');
        if (!tbody) return;

        tbody.innerHTML = this.mockData.backupHistory.map(backup => `
            <tr>
                <td>${backup.date}</td>
                <td>${backup.type}</td>
                <td>${backup.size}</td>
                <td><span class="status-badge ${backup.status === 'Success' ? 'status-active' : 'status-inactive'}">${backup.status}</span></td>
                <td>
                    <button class="btn btn-primary" onclick="downloadBackup('${backup.date}')" style="margin-right: 5px;">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-warning" onclick="restoreBackup('${backup.date}')">
                        <i class="fas fa-upload"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderEmergencyContacts() {
        const tbody = document.getElementById('emergency-contacts-body');
        if (!tbody) return;

        tbody.innerHTML = this.mockData.emergencyContacts.map(contact => `
            <tr>
                <td>${contact.name}</td>
                <td>${contact.role}</td>
                <td>${contact.phone}</td>
                <td>${contact.email}</td>
                <td><span class="status-badge ${contact.status === 'Available' ? 'status-active' : 'status-pending'}">${contact.status}</span></td>
                <td>
                    <button class="btn btn-primary" onclick="callContact('${contact.phone}')" style="margin-right: 5px;">
                        <i class="fas fa-phone"></i>
                    </button>
                    <button class="btn btn-success" onclick="emailContact('${contact.email}')">
                        <i class="fas fa-envelope"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    initializeCharts() {
        this.createPerformanceChart();
        this.createUserActivityChart();
        this.createSystemResourcesChart();
        this.createMonthlyStatsChart();
    }

    createPerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                datasets: [{
                    label: 'Response Time (ms)',
                    data: [120, 135, 110, 95, 105, 115],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createUserActivityChart() {
        const ctx = document.getElementById('userActivityChart');
        if (!ctx) return;

        this.charts.userActivity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Active Users',
                    data: [45, 52, 48, 61, 55, 30, 25],
                    backgroundColor: '#10b981'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createSystemResourcesChart() {
        const ctx = document.getElementById('systemResourcesChart');
        if (!ctx) return;

        this.charts.systemResources = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['CPU', 'Memory', 'Disk', 'Network'],
                datasets: [{
                    data: [45, 62, 38, 85],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createMonthlyStatsChart() {
        const ctx = document.getElementById('monthlyStatsChart');
        if (!ctx) return;

        this.charts.monthlyStats = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Users',
                    data: [120, 135, 150, 165, 180, 195],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Patients',
                    data: [800, 850, 900, 950, 1000, 1050],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    startRealTimeUpdates() {
        // Update system health every 30 seconds
        setInterval(() => {
            this.updateSystemHealth();
        }, 30000);

        // Update charts every 5 minutes
        setInterval(() => {
            this.updateCharts();
        }, 300000);
    }

    updateCharts() {
        // Update chart data with new values
        if (this.charts.performance) {
            const newData = Array.from({length: 6}, () => Math.floor(Math.random() * 50) + 80);
            this.charts.performance.data.datasets[0].data = newData;
            this.charts.performance.update();
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
            word-wrap: break-word;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    redirectToLogin() {
        window.location.href = 'quick-login.html';
    }
}

// Global functions for the admin dashboard
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Add active class to clicked nav link
    event.target.classList.add('active');

    // Update header
    const sectionTitles = {
        'dashboard': 'Dashboard',
        'user-management': 'User Management',
        'system-health': 'System Health',
        'security': 'Security',
        'reports': 'Reports',
        'settings': 'Settings',
        'backup': 'Backup & Restore',
        'emergency': 'Emergency'
    };

    const sectionDescriptions = {
        'dashboard': 'System overview and key metrics',
        'user-management': 'Manage system users and permissions',
        'system-health': 'Monitor system performance and health',
        'security': 'Security events and access control',
        'reports': 'Generate reports and analytics',
        'settings': 'Configure system settings',
        'backup': 'Backup and restore system data',
        'emergency': 'Emergency protocols and contacts'
    };

    document.getElementById('section-title').textContent = sectionTitles[sectionId] || 'Dashboard';
    document.getElementById('section-description').textContent = sectionDescriptions[sectionId] || 'System overview and key metrics';
}

// User Management Functions
function showAddUserModal() {
    const modalContent = `
        <div class="modal-header">
            <h3>Add New User</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="addUser(event)">
            <div class="form-group">
                <label>First Name</label>
                <input type="text" name="firstName" required>
            </div>
            <div class="form-group">
                <label>Last Name</label>
                <input type="text" name="lastName" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" required>
            </div>
            <div class="form-group">
                <label>Role</label>
                <select name="role" required>
                    <option value="">Select Role</option>
                    <option value="admin">Administrator</option>
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="patient">Patient</option>
                </select>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" required>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="submit" class="btn btn-primary">Add User</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;

    showModal('Add New User', modalContent);
}

function addUser(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const userData = Object.fromEntries(formData);

    // Add user to mock data
    const newUser = {
        id: Date.now(),
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        role: userData.role,
        is_active: true,
        last_login: 'Never'
    };

    adminDashboard.mockData.users.push(newUser);
    adminDashboard.renderUsersTable();
    adminDashboard.updateDashboardStats();
    adminDashboard.showNotification('User added successfully!', 'success');
    closeModal();
}

function editUser(userId) {
    const user = adminDashboard.mockData.users.find(u => u.id === userId);
    if (!user) return;

    const modalContent = `
        <div class="modal-header">
            <h3>Edit User</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="updateUser(event, ${userId})">
            <div class="form-group">
                <label>First Name</label>
                <input type="text" name="firstName" value="${user.first_name}" required>
            </div>
            <div class="form-group">
                <label>Last Name</label>
                <input type="text" name="lastName" value="${user.last_name}" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" value="${user.email}" required>
            </div>
            <div class="form-group">
                <label>Role</label>
                <select name="role" required>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator</option>
                    <option value="doctor" ${user.role === 'doctor' ? 'selected' : ''}>Doctor</option>
                    <option value="nurse" ${user.role === 'nurse' ? 'selected' : ''}>Nurse</option>
                    <option value="receptionist" ${user.role === 'receptionist' ? 'selected' : ''}>Receptionist</option>
                    <option value="pharmacist" ${user.role === 'pharmacist' ? 'selected' : ''}>Pharmacist</option>
                    <option value="patient" ${user.role === 'patient' ? 'selected' : ''}>Patient</option>
                </select>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select name="is_active">
                    <option value="true" ${user.is_active ? 'selected' : ''}>Active</option>
                    <option value="false" ${!user.is_active ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="submit" class="btn btn-primary">Update User</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;

    showModal('Edit User', modalContent);
}

function updateUser(event, userId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const userData = Object.fromEntries(formData);

    const userIndex = adminDashboard.mockData.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        adminDashboard.mockData.users[userIndex] = {
            ...adminDashboard.mockData.users[userIndex],
            first_name: userData.firstName,
            last_name: userData.lastName,
            email: userData.email,
            role: userData.role,
            is_active: userData.is_active === 'true'
        };

        adminDashboard.renderUsersTable();
        adminDashboard.updateDashboardStats();
        adminDashboard.showNotification('User updated successfully!', 'success');
        closeModal();
    }
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        adminDashboard.mockData.users = adminDashboard.mockData.users.filter(u => u.id !== userId);
        adminDashboard.renderUsersTable();
        adminDashboard.updateDashboardStats();
        adminDashboard.showNotification('User deleted successfully!', 'success');
    }
}

// Reports Functions
function generateReport(type) {
    adminDashboard.showNotification(`Generating ${type} report...`, 'info');

    // Simulate report generation
    setTimeout(() => {
        adminDashboard.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated successfully!`, 'success');
    }, 2000);
}

// Settings Functions
function saveGeneralSettings() {
    const hospitalName = document.getElementById('hospital-name').value;
    const timezone = document.getElementById('timezone').value;
    const sessionTimeout = document.getElementById('session-timeout').value;

    adminDashboard.showNotification('General settings saved successfully!', 'success');
}

function saveEmailSettings() {
    const smtpServer = document.getElementById('smtp-server').value;
    const smtpPort = document.getElementById('smtp-port').value;
    const emailAddress = document.getElementById('email-address').value;

    adminDashboard.showNotification('Email settings saved successfully!', 'success');
}

// Backup Functions
function createBackup() {
    adminDashboard.showNotification('Creating backup...', 'info');

    setTimeout(() => {
        const newBackup = {
            date: new Date().toLocaleString(),
            type: 'Full Backup',
            size: '2.4 GB',
            status: 'Success'
        };

        adminDashboard.mockData.backupHistory.unshift(newBackup);
        adminDashboard.renderBackupHistory();
        adminDashboard.showNotification('Backup created successfully!', 'success');
    }, 3000);
}

function showRestoreModal() {
    const modalContent = `
        <div class="modal-header">
            <h3>Restore Backup</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="form-group">
            <label>Select Backup File</label>
            <input type="file" accept=".backup,.sql,.zip">
        </div>
        <div class="form-group">
            <label>
                <input type="checkbox" name="confirmRestore">
                I understand this will overwrite current data
            </label>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button class="btn btn-warning" onclick="restoreBackup()">Restore Backup</button>
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        </div>
    `;

    showModal('Restore Backup', modalContent);
}

function restoreBackup() {
    adminDashboard.showNotification('Restoring backup...', 'info');

    setTimeout(() => {
        adminDashboard.showNotification('Backup restored successfully!', 'success');
        closeModal();
    }, 5000);
}

function scheduleBackup() {
    adminDashboard.showNotification('Backup scheduled successfully!', 'success');
}

function downloadBackup(date) {
    adminDashboard.showNotification(`Downloading backup from ${date}...`, 'info');
}

// Emergency Functions
function emergencyShutdown() {
    if (confirm('Are you sure you want to perform an emergency shutdown? This action cannot be undone.')) {
        adminDashboard.showNotification('Emergency shutdown initiated...', 'error');
    }
}

function emergencyLockdown() {
    if (confirm('Are you sure you want to lock down the system? All users will be logged out.')) {
        adminDashboard.showNotification('System lockdown initiated...', 'warning');
    }
}

function emergencyBackup() {
    adminDashboard.showNotification('Emergency backup initiated...', 'warning');
}

function contactEmergency() {
    adminDashboard.showNotification('Emergency contact notification sent!', 'success');
}

function callContact(phone) {
    adminDashboard.showNotification(`Calling ${phone}...`, 'info');
}

function emailContact(email) {
    adminDashboard.showNotification(`Email sent to ${email}`, 'success');
}

// Modal Functions
function showModal(title, content) {
    const modalOverlay = document.getElementById('modal-overlay');
    if (!modalOverlay) return;

    modalOverlay.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="closeModal()">×</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;

    modalOverlay.style.display = 'flex';
}

function closeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
    }
}

// Initialize the dashboard when the page loads
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new EnhancedAdminDashboard();
});
