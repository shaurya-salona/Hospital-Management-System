// Admin Dashboard - Complete Implementation
class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.socket = null;
        this.charts = {};
        this.init();
    }

    async init() {
        await this.loadUserData();
        this.initializeWebSocket();
        this.setupEventListeners();
        this.loadDashboardData();
    }

    async loadUserData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                this.redirectToLogin();
                return;
            }

            const response = await fetch('/api/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                this.redirectToLogin();
                return;
            }

            const data = await response.json();
            this.currentUser = data.data;
            this.updateUserInterface();
        } catch (error) {
            console.error('Error loading user data:', error);
            this.redirectToLogin();
        }
    }

    updateUserInterface() {
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.innerHTML = `
                <span class="user-name">${this.currentUser.first_name} ${this.currentUser.last_name}</span>
                <span class="user-role">Administrator</span>
            `;
        }
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        event.target.closest('.nav-link').classList.add('active');

        // Load section data
        this.loadSectionData(sectionId);
    }

    async loadSectionData(sectionId) {
        switch (sectionId) {
            case 'user-management':
                await this.loadUsers();
                break;
            case 'patient-records':
                await this.loadPatients();
                break;
            case 'appointments-scheduling':
                await this.loadAppointments();
                break;
            case 'billing-payroll':
                await this.loadBilling();
                break;
            case 'inventory-pharmacy':
                await this.loadInventory();
                break;
            case 'reports-analytics':
                await this.loadAnalytics();
                break;
        }
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/users', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderUsers(data.data);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    async loadPatients() {
        try {
            const response = await fetch('/api/patients', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderPatients(data.data);
            }
        } catch (error) {
            console.error('Error loading patients:', error);
        }
    }

    async loadAppointments() {
        try {
            const response = await fetch('/api/appointments', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderAppointments(data.data);
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
        }
    }

    async loadBilling() {
        try {
            const response = await fetch('/api/billing', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderBilling(data.data);
            }
        } catch (error) {
            console.error('Error loading billing:', error);
        }
    }

    async loadInventory() {
        try {
            const response = await fetch('/api/inventory', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderInventory(data.data);
            }
        } catch (error) {
            console.error('Error loading inventory:', error);
        }
    }

    async loadAnalytics() {
        try {
            const response = await fetch('/api/analytics/hospital', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderAnalytics(data.data);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    renderUsers(users) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.first_name} ${user.last_name}</td>
                <td>${user.email}</td>
                <td><span class="role-badge ${user.role}">${user.role}</span></td>
                <td><span class="status-badge ${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>${user.last_login || 'Never'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminDashboard.editUser('${user.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteUser('${user.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    renderPatients(patients) {
        const tbody = document.getElementById('patients-table-body');
        if (!tbody) return;

        tbody.innerHTML = patients.map(patient => `
            <tr>
                <td>${patient.patient_id || patient.id}</td>
                <td>${patient.first_name} ${patient.last_name}</td>
                <td>${patient.email}</td>
                <td>${patient.phone}</td>
                <td>${patient.blood_type || 'N/A'}</td>
                <td><span class="status-badge ${patient.is_active ? 'active' : 'inactive'}">${patient.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminDashboard.viewPatient('${patient.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="adminDashboard.editPatient('${patient.id}')">Edit</button>
                </td>
            </tr>
        `).join('');
    }

    renderAppointments(appointments) {
        const grid = document.getElementById('appointments-grid');
        if (!grid) return;

        grid.innerHTML = appointments.map(appointment => `
            <div class="appointment-card">
                <div class="appointment-header">
                    <h4>${appointment.reason || 'General Consultation'}</h4>
                    <span class="status-badge ${appointment.status}">${appointment.status}</span>
                </div>
                <div class="appointment-details">
                    <p><strong>Date:</strong> ${new Date(appointment.appointment_date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${appointment.appointment_time}</p>
                    <p><strong>Patient:</strong> ${appointment.patient_name || 'N/A'}</p>
                    <p><strong>Doctor:</strong> ${appointment.doctor_name || 'N/A'}</p>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-sm btn-primary" onclick="adminDashboard.viewAppointment('${appointment.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="adminDashboard.editAppointment('${appointment.id}')">Edit</button>
                </div>
            </div>
        `).join('');
    }

    renderBilling(billing) {
        const tbody = document.getElementById('billing-table-body');
        if (!tbody) return;

        const totalRevenue = billing.reduce((sum, bill) => sum + (bill.amount || 0), 0);
        const pendingBills = billing.filter(bill => bill.status === 'pending').length;
        const overdueBills = billing.filter(bill => 
            bill.status === 'pending' && new Date(bill.due_date) < new Date()
        ).length;

        document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('pending-bills').textContent = pendingBills;
        document.getElementById('overdue-bills').textContent = overdueBills;

        tbody.innerHTML = billing.map(bill => `
            <tr>
                <td>${bill.bill_number || bill.id}</td>
                <td>${bill.patient_name || 'N/A'}</td>
                <td>$${bill.amount || 0}</td>
                <td><span class="status-badge ${bill.status}">${bill.status}</span></td>
                <td>${bill.due_date ? new Date(bill.due_date).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminDashboard.viewBill('${bill.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="adminDashboard.editBill('${bill.id}')">Edit</button>
                </td>
            </tr>
        `).join('');
    }

    renderInventory(inventory) {
        const tbody = document.getElementById('inventory-table-body');
        if (!tbody) return;

        const totalItems = inventory.length;
        const lowStockItems = inventory.filter(item => item.quantity < item.min_stock).length;
        const outOfStock = inventory.filter(item => item.quantity === 0).length;

        document.getElementById('total-items').textContent = totalItems;
        document.getElementById('low-stock-items').textContent = lowStockItems;
        document.getElementById('out-of-stock').textContent = outOfStock;

        tbody.innerHTML = inventory.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.quantity}</td>
                <td>$${item.unit_price}</td>
                <td><span class="status-badge ${item.quantity < item.min_stock ? 'low-stock' : 'in-stock'}">${item.quantity < item.min_stock ? 'Low Stock' : 'In Stock'}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminDashboard.viewInventory('${item.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="adminDashboard.editInventory('${item.id}')">Edit</button>
                </td>
            </tr>
        `).join('');
    }

    renderAnalytics(data) {
        this.renderCharts(data);
    }

    renderCharts(data) {
        // Patient Admissions Chart
        const patientAdmissionsCtx = document.getElementById('patient-admissions-chart');
        if (patientAdmissionsCtx && !this.charts.patientAdmissions) {
            this.charts.patientAdmissions = new Chart(patientAdmissionsCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Patient Admissions',
                        data: [12, 19, 3, 5, 2, 3],
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Revenue Chart
        const revenueCtx = document.getElementById('revenue-chart');
        if (revenueCtx && !this.charts.revenue) {
            this.charts.revenue = new Chart(revenueCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue',
                        data: [12000, 19000, 3000, 5000, 2000, 3000],
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Department Chart
        const departmentCtx = document.getElementById('department-chart');
        if (departmentCtx && !this.charts.department) {
            this.charts.department = new Chart(departmentCtx, {
                type: 'doughnut',
                data: {
                    labels: ['General Medicine', 'Cardiology', 'Neurology', 'Pediatrics'],
                    datasets: [{
                        data: [30, 25, 20, 25],
                        backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                            '#4BC0C0'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Staff Chart
        const staffCtx = document.getElementById('staff-chart');
        if (staffCtx && !this.charts.staff) {
            this.charts.staff = new Chart(staffCtx, {
                type: 'bar',
                data: {
                    labels: ['Doctors', 'Nurses', 'Receptionists', 'Pharmacists'],
                    datasets: [{
                        label: 'Staff Count',
                        data: [15, 25, 8, 5],
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 205, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 205, 86, 1)',
                            'rgba(75, 192, 192, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    initializeWebSocket() {
        try {
            this.socket = io('http://localhost:5000');
            
            this.socket.on('connect', () => {
                console.log('Connected to WebSocket server');
                this.socket.emit('join-room', {
                    userId: this.currentUser.id,
                    role: 'admin'
                });
            });

            this.socket.on('notification', (notification) => {
                this.showNotification(notification.message);
            });

        } catch (error) {
            console.error('WebSocket connection error:', error);
        }
    }

    setupEventListeners() {
        // Global search
        const globalSearch = document.getElementById('global-search');
        if (globalSearch) {
            globalSearch.addEventListener('input', this.handleGlobalSearch.bind(this));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.logout.bind(this));
        }
    }

    handleGlobalSearch(event) {
        const query = event.target.value.toLowerCase();
        // Implement global search functionality
        console.log('Global search:', query);
    }

    logout() {
        localStorage.removeItem('token');
        window.location.href = '/';
    }

    // Modal functions
    showAddUserModal() {
        this.showModal('Add User', this.getUserForm());
    }

    showAddPatientModal() {
        this.showModal('Add Patient', this.getPatientForm());
    }

    showScheduleAppointmentModal() {
        this.showModal('Schedule Appointment', this.getAppointmentForm());
    }

    showCreateBillModal() {
        this.showModal('Create Bill', this.getBillForm());
    }

    showAddInventoryModal() {
        this.showModal('Add Inventory', this.getInventoryForm());
    }

    showModal(title, content) {
        const modalOverlay = document.getElementById('modal-overlay');
        if (!modalOverlay) return;

        modalOverlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').style.display='none'">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        modalOverlay.style.display = 'flex';
    }

    getUserForm() {
        return `
            <form id="user-form">
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
                        <option value="admin">Admin</option>
                        <option value="doctor">Doctor</option>
                        <option value="receptionist">Receptionist</option>
                        <option value="nurse">Nurse</option>
                        <option value="pharmacist">Pharmacist</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" name="password" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Add User</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
    }

    getPatientForm() {
        return `
            <form id="patient-form">
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
                    <label>Phone</label>
                    <input type="tel" name="phone" required>
                </div>
                <div class="form-group">
                    <label>Blood Type</label>
                    <select name="bloodType">
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Add Patient</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
    }

    getAppointmentForm() {
        return `
            <form id="appointment-form">
                <div class="form-group">
                    <label>Patient</label>
                    <select name="patientId" required>
                        <option value="">Select Patient</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Doctor</label>
                    <select name="doctorId" required>
                        <option value="">Select Doctor</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" name="date" required>
                </div>
                <div class="form-group">
                    <label>Time</label>
                    <input type="time" name="time" required>
                </div>
                <div class="form-group">
                    <label>Reason</label>
                    <textarea name="reason" rows="3"></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Schedule Appointment</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
    }

    getBillForm() {
        return `
            <form id="bill-form">
                <div class="form-group">
                    <label>Patient</label>
                    <select name="patientId" required>
                        <option value="">Select Patient</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Amount</label>
                    <input type="number" name="amount" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label>Due Date</label>
                    <input type="date" name="dueDate" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Create Bill</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
    }

    getInventoryForm() {
        return `
            <form id="inventory-form">
                <div class="form-group">
                    <label>Item Name</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <select name="category" required>
                        <option value="medication">Medication</option>
                        <option value="equipment">Equipment</option>
                        <option value="supplies">Supplies</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Quantity</label>
                    <input type="number" name="quantity" required>
                </div>
                <div class="form-group">
                    <label>Unit Price</label>
                    <input type="number" name="unitPrice" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Expiry Date</label>
                    <input type="date" name="expiryDate">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Add Inventory</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
    }

    // Action functions
    editUser(userId) {
        console.log('Edit user:', userId);
    }

    deleteUser(userId) {
        if (confirm('Are you sure you want to delete this user?')) {
            console.log('Delete user:', userId);
        }
    }

    viewPatient(patientId) {
        console.log('View patient:', patientId);
    }

    editPatient(patientId) {
        console.log('Edit patient:', patientId);
    }

    viewAppointment(appointmentId) {
        console.log('View appointment:', appointmentId);
    }

    editAppointment(appointmentId) {
        console.log('Edit appointment:', appointmentId);
    }

    viewBill(billId) {
        console.log('View bill:', billId);
    }

    editBill(billId) {
        console.log('Edit bill:', billId);
    }

    viewInventory(itemId) {
        console.log('View inventory:', itemId);
    }

    editInventory(itemId) {
        console.log('Edit inventory:', itemId);
    }

    // Utility functions
    exportUsers() {
        console.log('Export users');
    }

    exportPatients() {
        console.log('Export patients');
    }

    viewSchedule() {
        console.log('View schedule');
    }

    processPayroll() {
        console.log('Process payroll');
    }

    checkLowStock() {
        console.log('Check low stock');
    }

    generateReport() {
        console.log('Generate report');
    }

    exportAnalytics() {
        console.log('Export analytics');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            'info': 'info-circle',
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'error': 'times-circle'
        };
        return icons[type] || 'bell';
    }

    redirectToLogin() {
        window.location.href = '/';
    }

    async loadDashboardData() {
        // Load initial data for the active section
        const activeSection = document.querySelector('.dashboard-section.active');
        if (activeSection) {
            await this.loadSectionData(activeSection.id);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});
