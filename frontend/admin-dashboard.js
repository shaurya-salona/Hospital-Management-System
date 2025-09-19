// Admin Dashboard - Complete Implementation
class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.socket = null;
        this.charts = {};
        this.mockData = this.initializeMockData();
        this.init();
    }

    initializeMockData() {
        return {
            users: [
                { id: 1, first_name: 'System', last_name: 'Administrator', email: 'admin@hospital.com', role: 'admin', is_active: true, last_login: 'Never' },
                { id: 2, first_name: 'Dr. John', last_name: 'Smith', email: 'dr.smith@hospital.com', role: 'doctor', is_active: true, last_login: 'Never' },
                { id: 3, first_name: 'Jane', last_name: 'Doe', email: 'patient@hospital.com', role: 'patient', is_active: true, last_login: 'Never' },
                { id: 4, first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.j@hospital.com', role: 'nurse', is_active: true, last_login: '2024-01-15' },
                { id: 5, first_name: 'Mike', last_name: 'Wilson', email: 'mike.w@hospital.com', role: 'receptionist', is_active: false, last_login: '2024-01-10' }
            ],
            patients: [
                { id: 1, patient_id: 'P001', first_name: 'Alice', last_name: 'Brown', email: 'alice.brown@email.com', phone: '+1-555-0101', blood_type: 'A+', is_active: true },
                { id: 2, patient_id: 'P002', first_name: 'Bob', last_name: 'Green', email: 'bob.green@email.com', phone: '+1-555-0102', blood_type: 'B-', is_active: true },
                { id: 3, patient_id: 'P003', first_name: 'Carol', last_name: 'White', email: 'carol.white@email.com', phone: '+1-555-0103', blood_type: 'O+', is_active: false }
            ],
            appointments: [
                { id: 1, reason: 'General Checkup', status: 'scheduled', appointment_date: '2024-01-20', appointment_time: '10:00', patient_name: 'Alice Brown', doctor_name: 'Dr. John Smith' },
                { id: 2, reason: 'Follow-up Visit', status: 'confirmed', appointment_date: '2024-01-21', appointment_time: '14:30', patient_name: 'Bob Green', doctor_name: 'Dr. Sarah Johnson' },
                { id: 3, reason: 'Emergency Consultation', status: 'completed', appointment_date: '2024-01-19', appointment_time: '09:15', patient_name: 'Carol White', doctor_name: 'Dr. John Smith' }
            ],
            billing: [
                { id: 1, bill_number: 'B001', patient_name: 'Alice Brown', amount: 150.00, status: 'paid', due_date: '2024-01-15' },
                { id: 2, bill_number: 'B002', patient_name: 'Bob Green', amount: 275.50, status: 'pending', due_date: '2024-01-25' },
                { id: 3, bill_number: 'B003', patient_name: 'Carol White', amount: 89.99, status: 'overdue', due_date: '2024-01-10' }
            ],
            inventory: [
                { id: 1, name: 'Paracetamol 500mg', category: 'medication', quantity: 150, unit_price: 2.50, min_stock: 50 },
                { id: 2, name: 'Blood Pressure Monitor', category: 'equipment', quantity: 8, unit_price: 89.99, min_stock: 10 },
                { id: 3, name: 'Surgical Gloves', category: 'supplies', quantity: 5, unit_price: 0.25, min_stock: 20 }
            ]
        };
    }

    async init() {
        try {
            await this.loadUserData();
            this.setupEventListeners();
            this.loadDashboardData();
            this.startRealTimeClock();
            this.initializeCharts();
            this.showNotification('Admin Dashboard loaded successfully!', 'success');
        } catch (error) {
            console.error('Error initializing admin dashboard:', error);
            this.showNotification('Error loading dashboard. Using demo mode.', 'warning');
        }
    }

    async loadUserData() {
        try {
            // Try to load from API first
            const userData = await dashboardCommon.apiRequest('/api/auth/profile');

            if (userData) {
                this.currentUser = userData;
            } else {
                // Fallback to mock data
                this.currentUser = {
                    id: 1,
                    first_name: 'System',
                    last_name: 'Administrator',
                    email: 'admin@hospital.com',
                    role: 'admin'
                };
            }
            this.updateUserInterface();
        } catch (error) {
            console.error('Error loading user data:', error);
            this.showNotification('Error loading user data', 'error');
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

        // Find the clicked nav link and make it active
        const clickedLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
        if (clickedLink) {
            clickedLink.classList.add('active');
        }

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
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500));
            this.renderUsers(this.mockData.users);
        } catch (error) {
            console.error('Error loading users:', error);
            this.showNotification('Error loading users', 'error');
        }
    }

    async loadPatients() {
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            this.renderPatients(this.mockData.patients);
        } catch (error) {
            console.error('Error loading patients:', error);
            this.showNotification('Error loading patients', 'error');
        }
    }

    async loadAppointments() {
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            this.renderAppointments(this.mockData.appointments);
        } catch (error) {
            console.error('Error loading appointments:', error);
            this.showNotification('Error loading appointments', 'error');
        }
    }

    async loadBilling() {
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            this.renderBilling(this.mockData.billing);
        } catch (error) {
            console.error('Error loading billing:', error);
            this.showNotification('Error loading billing data', 'error');
        }
    }

    async loadInventory() {
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            this.renderInventory(this.mockData.inventory);
        } catch (error) {
            console.error('Error loading inventory:', error);
            this.showNotification('Error loading inventory', 'error');
        }
    }

    async loadAnalytics() {
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            this.renderAnalytics({});
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showNotification('Error loading analytics', 'error');
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
                    <button class="action-btn edit" onclick="adminDashboard.editUser('${user.id}')">Edit</button>
                    <button class="action-btn delete" onclick="adminDashboard.deleteUser('${user.id}')">Delete</button>
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
                    <button class="action-btn edit" onclick="adminDashboard.viewPatient('${patient.id}')">View</button>
                    <button class="action-btn delete" onclick="adminDashboard.editPatient('${patient.id}')">Edit</button>
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
                    <button class="action-btn edit" onclick="adminDashboard.viewAppointment('${appointment.id}')">View</button>
                    <button class="action-btn delete" onclick="adminDashboard.editAppointment('${appointment.id}')">Edit</button>
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

        document.getElementById('total-revenue').textContent = dashboardCommon.formatCurrency(totalRevenue);
        document.getElementById('pending-bills').textContent = pendingBills;
        document.getElementById('overdue-bills').textContent = overdueBills;
        document.getElementById('payroll-total').textContent = dashboardCommon.formatCurrency(totalRevenue * 0.3);

        tbody.innerHTML = billing.map(bill => `
            <tr>
                <td>${bill.bill_number || bill.id}</td>
                <td>${bill.patient_name || 'N/A'}</td>
                <td>${dashboardCommon.formatCurrency(bill.amount || 0)}</td>
                <td><span class="status-badge ${bill.status}">${bill.status}</span></td>
                <td>${bill.due_date ? new Date(bill.due_date).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="action-btn edit" onclick="adminDashboard.viewBill('${bill.id}')">View</button>
                    <button class="action-btn delete" onclick="adminDashboard.editBill('${bill.id}')">Edit</button>
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
                <td>${dashboardCommon.formatCurrency(item.unit_price)}</td>
                <td><span class="status-badge ${item.quantity < item.min_stock ? 'low-stock' : 'in-stock'}">${item.quantity < item.min_stock ? 'Low Stock' : 'In Stock'}</span></td>
                <td>
                    <button class="action-btn edit" onclick="adminDashboard.viewInventory('${item.id}')">View</button>
                    <button class="action-btn delete" onclick="adminDashboard.editInventory('${item.id}')">Edit</button>
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
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        tension: 0.1,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    }
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
                        label: 'Revenue ($)',
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

        // Patient search
        const patientSearch = document.getElementById('patient-search');
        if (patientSearch) {
            patientSearch.addEventListener('input', this.handlePatientSearch.bind(this));
        }

        // Status filter
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', this.handleStatusFilter.bind(this));
        }
    }

    handleGlobalSearch(event) {
        const query = event.target.value.toLowerCase();
        console.log('Global search:', query);
        this.showNotification(`Searching for: ${query}`, 'info');
    }

    handlePatientSearch(event) {
        const query = event.target.value.toLowerCase();
        const rows = document.querySelectorAll('#patients-table-body tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    }

    handleStatusFilter(event) {
        const status = event.target.value;
        const rows = document.querySelectorAll('#patients-table-body tr');
        rows.forEach(row => {
            if (!status) {
                row.style.display = '';
            } else {
                const statusBadge = row.querySelector('.status-badge');
                const rowStatus = statusBadge ? statusBadge.textContent.toLowerCase() : '';
                row.style.display = rowStatus.includes(status) ? '' : 'none';
            }
        });
    }

    // Initialize charts
    initializeCharts() {
        try {
            this.createPatientAdmissionsChart();
            this.createRevenueChart();
            this.createDepartmentChart();
            this.createStaffChart();
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }

    // Create patient admissions chart
    createPatientAdmissionsChart() {
        const ctx = document.getElementById('patient-admissions-chart');
        if (!ctx) return;

        this.charts.patientAdmissions = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Patient Admissions',
                    data: [65, 59, 80, 81, 56, 55],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1
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

    // Create revenue chart
    createRevenueChart() {
        const ctx = document.getElementById('revenue-chart');
        if (!ctx) return;

        this.charts.revenue = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue (₹)',
                    data: [120000, 190000, 300000, 500000, 200000, 300000],
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

    // Create department chart
    createDepartmentChart() {
        const ctx = document.getElementById('department-chart');
        if (!ctx) return;

        this.charts.department = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Emergency'],
                datasets: [{
                    data: [30, 25, 20, 15, 10],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Create staff chart
    createStaffChart() {
        const ctx = document.getElementById('staff-chart');
        if (!ctx) return;

        this.charts.staff = new Chart(ctx, {
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

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            this.showNotification('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'admin-login.html';
            }, 1000);
        }
    }

    // Modal functions
    showAddUserModal() {
        this.showModal('Add User', this.getUserForm());
        this.setupFormSubmission('user-form', this.handleAddUser.bind(this));
    }

    showAddPatientModal() {
        this.showModal('Add Patient', this.getPatientForm());
        this.setupFormSubmission('patient-form', this.handleAddPatient.bind(this));
    }

    showScheduleAppointmentModal() {
        this.showModal('Schedule Appointment', this.getAppointmentForm());
        this.setupFormSubmission('appointment-form', this.handleScheduleAppointment.bind(this));
    }

    showCreateBillModal() {
        this.showModal('Create Bill', this.getBillForm());
        this.setupFormSubmission('bill-form', this.handleCreateBill.bind(this));
    }

    showAddInventoryModal() {
        this.showModal('Add Inventory', this.getInventoryForm());
        this.setupFormSubmission('inventory-form', this.handleAddInventory.bind(this));
    }

    showModal(title, content) {
        if (window.dashboardCommon) {
            window.dashboardCommon.showModal(title, content);
        } else {
            // Fallback for when dashboard-common.js is not loaded
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
    }

    setupFormSubmission(formId, handler) {
        setTimeout(() => {
            const form = document.getElementById(formId);
            if (form) {
                form.addEventListener('submit', handler);
            }
        }, 100);
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
                        ${this.mockData.patients.map(p => `<option value="${p.id}">${p.first_name} ${p.last_name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Doctor</label>
                    <select name="doctorId" required>
                        <option value="">Select Doctor</option>
                        ${this.mockData.users.filter(u => u.role === 'doctor').map(d => `<option value="${d.id}">${d.first_name} ${d.last_name}</option>`).join('')}
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
                        ${this.mockData.patients.map(p => `<option value="${p.id}">${p.first_name} ${p.last_name}</option>`).join('')}
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
                    <label>Minimum Stock</label>
                    <input type="number" name="minStock" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Add Inventory</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
    }

    // Form submission handlers
    handleAddUser(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const userData = Object.fromEntries(formData.entries());

        // Add to mock data
        const newUser = {
            id: this.mockData.users.length + 1,
            first_name: userData.firstName,
            last_name: userData.lastName,
            email: userData.email,
            role: userData.role,
            is_active: true,
            last_login: 'Never'
        };

        this.mockData.users.push(newUser);
        this.showNotification('User added successfully!', 'success');
        this.closeModal();
        this.loadUsers();
    }

    handleAddPatient(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const patientData = Object.fromEntries(formData.entries());

        const newPatient = {
            id: this.mockData.patients.length + 1,
            patient_id: `P${String(this.mockData.patients.length + 1).padStart(3, '0')}`,
            first_name: patientData.firstName,
            last_name: patientData.lastName,
            email: patientData.email,
            phone: patientData.phone,
            blood_type: patientData.bloodType,
            is_active: true
        };

        this.mockData.patients.push(newPatient);
        this.showNotification('Patient added successfully!', 'success');
        this.closeModal();
        this.loadPatients();
    }

    handleScheduleAppointment(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const appointmentData = Object.fromEntries(formData.entries());

        const patient = this.mockData.patients.find(p => p.id == appointmentData.patientId);
        const doctor = this.mockData.users.find(u => u.id == appointmentData.doctorId);

        const newAppointment = {
            id: this.mockData.appointments.length + 1,
            patient_id: appointmentData.patientId,
            doctor_id: appointmentData.doctorId,
            appointment_date: appointmentData.date,
            appointment_time: appointmentData.time,
            reason: appointmentData.reason,
            status: 'scheduled',
            patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
            doctor_name: doctor ? `${doctor.first_name} ${doctor.last_name}` : 'Unknown'
        };

        this.mockData.appointments.push(newAppointment);
        this.showNotification('Appointment scheduled successfully!', 'success');
        this.closeModal();
        this.loadAppointments();
    }

    handleCreateBill(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const billData = Object.fromEntries(formData.entries());

        const patient = this.mockData.patients.find(p => p.id == billData.patientId);

        const newBill = {
            id: this.mockData.billing.length + 1,
            bill_number: `B${String(this.mockData.billing.length + 1).padStart(3, '0')}`,
            patient_id: billData.patientId,
            patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
            amount: parseFloat(billData.amount),
            status: 'pending',
            due_date: billData.dueDate,
            description: billData.description
        };

        this.mockData.billing.push(newBill);
        this.showNotification('Bill created successfully!', 'success');
        this.closeModal();
        this.loadBilling();
    }

    handleAddInventory(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const inventoryData = Object.fromEntries(formData.entries());

        const newItem = {
            id: this.mockData.inventory.length + 1,
            name: inventoryData.name,
            category: inventoryData.category,
            quantity: parseInt(inventoryData.quantity),
            unit_price: parseFloat(inventoryData.unitPrice),
            min_stock: parseInt(inventoryData.minStock)
        };

        this.mockData.inventory.push(newItem);
        this.showNotification('Inventory item added successfully!', 'success');
        this.closeModal();
        this.loadInventory();
    }

    closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    }

    // Action functions for buttons
    editUser(userId) {
        const user = this.mockData.users.find(u => u.id == userId);
        if (user) {
            this.showModal('Edit User', this.getEditUserForm(user));
            this.setupFormSubmission('edit-user-form', (e) => this.handleEditUser(e, userId));
        }
    }

    deleteUser(userId) {
        if (confirm('Are you sure you want to delete this user?')) {
            this.mockData.users = this.mockData.users.filter(u => u.id != userId);
            this.showNotification('User deleted successfully!', 'success');
            this.loadUsers();
        }
    }

    viewPatient(patientId) {
        const patient = this.mockData.patients.find(p => p.id == patientId);
        if (patient) {
            this.showModal('Patient Details', this.getPatientDetailsView(patient));
        }
    }

    editPatient(patientId) {
        const patient = this.mockData.patients.find(p => p.id == patientId);
        if (patient) {
            this.showModal('Edit Patient', this.getEditPatientForm(patient));
            this.setupFormSubmission('edit-patient-form', (e) => this.handleEditPatient(e, patientId));
        }
    }

    viewAppointment(appointmentId) {
        const appointment = this.mockData.appointments.find(a => a.id == appointmentId);
        if (appointment) {
            this.showModal('Appointment Details', this.getAppointmentDetailsView(appointment));
        }
    }

    editAppointment(appointmentId) {
        const appointment = this.mockData.appointments.find(a => a.id == appointmentId);
        if (appointment) {
            this.showModal('Edit Appointment', this.getEditAppointmentForm(appointment));
            this.setupFormSubmission('edit-appointment-form', (e) => this.handleEditAppointment(e, appointmentId));
        }
    }

    viewBill(billId) {
        const bill = this.mockData.billing.find(b => b.id == billId);
        if (bill) {
            this.showModal('Bill Details', this.getBillDetailsView(bill));
        }
    }

    editBill(billId) {
        const bill = this.mockData.billing.find(b => b.id == billId);
        if (bill) {
            this.showModal('Edit Bill', this.getEditBillForm(bill));
            this.setupFormSubmission('edit-bill-form', (e) => this.handleEditBill(e, billId));
        }
    }

    viewInventory(itemId) {
        const item = this.mockData.inventory.find(i => i.id == itemId);
        if (item) {
            this.showModal('Inventory Details', this.getInventoryDetailsView(item));
        }
    }

    editInventory(itemId) {
        const item = this.mockData.inventory.find(i => i.id == itemId);
        if (item) {
            this.showModal('Edit Inventory', this.getEditInventoryForm(item));
            this.setupFormSubmission('edit-inventory-form', (e) => this.handleEditInventory(e, itemId));
        }
    }

    // Export functions
    exportUsers() {
        dashboardCommon.exportToCSV(this.mockData.users, 'users');
    }

    exportPatients() {
        dashboardCommon.exportToCSV(this.mockData.patients, 'patients');
    }

    // Utility functions
    showNotification(message, type = 'info') {
        if (window.dashboardCommon) {
            window.dashboardCommon.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // Additional form methods
    getEditUserForm(user) {
        return `
            <form id="edit-user-form">
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
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="doctor" ${user.role === 'doctor' ? 'selected' : ''}>Doctor</option>
                        <option value="receptionist" ${user.role === 'receptionist' ? 'selected' : ''}>Receptionist</option>
                        <option value="nurse" ${user.role === 'nurse' ? 'selected' : ''}>Nurse</option>
                        <option value="pharmacist" ${user.role === 'pharmacist' ? 'selected' : ''}>Pharmacist</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Update User</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
    }

    getPatientDetailsView(patient) {
        return `
            <div class="patient-details">
                <div class="detail-row">
                    <strong>Patient ID:</strong> ${patient.patient_id}
                </div>
                <div class="detail-row">
                    <strong>Name:</strong> ${patient.first_name} ${patient.last_name}
                </div>
                <div class="detail-row">
                    <strong>Email:</strong> ${patient.email}
                </div>
                <div class="detail-row">
                    <strong>Phone:</strong> ${patient.phone}
                </div>
                <div class="detail-row">
                    <strong>Blood Type:</strong> ${patient.blood_type}
                </div>
                <div class="detail-row">
                    <strong>Status:</strong> <span class="status-badge ${patient.is_active ? 'active' : 'inactive'}">${patient.is_active ? 'Active' : 'Inactive'}</span>
                </div>
            </div>
        `;
    }

    getAppointmentDetailsView(appointment) {
        return `
            <div class="appointment-details">
                <div class="detail-row">
                    <strong>Appointment ID:</strong> ${appointment.id}
                </div>
                <div class="detail-row">
                    <strong>Patient:</strong> ${appointment.patient_name}
                </div>
                <div class="detail-row">
                    <strong>Doctor:</strong> ${appointment.doctor_name}
                </div>
                <div class="detail-row">
                    <strong>Date:</strong> ${new Date(appointment.appointment_date).toLocaleDateString()}
                </div>
                <div class="detail-row">
                    <strong>Time:</strong> ${appointment.appointment_time}
                </div>
                <div class="detail-row">
                    <strong>Reason:</strong> ${appointment.reason}
                </div>
                <div class="detail-row">
                    <strong>Status:</strong> <span class="status-badge ${appointment.status}">${appointment.status}</span>
                </div>
            </div>
        `;
    }

    getBillDetailsView(bill) {
        return `
            <div class="bill-details">
                <div class="detail-row">
                    <strong>Bill Number:</strong> ${bill.bill_number}
                </div>
                <div class="detail-row">
                    <strong>Patient:</strong> ${bill.patient_name}
                </div>
                <div class="detail-row">
                    <strong>Amount:</strong> ${dashboardCommon.formatCurrency(bill.amount)}
                </div>
                <div class="detail-row">
                    <strong>Status:</strong> <span class="status-badge ${bill.status}">${bill.status}</span>
                </div>
                <div class="detail-row">
                    <strong>Due Date:</strong> ${bill.due_date ? new Date(bill.due_date).toLocaleDateString() : 'N/A'}
                </div>
            </div>
        `;
    }

    getInventoryDetailsView(item) {
        return `
            <div class="inventory-details">
                <div class="detail-row">
                    <strong>Item ID:</strong> ${item.id}
                </div>
                <div class="detail-row">
                    <strong>Name:</strong> ${item.name}
                </div>
                <div class="detail-row">
                    <strong>Category:</strong> ${item.category}
                </div>
                <div class="detail-row">
                    <strong>Quantity:</strong> ${item.quantity}
                </div>
                <div class="detail-row">
                    <strong>Unit Price:</strong> ${dashboardCommon.formatCurrency(item.unit_price)}
                </div>
                <div class="detail-row">
                    <strong>Minimum Stock:</strong> ${item.min_stock}
                </div>
                <div class="detail-row">
                    <strong>Status:</strong> <span class="status-badge ${item.quantity < item.min_stock ? 'low-stock' : 'in-stock'}">${item.quantity < item.min_stock ? 'Low Stock' : 'In Stock'}</span>
                </div>
            </div>
        `;
    }

    // Edit form handlers
    handleEditUser(event, userId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const userData = Object.fromEntries(formData.entries());

        const userIndex = this.mockData.users.findIndex(u => u.id == userId);
        if (userIndex !== -1) {
            this.mockData.users[userIndex] = {
                ...this.mockData.users[userIndex],
                first_name: userData.firstName,
                last_name: userData.lastName,
                email: userData.email,
                role: userData.role
            };
            this.showNotification('User updated successfully!', 'success');
            this.closeModal();
            this.loadUsers();
        }
    }

    handleEditPatient(event, patientId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const patientData = Object.fromEntries(formData.entries());

        const patientIndex = this.mockData.patients.findIndex(p => p.id == patientId);
        if (patientIndex !== -1) {
            this.mockData.patients[patientIndex] = {
                ...this.mockData.patients[patientIndex],
                first_name: patientData.firstName,
                last_name: patientData.lastName,
                email: patientData.email,
                phone: patientData.phone,
                blood_type: patientData.bloodType
            };
            this.showNotification('Patient updated successfully!', 'success');
            this.closeModal();
            this.loadPatients();
        }
    }

    handleEditAppointment(event, appointmentId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const appointmentData = Object.fromEntries(formData.entries());

        const appointmentIndex = this.mockData.appointments.findIndex(a => a.id == appointmentId);
        if (appointmentIndex !== -1) {
            this.mockData.appointments[appointmentIndex] = {
                ...this.mockData.appointments[appointmentIndex],
                appointment_date: appointmentData.date,
                appointment_time: appointmentData.time,
                reason: appointmentData.reason,
                status: appointmentData.status
            };
            this.showNotification('Appointment updated successfully!', 'success');
            this.closeModal();
            this.loadAppointments();
        }
    }

    handleEditBill(event, billId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const billData = Object.fromEntries(formData.entries());

        const billIndex = this.mockData.billing.findIndex(b => b.id == billId);
        if (billIndex !== -1) {
            this.mockData.billing[billIndex] = {
                ...this.mockData.billing[billIndex],
                amount: parseFloat(billData.amount),
                status: billData.status,
                due_date: billData.dueDate
            };
            this.showNotification('Bill updated successfully!', 'success');
            this.closeModal();
            this.loadBilling();
        }
    }

    handleEditInventory(event, itemId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const inventoryData = Object.fromEntries(formData.entries());

        const itemIndex = this.mockData.inventory.findIndex(i => i.id == itemId);
        if (itemIndex !== -1) {
            this.mockData.inventory[itemIndex] = {
                ...this.mockData.inventory[itemIndex],
                name: inventoryData.name,
                category: inventoryData.category,
                quantity: parseInt(inventoryData.quantity),
                unit_price: parseFloat(inventoryData.unitPrice),
                min_stock: parseInt(inventoryData.minStock)
            };
            this.showNotification('Inventory item updated successfully!', 'success');
            this.closeModal();
            this.loadInventory();
        }
    }

    // Additional utility methods
    loadDashboardData() {
        // Load dashboard metrics
        this.updateMetrics();
    }

    updateMetrics() {
        // Update dashboard metrics with current data
        const totalPatients = this.mockData.patients.length;
        const totalDoctors = this.mockData.users.filter(u => u.role === 'doctor').length;
        const totalAppointments = this.mockData.appointments.length;
        const totalRevenue = this.mockData.billing.reduce((sum, bill) => sum + (bill.amount || 0), 0);
        const criticalPatients = this.mockData.patients.filter(p => !p.is_active).length;
        const pendingApprovals = this.mockData.appointments.filter(a => a.status === 'scheduled').length;
        const totalNurses = this.mockData.users.filter(u => u.role === 'nurse').length;

        // Update metric cards
        const metrics = {
            'total-patients': totalPatients,
            'total-doctors': totalDoctors,
            'total-appointments': totalAppointments,
            'total-revenue': `₹${(totalRevenue / 100000).toFixed(1)}L`,
            'critical-patients': criticalPatients,
            'pending-approvals': pendingApprovals,
            'total-nurses': totalNurses
        };

        Object.entries(metrics).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    startRealTimeClock() {
        const updateClock = () => {
            const now = new Date();
            const dateElement = document.getElementById('current-date');
            const timeElement = document.getElementById('current-time');

            if (dateElement) {
                dateElement.textContent = now.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            if (timeElement) {
                timeElement.textContent = now.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }
        };

        updateClock();
        setInterval(updateClock, 1000);
    }
}

// Global functions for HTML onclick handlers
function showSection(sectionId) {
    if (window.adminDashboard) {
        window.adminDashboard.showSection(sectionId);
    }
}

function showAddUserModal() {
    if (window.adminDashboard) {
        window.adminDashboard.showAddUserModal();
    }
}

function showAddPatientModal() {
    if (window.adminDashboard) {
        window.adminDashboard.showAddPatientModal();
    }
}

function showScheduleAppointmentModal() {
    if (window.adminDashboard) {
        window.adminDashboard.showScheduleAppointmentModal();
    }
}

function showCreateBillModal() {
    if (window.adminDashboard) {
        window.adminDashboard.showCreateBillModal();
    }
}

function showAddInventoryModal() {
    if (window.adminDashboard) {
        window.adminDashboard.showAddInventoryModal();
    }
}

function exportUsers() {
    if (window.adminDashboard) {
        window.adminDashboard.exportUsers();
    }
}

function exportPatients() {
    if (window.adminDashboard) {
        window.adminDashboard.exportPatients();
    }
}

function viewSchedule() {
    if (window.adminDashboard) {
        window.adminDashboard.showNotification('Schedule view coming soon!', 'info');
    }
}

function processPayroll() {
    if (window.adminDashboard) {
        window.adminDashboard.showNotification('Payroll processing coming soon!', 'info');
    }
}

function checkLowStock() {
    if (window.adminDashboard) {
        window.adminDashboard.showNotification('Low stock check coming soon!', 'info');
    }
}

function generateReport() {
    if (window.adminDashboard) {
        window.adminDashboard.showNotification('Report generation coming soon!', 'info');
    }
}

function exportAnalytics() {
    if (window.adminDashboard) {
        window.adminDashboard.showNotification('Analytics export coming soon!', 'info');
    }
}

// System Health Functions
function showSystemHealth() {
    if (window.adminDashboard) {
        window.adminDashboard.showSection('system-health');
        window.adminDashboard.loadSystemHealth();
    }
}

function showSecurity() {
    if (window.adminDashboard) {
        window.adminDashboard.showSection('security');
        window.adminDashboard.loadSecurity();
    }
}

function showReports() {
    if (window.adminDashboard) {
        window.adminDashboard.showSection('reports');
        window.adminDashboard.loadReports();
    }
}

function showSettings() {
    if (window.adminDashboard) {
        window.adminDashboard.showSection('settings');
        window.adminDashboard.loadSettings();
    }
}

function showBackup() {
    if (window.adminDashboard) {
        window.adminDashboard.showSection('backup');
        window.adminDashboard.loadBackup();
    }
}

function showEmergency() {
    if (window.adminDashboard) {
        window.adminDashboard.showSection('emergency');
        window.adminDashboard.loadEmergency();
    }
}
                </button >
    <button class="btn btn-warning" onclick="adminDashboard.viewSystemLogs()">
        <i class="fas fa-file-alt"></i> View Logs
    </button>
            </div >
    `;
    }

    async refreshSystemHealth() {
        this.showNotification('Refreshing system health...', 'info');
        await this.loadSystemHealthData();
        this.showNotification('System health refreshed!', 'success');
    }

    restartServices() {
        if (confirm('Are you sure you want to restart all services?')) {
            this.showNotification('Restarting services...', 'warning');
            setTimeout(() => {
                this.showNotification('Services restarted successfully!', 'success');
            }, 3000);
        }
    }

    viewSystemLogs() {
        this.showModal('System Logs', `
    < div class="logs-container" >
                <div class="log-entry">
                    <span class="log-time">${new Date().toLocaleTimeString()}</span>
                    <span class="log-level info">INFO</span>
                    <span class="log-message">System health check completed</span>
                </div>
                <div class="log-entry">
                    <span class="log-time">${new Date(Date.now() - 60000).toLocaleTimeString()}</span>
                    <span class="log-level info">INFO</span>
                    <span class="log-message">Database connection established</span>
                </div>
                <div class="log-entry">
                    <span class="log-time">${new Date(Date.now() - 120000).toLocaleTimeString()}</span>
                    <span class="log-level warning">WARN</span>
                    <span class="log-message">High memory usage detected</span>
                </div>
            </div >
    `);
    }

    // Security Section
    async showSecuritySection() {
        this.showSection('security');
        await this.loadSecurityData();
    }

    async loadSecurityData() {
        try {
            // Mock security data - in real implementation, this would come from backend
            const securityData = {
                activeUsers: 12,
                failedLogins: 3,
                securityAlerts: 1,
                lastBackup: new Date().toISOString(),
                auditLogs: [
                    { id: 1, user: 'admin', action: 'Login', timestamp: new Date().toISOString(), ip: '192.168.1.100', status: 'Success' },
                    { id: 2, user: 'dr.smith', action: 'View Patient Records', timestamp: new Date(Date.now() - 300000).toISOString(), ip: '192.168.1.101', status: 'Success' },
                    { id: 3, user: 'unknown', action: 'Login Attempt', timestamp: new Date(Date.now() - 600000).toISOString(), ip: '192.168.1.200', status: 'Failed' }
                ]
            };

            this.renderSecurity(securityData);
        } catch (error) {
            console.error('Error loading security data:', error);
        }
    }

    renderSecurity(data) {
        const container = document.getElementById('security-content');
        if (!container) return;

        container.innerHTML = `
    < div class="security-overview" >
                <div class="security-metric">
                    <h3>Active Users</h3>
                    <p class="metric-value">${data.activeUsers}</p>
                </div>
                <div class="security-metric">
                    <h3>Failed Logins (24h)</h3>
                    <p class="metric-value warning">${data.failedLogins}</p>
                </div>
                <div class="security-metric">
                    <h3>Security Alerts</h3>
                    <p class="metric-value ${data.securityAlerts > 0 ? 'error' : 'success'}">${data.securityAlerts}</p>
                </div>
                <div class="security-metric">
                    <h3>Last Backup</h3>
                    <p class="metric-value">${new Date(data.lastBackup).toLocaleDateString()}</p>
                </div>
            </div >

            <div class="security-actions">
                <button class="btn btn-primary" onclick="adminDashboard.viewAuditLogs()">
                    <i class="fas fa-list"></i> View Audit Logs
                </button>
                <button class="btn btn-secondary" onclick="adminDashboard.manageUserAccess()">
                    <i class="fas fa-user-shield"></i> Manage Access
                </button>
                <button class="btn btn-warning" onclick="adminDashboard.securityScan()">
                    <i class="fas fa-shield-alt"></i> Security Scan
                </button>
                <button class="btn btn-danger" onclick="adminDashboard.lockSystem()">
                    <i class="fas fa-lock"></i> Lock System
                </button>
            </div>

            <div class="audit-logs">
                <h3>Recent Audit Logs</h3>
                <div class="logs-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>IP Address</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.auditLogs.map(log => `
                                <tr>
                                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                                    <td>${log.user}</td>
                                    <td>${log.action}</td>
                                    <td>${log.ip}</td>
                                    <td><span class="status-badge ${log.status.toLowerCase()}">${log.status}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
`;
    }

    viewAuditLogs() {
        this.showModal('Audit Logs', `
    < div class="audit-logs-full" >
                <div class="log-filters">
                    <select id="log-filter">
                        <option value="">All Actions</option>
                        <option value="login">Login</option>
                        <option value="view">View Records</option>
                        <option value="edit">Edit Records</option>
                        <option value="delete">Delete Records</option>
                    </select>
                    <input type="date" id="log-date" placeholder="Filter by date">
                </div>
                <div class="logs-list">
                    <div class="log-entry">
                        <span class="log-time">${new Date().toLocaleString()}</span>
                        <span class="log-user">admin</span>
                        <span class="log-action">System Access</span>
                        <span class="log-ip">192.168.1.100</span>
                        <span class="log-status success">Success</span>
                    </div>
                    <div class="log-entry">
                        <span class="log-time">${new Date(Date.now() - 300000).toLocaleString()}</span>
                        <span class="log-user">dr.smith</span>
                        <span class="log-action">View Patient Records</span>
                        <span class="log-ip">192.168.1.101</span>
                        <span class="log-status success">Success</span>
                    </div>
                </div>
            </div >
    `);
    }

    manageUserAccess() {
        this.showModal('User Access Management', `
    < div class="access-management" >
                <div class="access-list">
                    <h4>User Permissions</h4>
                    <div class="user-permissions">
                        <div class="permission-item">
                            <span class="user-name">admin</span>
                            <span class="permissions">Full Access</span>
                            <button class="btn btn-sm btn-secondary">Edit</button>
                        </div>
                        <div class="permission-item">
                            <span class="user-name">dr.smith</span>
                            <span class="permissions">Patient Records, Appointments</span>
                            <button class="btn btn-sm btn-secondary">Edit</button>
                        </div>
                    </div>
                </div>
                <div class="access-actions">
                    <button class="btn btn-primary">Add User</button>
                    <button class="btn btn-warning">Reset All Passwords</button>
                </div>
            </div >
    `);
    }

    securityScan() {
        this.showNotification('Running security scan...', 'info');
        setTimeout(() => {
            this.showNotification('Security scan completed. No threats detected.', 'success');
        }, 5000);
    }

    lockSystem() {
        if (confirm('Are you sure you want to lock the system? This will log out all users.')) {
            this.showNotification('System locked. All users will be logged out.', 'warning');
        }
    }

    // Reports Section
    async showReportsSection() {
        this.showSection('reports');
        await this.loadReportsData();
    }

    async loadReportsData() {
        try {
            // Mock reports data
            const reportsData = {
                totalReports: 15,
                scheduledReports: 8,
                customReports: 7,
                reports: [
                    { id: 1, name: 'Monthly Patient Report', type: 'Scheduled', lastRun: '2024-01-15', status: 'Completed' },
                    { id: 2, name: 'Financial Summary', type: 'Scheduled', lastRun: '2024-01-14', status: 'Completed' },
                    { id: 3, name: 'Staff Performance', type: 'Custom', lastRun: '2024-01-13', status: 'Failed' },
                    { id: 4, name: 'Inventory Report', type: 'Scheduled', lastRun: '2024-01-12', status: 'Completed' }
                ]
            };

            this.renderReports(reportsData);
        } catch (error) {
            console.error('Error loading reports data:', error);
        }
    }

    renderReports(data) {
        const container = document.getElementById('reports-content');
        if (!container) return;

        container.innerHTML = `
    < div class="reports-overview" >
                <div class="report-metric">
                    <h3>Total Reports</h3>
                    <p class="metric-value">${data.totalReports}</p>
                </div>
                <div class="report-metric">
                    <h3>Scheduled Reports</h3>
                    <p class="metric-value">${data.scheduledReports}</p>
                </div>
                <div class="report-metric">
                    <h3>Custom Reports</h3>
                    <p class="metric-value">${data.customReports}</p>
                </div>
            </div >

            <div class="reports-actions">
                <button class="btn btn-primary" onclick="adminDashboard.createCustomReport()">
                    <i class="fas fa-plus"></i> Create Custom Report
                </button>
                <button class="btn btn-secondary" onclick="adminDashboard.scheduleReport()">
                    <i class="fas fa-clock"></i> Schedule Report
                </button>
                <button class="btn btn-warning" onclick="adminDashboard.exportAllReports()">
                    <i class="fas fa-download"></i> Export All
                </button>
            </div>

            <div class="reports-list">
                <h3>Available Reports</h3>
                <div class="reports-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Report Name</th>
                                <th>Type</th>
                                <th>Last Run</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.reports.map(report => `
                                <tr>
                                    <td>${report.name}</td>
                                    <td><span class="type-badge ${report.type.toLowerCase()}">${report.type}</span></td>
                                    <td>${new Date(report.lastRun).toLocaleDateString()}</td>
                                    <td><span class="status-badge ${report.status.toLowerCase()}">${report.status}</span></td>
                                    <td>
                                        <button class="action-btn view" onclick="adminDashboard.viewReport('${report.id}')">View</button>
                                        <button class="action-btn run" onclick="adminDashboard.runReport('${report.id}')">Run</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
`;
    }

    createCustomReport() {
        this.showModal('Create Custom Report', `
    < form id = "custom-report-form" >
                <div class="form-group">
                    <label>Report Name</label>
                    <input type="text" name="reportName" required>
                </div>
                <div class="form-group">
                    <label>Report Type</label>
                    <select name="reportType" required>
                        <option value="patient">Patient Report</option>
                        <option value="financial">Financial Report</option>
                        <option value="staff">Staff Report</option>
                        <option value="inventory">Inventory Report</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Date Range</label>
                    <div class="date-range">
                        <input type="date" name="startDate" required>
                        <span>to</span>
                        <input type="date" name="endDate" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Include Fields</label>
                    <div class="checkbox-group">
                        <label><input type="checkbox" name="fields" value="basic"> Basic Information</label>
                        <label><input type="checkbox" name="fields" value="financial"> Financial Data</label>
                        <label><input type="checkbox" name="fields" value="medical"> Medical Records</label>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Create Report</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
`);
    }

    scheduleReport() {
        this.showNotification('Report scheduling feature coming soon!', 'info');
    }

    exportAllReports() {
        this.showNotification('Exporting all reports...', 'info');
        setTimeout(() => {
            this.showNotification('All reports exported successfully!', 'success');
        }, 3000);
    }

    viewReport(reportId) {
        this.showNotification(`Viewing report ${ reportId } `, 'info');
    }

    runReport(reportId) {
        this.showNotification(`Running report ${ reportId }...`, 'info');
        setTimeout(() => {
            this.showNotification('Report generated successfully!', 'success');
        }, 2000);
    }

    // Settings Section
    async showSettingsSection() {
        this.showSection('settings');
        await this.loadSettingsData();
    }

    async loadSettingsData() {
        try {
            // Mock settings data
            const settingsData = {
                hospitalName: 'General Hospital',
                hospitalAddress: '123 Medical Center Dr, City, State 12345',
                hospitalPhone: '+1-555-HOSPITAL',
                hospitalEmail: 'info@hospital.com',
                systemSettings: {
                    autoBackup: true,
                    emailNotifications: true,
                    smsNotifications: false,
                    maintenanceMode: false
                }
            };

            this.renderSettings(settingsData);
        } catch (error) {
            console.error('Error loading settings data:', error);
        }
    }

    renderSettings(data) {
        const container = document.getElementById('settings-content');
        if (!container) return;

        container.innerHTML = `
    < div class="settings-sections" >
                <div class="settings-section">
                    <h3>Hospital Information</h3>
                    <div class="settings-form">
                        <div class="form-group">
                            <label>Hospital Name</label>
                            <input type="text" id="hospital-name" value="${data.hospitalName}">
                        </div>
                        <div class="form-group">
                            <label>Address</label>
                            <textarea id="hospital-address">${data.hospitalAddress}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="tel" id="hospital-phone" value="${data.hospitalPhone}">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="hospital-email" value="${data.hospitalEmail}">
                        </div>
                        <button class="btn btn-primary" onclick="adminDashboard.saveHospitalInfo()">Save Changes</button>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>System Settings</h3>
                    <div class="settings-form">
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="auto-backup" ${data.systemSettings.autoBackup ? 'checked' : ''}>
                                <span>Automatic Backup</span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="email-notifications" ${data.systemSettings.emailNotifications ? 'checked' : ''}>
                                <span>Email Notifications</span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="sms-notifications" ${data.systemSettings.smsNotifications ? 'checked' : ''}>
                                <span>SMS Notifications</span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="maintenance-mode" ${data.systemSettings.maintenanceMode ? 'checked' : ''}>
                                <span>Maintenance Mode</span>
                            </label>
                        </div>
                        <button class="btn btn-primary" onclick="adminDashboard.saveSystemSettings()">Save Settings</button>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>Database Settings</h3>
                    <div class="settings-actions">
                        <button class="btn btn-warning" onclick="adminDashboard.optimizeDatabase()">
                            <i class="fas fa-tools"></i> Optimize Database
                        </button>
                        <button class="btn btn-secondary" onclick="adminDashboard.clearCache()">
                            <i class="fas fa-broom"></i> Clear Cache
                        </button>
                        <button class="btn btn-danger" onclick="adminDashboard.resetSystem()">
                            <i class="fas fa-exclamation-triangle"></i> Reset System
                        </button>
                    </div>
                </div>
            </div >
    `;
    }

    saveHospitalInfo() {
        const hospitalName = document.getElementById('hospital-name').value;
        const hospitalAddress = document.getElementById('hospital-address').value;
        const hospitalPhone = document.getElementById('hospital-phone').value;
        const hospitalEmail = document.getElementById('hospital-email').value;

        this.showNotification('Hospital information saved successfully!', 'success');
    }

    saveSystemSettings() {
        const autoBackup = document.getElementById('auto-backup').checked;
        const emailNotifications = document.getElementById('email-notifications').checked;
        const smsNotifications = document.getElementById('sms-notifications').checked;
        const maintenanceMode = document.getElementById('maintenance-mode').checked;

        this.showNotification('System settings saved successfully!', 'success');
    }

    optimizeDatabase() {
        this.showNotification('Optimizing database...', 'info');
        setTimeout(() => {
            this.showNotification('Database optimization completed!', 'success');
        }, 5000);
    }

    clearCache() {
        this.showNotification('Clearing cache...', 'info');
        setTimeout(() => {
            this.showNotification('Cache cleared successfully!', 'success');
        }, 2000);
    }

    resetSystem() {
        if (confirm('Are you sure you want to reset the system? This action cannot be undone.')) {
            this.showNotification('System reset initiated...', 'warning');
        }
    }

    // Backup Section
    async showBackupSection() {
        this.showSection('backup');
        await this.loadBackupData();
    }

    async loadBackupData() {
        try {
            // Mock backup data
            const backupData = {
                lastBackup: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                backupSize: '2.3 GB',
                totalBackups: 15,
                backupStatus: 'Completed',
                scheduledBackups: [
                    { id: 1, name: 'Daily Backup', schedule: 'Daily at 2:00 AM', lastRun: '2024-01-16', status: 'Completed' },
                    { id: 2, name: 'Weekly Backup', schedule: 'Sunday at 3:00 AM', lastRun: '2024-01-14', status: 'Completed' },
                    { id: 3, name: 'Monthly Backup', schedule: '1st of month at 4:00 AM', lastRun: '2024-01-01', status: 'Completed' }
                ]
            };

            this.renderBackup(backupData);
        } catch (error) {
            console.error('Error loading backup data:', error);
        }
    }

    renderBackup(data) {
        const container = document.getElementById('backup-content');
        if (!container) return;

        container.innerHTML = `
    < div class="backup-overview" >
                <div class="backup-metric">
                    <h3>Last Backup</h3>
                    <p class="metric-value">${new Date(data.lastBackup).toLocaleDateString()}</p>
                </div>
                <div class="backup-metric">
                    <h3>Backup Size</h3>
                    <p class="metric-value">${data.backupSize}</p>
                </div>
                <div class="backup-metric">
                    <h3>Total Backups</h3>
                    <p class="metric-value">${data.totalBackups}</p>
                </div>
                <div class="backup-metric">
                    <h3>Status</h3>
                    <p class="metric-value ${data.backupStatus.toLowerCase()}">${data.backupStatus}</p>
                </div>
            </div >

            <div class="backup-actions">
                <button class="btn btn-primary" onclick="adminDashboard.createBackup()">
                    <i class="fas fa-save"></i> Create Backup Now
                </button>
                <button class="btn btn-secondary" onclick="adminDashboard.scheduleBackup()">
                    <i class="fas fa-clock"></i> Schedule Backup
                </button>
                <button class="btn btn-warning" onclick="adminDashboard.restoreBackup()">
                    <i class="fas fa-undo"></i> Restore Backup
                </button>
                <button class="btn btn-danger" onclick="adminDashboard.deleteOldBackups()">
                    <i class="fas fa-trash"></i> Delete Old Backups
                </button>
            </div>

            <div class="scheduled-backups">
                <h3>Scheduled Backups</h3>
                <div class="backups-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Backup Name</th>
                                <th>Schedule</th>
                                <th>Last Run</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.scheduledBackups.map(backup => `
                                <tr>
                                    <td>${backup.name}</td>
                                    <td>${backup.schedule}</td>
                                    <td>${new Date(backup.lastRun).toLocaleDateString()}</td>
                                    <td><span class="status-badge ${backup.status.toLowerCase()}">${backup.status}</span></td>
                                    <td>
                                        <button class="action-btn edit" onclick="adminDashboard.editBackupSchedule('${backup.id}')">Edit</button>
                                        <button class="action-btn run" onclick="adminDashboard.runBackup('${backup.id}')">Run Now</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
`;
    }

    createBackup() {
        this.showNotification('Creating backup...', 'info');
        setTimeout(() => {
            this.showNotification('Backup created successfully!', 'success');
        }, 5000);
    }

    scheduleBackup() {
        this.showModal('Schedule Backup', `
    < form id = "backup-schedule-form" >
                <div class="form-group">
                    <label>Backup Name</label>
                    <input type="text" name="backupName" required>
                </div>
                <div class="form-group">
                    <label>Schedule Type</label>
                    <select name="scheduleType" required>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Time</label>
                    <input type="time" name="backupTime" required>
                </div>
                <div class="form-group">
                    <label>Include</label>
                    <div class="checkbox-group">
                        <label><input type="checkbox" name="include" value="database" checked> Database</label>
                        <label><input type="checkbox" name="include" value="files" checked> Files</label>
                        <label><input type="checkbox" name="include" value="logs"> Logs</label>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Schedule Backup</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form >
    `);
    }

    restoreBackup() {
        this.showModal('Restore Backup', `
    < div class="restore-backup" >
                <div class="backup-list">
                    <h4>Available Backups</h4>
                    <div class="backup-item">
                        <span class="backup-name">Backup_2024-01-16</span>
                        <span class="backup-size">2.3 GB</span>
                        <button class="btn btn-sm btn-primary">Restore</button>
                    </div>
                    <div class="backup-item">
                        <span class="backup-name">Backup_2024-01-15</span>
                        <span class="backup-size">2.1 GB</span>
                        <button class="btn btn-sm btn-primary">Restore</button>
                    </div>
                </div>
                <div class="restore-warning">
                    <p><i class="fas fa-exclamation-triangle"></i> Warning: Restoring a backup will overwrite current data.</p>
                </div>
            </div >
    `);
    }

    deleteOldBackups() {
        if (confirm('Are you sure you want to delete backups older than 30 days?')) {
            this.showNotification('Deleting old backups...', 'info');
            setTimeout(() => {
                this.showNotification('Old backups deleted successfully!', 'success');
            }, 3000);
        }
    }

    editBackupSchedule(backupId) {
        this.showNotification(`Editing backup schedule ${ backupId } `, 'info');
    }

    runBackup(backupId) {
        this.showNotification(`Running backup ${ backupId }...`, 'info');
        setTimeout(() => {
            this.showNotification('Backup completed successfully!', 'success');
        }, 5000);
    }

    // Emergency Section
    async showEmergencySection() {
        this.showSection('emergency');
        await this.loadEmergencyData();
    }

    async loadEmergencyData() {
        try {
            // Mock emergency data
            const emergencyData = {
                emergencyContacts: [
                    { name: 'Emergency Services', phone: '911', type: 'Emergency' },
                    { name: 'Hospital Director', phone: '+1-555-0100', type: 'Administration' },
                    { name: 'IT Support', phone: '+1-555-0101', type: 'Technical' },
                    { name: 'Security', phone: '+1-555-0102', type: 'Security' }
                ],
                emergencyProcedures: [
                    { id: 1, name: 'System Lockdown', description: 'Lock all system access', priority: 'High' },
                    { id: 2, name: 'Data Backup', description: 'Create emergency backup', priority: 'High' },
                    { id: 3, name: 'Emergency Shutdown', description: 'Shutdown all systems', priority: 'Critical' }
                ]
            };

            this.renderEmergency(emergencyData);
        } catch (error) {
            console.error('Error loading emergency data:', error);
        }
    }

    renderEmergency(data) {
        const container = document.getElementById('emergency-content');
        if (!container) return;

        container.innerHTML = `
    < div class="emergency-warning" >
                <div class="warning-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="warning-text">
                    <h2>Emergency Control Center</h2>
                    <p>Use these controls only in emergency situations. All actions are logged and monitored.</p>
                </div>
            </div >

            <div class="emergency-contacts">
                <h3>Emergency Contacts</h3>
                <div class="contacts-grid">
                    ${data.emergencyContacts.map(contact => `
                        <div class="contact-card ${contact.type.toLowerCase()}">
                            <div class="contact-icon">
                                <i class="fas fa-phone"></i>
                            </div>
                            <div class="contact-info">
                                <h4>${contact.name}</h4>
                                <p>${contact.phone}</p>
                                <span class="contact-type">${contact.type}</span>
                            </div>
                            <button class="btn btn-sm btn-primary" onclick="adminDashboard.callContact('${contact.phone}')">Call</button>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="emergency-procedures">
                <h3>Emergency Procedures</h3>
                <div class="procedures-list">
                    ${data.emergencyProcedures.map(procedure => `
                        <div class="procedure-card ${procedure.priority.toLowerCase()}">
                            <div class="procedure-info">
                                <h4>${procedure.name}</h4>
                                <p>${procedure.description}</p>
                                <span class="priority-badge ${procedure.priority.toLowerCase()}">${procedure.priority}</span>
                            </div>
                            <button class="btn btn-danger" onclick="adminDashboard.executeProcedure('${procedure.id}')">
                                Execute
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="emergency-actions">
                <button class="btn btn-danger btn-large" onclick="adminDashboard.emergencyLockdown()">
                    <i class="fas fa-lock"></i> EMERGENCY LOCKDOWN
                </button>
                <button class="btn btn-warning btn-large" onclick="adminDashboard.emergencyBackup()">
                    <i class="fas fa-save"></i> EMERGENCY BACKUP
                </button>
                <button class="btn btn-danger btn-large" onclick="adminDashboard.emergencyShutdown()">
                    <i class="fas fa-power-off"></i> EMERGENCY SHUTDOWN
                </button>
            </div>
`;
    }

    callContact(phone) {
        this.showNotification(`Calling ${ phone }...`, 'info');
    }

    executeProcedure(procedureId) {
        const procedures = {
            '1': 'System Lockdown',
            '2': 'Data Backup',
            '3': 'Emergency Shutdown'
        };

        if (confirm(`Are you sure you want to execute: ${ procedures[procedureId] }?`)) {
            this.showNotification(`Executing ${ procedures[procedureId] }...`, 'warning');
        }
    }

    emergencyLockdown() {
        if (confirm('Are you sure you want to initiate EMERGENCY LOCKDOWN? This will lock all system access.')) {
            this.showNotification('EMERGENCY LOCKDOWN INITIATED!', 'error');
        }
    }

    emergencyBackup() {
        if (confirm('Are you sure you want to create an EMERGENCY BACKUP?')) {
            this.showNotification('Creating emergency backup...', 'warning');
            setTimeout(() => {
                this.showNotification('Emergency backup completed!', 'success');
            }, 10000);
        }
    }

    emergencyShutdown() {
        if (confirm('Are you sure you want to initiate EMERGENCY SHUTDOWN? This will shut down all systems.')) {
            this.showNotification('EMERGENCY SHUTDOWN INITIATED!', 'error');
        }
    }
}

// Global function for navigation (called from HTML)
function showSection(sectionId) {
    if (window.adminDashboard) {
        window.adminDashboard.showSection(sectionId);
    }
}

// Global functions for button clicks (called from HTML)
function showAddUserModal() {
    if (window.adminDashboard) {
        window.adminDashboard.showAddUserModal();
    }
}

function showAddPatientModal() {
    if (window.adminDashboard) {
        window.adminDashboard.showAddPatientModal();
    }
}

function showScheduleAppointmentModal() {
    if (window.adminDashboard) {
        window.adminDashboard.showScheduleAppointmentModal();
    }
}

function showCreateBillModal() {
    if (window.adminDashboard) {
        window.adminDashboard.showCreateBillModal();
    }
}

function showAddInventoryModal() {
    if (window.adminDashboard) {
        window.adminDashboard.showAddInventoryModal();
    }
}

function exportUsers() {
    if (window.adminDashboard) {
        window.adminDashboard.exportUsers();
    }
}

function exportPatients() {
    if (window.adminDashboard) {
        window.adminDashboard.exportPatients();
    }
}

function viewSchedule() {
    if (window.adminDashboard) {
        window.adminDashboard.viewSchedule();
    }
}

function processPayroll() {
    if (window.adminDashboard) {
        window.adminDashboard.processPayroll();
    }
}

function checkLowStock() {
    if (window.adminDashboard) {
        window.adminDashboard.checkLowStock();
    }
}

function generateReport() {
    if (window.adminDashboard) {
        window.adminDashboard.generateReport();
    }
}

function exportAnalytics() {
    if (window.adminDashboard) {
        window.adminDashboard.exportAnalytics();
    }
}

// Additional Admin Dashboard Functions for new sections
function showSystemHealth() {
    if (window.adminDashboard) {
        window.adminDashboard.showSystemHealthSection();
    }
}

function showSecurity() {
    if (window.adminDashboard) {
        window.adminDashboard.showSecuritySection();
    }
}

function showReports() {
    if (window.adminDashboard) {
        window.adminDashboard.showReportsSection();
    }
}

function showSettings() {
    if (window.adminDashboard) {
        window.adminDashboard.showSettingsSection();
    }
}

function showBackup() {
    if (window.adminDashboard) {
        window.adminDashboard.showBackupSection();
    }
}

function showEmergency() {
    if (window.adminDashboard) {
        window.adminDashboard.showEmergencySection();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});
