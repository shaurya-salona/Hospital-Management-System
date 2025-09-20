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
        await this.loadUserData();
        this.setupEventListeners();
        this.loadDashboardData();
        this.startRealTimeClock();
        this.showNotification('Admin Dashboard loaded successfully!', 'success');
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
        this.renderUsers(this.mockData.users);
        this.closeModal();
        this.showNotification('User added successfully!', 'success');
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
        this.renderPatients(this.mockData.patients);
        this.closeModal();
        this.showNotification('Patient added successfully!', 'success');
    }

    handleScheduleAppointment(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const appointmentData = Object.fromEntries(formData.entries());

        const patient = this.mockData.patients.find(p => p.id == appointmentData.patientId);
        const doctor = this.mockData.users.find(u => u.id == appointmentData.doctorId);

        const newAppointment = {
            id: this.mockData.appointments.length + 1,
            reason: appointmentData.reason,
            status: 'scheduled',
            appointment_date: appointmentData.date,
            appointment_time: appointmentData.time,
            patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
            doctor_name: doctor ? `${doctor.first_name} ${doctor.last_name}` : 'Unknown'
        };

        this.mockData.appointments.push(newAppointment);
        this.renderAppointments(this.mockData.appointments);
        this.closeModal();
        this.showNotification('Appointment scheduled successfully!', 'success');
    }

    handleCreateBill(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const billData = Object.fromEntries(formData.entries());

        const patient = this.mockData.patients.find(p => p.id == billData.patientId);

        const newBill = {
            id: this.mockData.billing.length + 1,
            bill_number: `B${String(this.mockData.billing.length + 1).padStart(3, '0')}`,
            patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
            amount: parseFloat(billData.amount),
            status: 'pending',
            due_date: billData.dueDate
        };

        this.mockData.billing.push(newBill);
        this.renderBilling(this.mockData.billing);
        this.closeModal();
        this.showNotification('Bill created successfully!', 'success');
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
        this.renderInventory(this.mockData.inventory);
        this.closeModal();
        this.showNotification('Inventory item added successfully!', 'success');
    }

    closeModal() {
        if (window.dashboardCommon) {
            window.dashboardCommon.closeModal();
        } else {
            const modalOverlay = document.getElementById('modal-overlay');
            if (modalOverlay) {
                modalOverlay.style.display = 'none';
            }
        }
    }

    // Action functions
    editUser(userId) {
        const user = this.mockData.users.find(u => u.id == userId);
        if (user) {
            this.showNotification(`Editing user: ${user.first_name} ${user.last_name}`, 'info');
        }
    }

    deleteUser(userId) {
        if (confirm('Are you sure you want to delete this user?')) {
            this.mockData.users = this.mockData.users.filter(u => u.id != userId);
            this.renderUsers(this.mockData.users);
            this.showNotification('User deleted successfully!', 'success');
        }
    }

    viewPatient(patientId) {
        const patient = this.mockData.patients.find(p => p.id == patientId);
        if (patient) {
            this.showNotification(`Viewing patient: ${patient.first_name} ${patient.last_name}`, 'info');
        }
    }

    editPatient(patientId) {
        const patient = this.mockData.patients.find(p => p.id == patientId);
        if (patient) {
            this.showNotification(`Editing patient: ${patient.first_name} ${patient.last_name}`, 'info');
        }
    }

    viewAppointment(appointmentId) {
        const appointment = this.mockData.appointments.find(a => a.id == appointmentId);
        if (appointment) {
            this.showNotification(`Viewing appointment: ${appointment.reason}`, 'info');
        }
    }

    editAppointment(appointmentId) {
        const appointment = this.mockData.appointments.find(a => a.id == appointmentId);
        if (appointment) {
            this.showNotification(`Editing appointment: ${appointment.reason}`, 'info');
        }
    }

    viewBill(billId) {
        const bill = this.mockData.billing.find(b => b.id == billId);
        if (bill) {
            this.showNotification(`Viewing bill: ${bill.bill_number}`, 'info');
        }
    }

    editBill(billId) {
        const bill = this.mockData.billing.find(b => b.id == billId);
        if (bill) {
            this.showNotification(`Editing bill: ${bill.bill_number}`, 'info');
        }
    }

    viewInventory(itemId) {
        const item = this.mockData.inventory.find(i => i.id == itemId);
        if (item) {
            this.showNotification(`Viewing inventory: ${item.name}`, 'info');
        }
    }

    editInventory(itemId) {
        const item = this.mockData.inventory.find(i => i.id == itemId);
        if (item) {
            this.showNotification(`Editing inventory: ${item.name}`, 'info');
        }
    }

    // Utility functions
    exportUsers() {
        this.showNotification('Exporting users data...', 'info');
        // Simulate export
        setTimeout(() => {
            this.showNotification('Users data exported successfully!', 'success');
        }, 2000);
    }

    exportPatients() {
        this.showNotification('Exporting patients data...', 'info');
        setTimeout(() => {
            this.showNotification('Patients data exported successfully!', 'success');
        }, 2000);
    }

    viewSchedule() {
        this.showNotification('Opening schedule view...', 'info');
    }

    processPayroll() {
        this.showNotification('Processing payroll...', 'info');
        setTimeout(() => {
            this.showNotification('Payroll processed successfully!', 'success');
        }, 3000);
    }

    checkLowStock() {
        const lowStockItems = this.mockData.inventory.filter(item => item.quantity < item.min_stock);
        if (lowStockItems.length > 0) {
            this.showNotification(`Found ${lowStockItems.length} low stock items`, 'warning');
        } else {
            this.showNotification('All items are well stocked!', 'success');
        }
    }

    generateReport() {
        this.showNotification('Generating report...', 'info');
        setTimeout(() => {
            this.showNotification('Report generated successfully!', 'success');
        }, 3000);
    }

    exportAnalytics() {
        this.showNotification('Exporting analytics data...', 'info');
        setTimeout(() => {
            this.showNotification('Analytics data exported successfully!', 'success');
        }, 2000);
    }

    showNotification(message, type = 'info') {
        if (window.dashboardCommon) {
            window.dashboardCommon.showNotification(message, type);
        } else {
            // Fallback notification
            alert(message);
        }
    }

    async loadDashboardData() {
        // Load initial data for the active section
        const activeSection = document.querySelector('.dashboard-section.active');
        if (activeSection) {
            await this.loadSectionData(activeSection.id);
        }
    }

    startRealTimeClock() {
        const updateClock = () => {
            const now = new Date();
            const dateElement = document.getElementById('current-date');
            const timeElement = document.getElementById('current-time');

            if (dateElement) {
                dateElement.textContent = now.toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            if (timeElement) {
                timeElement.textContent = now.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }
        };

        updateClock();
        setInterval(updateClock, 1000);
    }

    // System Health Section
    showSystemHealthSection() {
        this.showSection('system-health');
        this.loadSystemHealthData();
    }

    async loadSystemHealthData() {
        const content = document.getElementById('system-health-content');
        if (!content) return;

        content.innerHTML = `
            <div class="health-grid">
                <div class="health-card">
                    <div class="health-icon">
                        <i class="fas fa-server"></i>
                    </div>
                    <div class="health-info">
                        <h3>Database Status</h3>
                        <p class="status healthy">Online</p>
                        <p>Response Time: 45ms</p>
                    </div>
                </div>
                <div class="health-card">
                    <div class="health-icon">
                        <i class="fas fa-memory"></i>
                    </div>
                    <div class="health-info">
                        <h3>Memory Usage</h3>
                        <p class="status healthy">Normal</p>
                        <p>Usage: 2.1GB / 8GB</p>
                    </div>
                </div>
                <div class="health-card">
                    <div class="health-icon">
                        <i class="fas fa-hdd"></i>
                    </div>
                    <div class="health-info">
                        <h3>Disk Space</h3>
                        <p class="status healthy">Available</p>
                        <p>Free: 156GB / 500GB</p>
                    </div>
                </div>
                <div class="health-card">
                    <div class="health-icon">
                        <i class="fas fa-network-wired"></i>
                    </div>
                    <div class="health-info">
                        <h3>Network</h3>
                        <p class="status healthy">Connected</p>
                        <p>Latency: 12ms</p>
                    </div>
                </div>
            </div>
            <div class="health-actions">
                <button class="btn btn-primary" onclick="adminDashboard.runSystemDiagnostics()">
                    <i class="fas fa-stethoscope"></i> Run Diagnostics
                </button>
                <button class="btn btn-secondary" onclick="adminDashboard.viewSystemLogs()">
                    <i class="fas fa-file-alt"></i> View Logs
                </button>
                <button class="btn btn-secondary" onclick="adminDashboard.restartServices()">
                    <i class="fas fa-redo"></i> Restart Services
                </button>
            </div>
        `;
    }

    runSystemDiagnostics() {
        this.showNotification('Running system diagnostics...', 'info');
        setTimeout(() => {
            this.showNotification('System diagnostics completed successfully!', 'success');
        }, 3000);
    }

    viewSystemLogs() {
        this.showModal('System Logs', this.getSystemLogsContent());
    }

    getSystemLogsContent() {
        return `
            <div class="logs-container">
                <div class="log-entry">
                    <span class="log-time">14:32:15</span>
                    <span class="log-level info">INFO</span>
                    <span class="log-message">Database connection established successfully</span>
                </div>
                <div class="log-entry">
                    <span class="log-time">14:31:45</span>
                    <span class="log-level info">INFO</span>
                    <span class="log-message">User authentication successful for admin@hospital.com</span>
                </div>
                <div class="log-entry">
                    <span class="log-time">14:30:12</span>
                    <span class="log-level warning">WARN</span>
                    <span class="log-message">High memory usage detected: 85%</span>
                </div>
                <div class="log-entry">
                    <span class="log-time">14:29:33</span>
                    <span class="log-level info">INFO</span>
                    <span class="log-message">Backup process completed successfully</span>
                </div>
                <div class="log-entry">
                    <span class="log-time">14:28:55</span>
                    <span class="log-level error">ERROR</span>
                    <span class="log-message">Failed to connect to external API service</span>
                </div>
            </div>
        `;
    }

    restartServices() {
        if (confirm('Are you sure you want to restart system services? This may cause temporary downtime.')) {
            this.showNotification('Restarting services...', 'warning');
            setTimeout(() => {
                this.showNotification('Services restarted successfully!', 'success');
            }, 5000);
        }
    }

    // Security Section
    showSecuritySection() {
        this.showSection('security');
        this.loadSecurityData();
    }

    async loadSecurityData() {
        const content = document.getElementById('security-content');
        if (!content) return;

        content.innerHTML = `
            <div class="security-overview">
                <div class="security-metric">
                    <h3>Active Sessions</h3>
                    <p class="metric-value">24</p>
                </div>
                <div class="security-metric">
                    <h3>Failed Logins (24h)</h3>
                    <p class="metric-value warning">3</p>
                </div>
                <div class="security-metric">
                    <h3>Security Alerts</h3>
                    <p class="metric-value error">1</p>
                </div>
                <div class="security-metric">
                    <h3>Password Strength</h3>
                    <p class="metric-value success">Strong</p>
                </div>
            </div>
            <div class="security-actions">
                <button class="btn btn-primary" onclick="adminDashboard.viewSecurityLogs()">
                    <i class="fas fa-shield-alt"></i> View Security Logs
                </button>
                <button class="btn btn-secondary" onclick="adminDashboard.manageUserSessions()">
                    <i class="fas fa-users"></i> Manage Sessions
                </button>
                <button class="btn btn-secondary" onclick="adminDashboard.updateSecuritySettings()">
                    <i class="fas fa-cog"></i> Security Settings
                </button>
            </div>
            <div class="audit-logs">
                <h3>Recent Security Events</h3>
                <div class="logs-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Event</th>
                                <th>User</th>
                                <th>IP Address</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>14:32:15</td>
                                <td>Login Success</td>
                                <td>admin@hospital.com</td>
                                <td>192.168.1.100</td>
                                <td><span class="status-badge success">Success</span></td>
                            </tr>
                            <tr>
                                <td>14:28:45</td>
                                <td>Failed Login</td>
                                <td>unknown@email.com</td>
                                <td>192.168.1.150</td>
                                <td><span class="status-badge error">Failed</span></td>
                            </tr>
                            <tr>
                                <td>14:25:12</td>
                                <td>Password Change</td>
                                <td>dr.smith@hospital.com</td>
                                <td>192.168.1.120</td>
                                <td><span class="status-badge success">Success</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    viewSecurityLogs() {
        this.showModal('Security Audit Logs', this.getSecurityLogsContent());
    }

    getSecurityLogsContent() {
        return `
            <div class="logs-container">
                <div class="log-entry">
                    <span class="log-time">14:32:15</span>
                    <span class="log-level info">INFO</span>
                    <span class="log-message">Successful login: admin@hospital.com from 192.168.1.100</span>
                </div>
                <div class="log-entry">
                    <span class="log-time">14:28:45</span>
                    <span class="log-level error">ERROR</span>
                    <span class="log-message">Failed login attempt: unknown@email.com from 192.168.1.150</span>
                </div>
                <div class="log-entry">
                    <span class="log-time">14:25:12</span>
                    <span class="log-level info">INFO</span>
                    <span class="log-message">Password changed: dr.smith@hospital.com</span>
                </div>
                <div class="log-entry">
                    <span class="log-time">14:20:33</span>
                    <span class="log-level warning">WARN</span>
                    <span class="log-message">Multiple failed login attempts from 192.168.1.150</span>
                </div>
            </div>
        `;
    }

    manageUserSessions() {
        this.showModal('Active User Sessions', this.getUserSessionsContent());
    }

    getUserSessionsContent() {
        return `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>IP Address</th>
                            <th>Login Time</th>
                            <th>Last Activity</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>admin@hospital.com</td>
                            <td>Admin</td>
                            <td>192.168.1.100</td>
                            <td>14:30:00</td>
                            <td>14:32:15</td>
                            <td><button class="action-btn delete" onclick="adminDashboard.terminateSession('admin')">Terminate</button></td>
                        </tr>
                        <tr>
                            <td>dr.smith@hospital.com</td>
                            <td>Doctor</td>
                            <td>192.168.1.120</td>
                            <td>14:25:00</td>
                            <td>14:31:45</td>
                            <td><button class="action-btn delete" onclick="adminDashboard.terminateSession('dr.smith')">Terminate</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    terminateSession(userId) {
        if (confirm('Are you sure you want to terminate this user session?')) {
            this.showNotification(`Session terminated for ${userId}`, 'success');
        }
    }

    updateSecuritySettings() {
        this.showModal('Security Settings', this.getSecuritySettingsContent());
    }

    getSecuritySettingsContent() {
        return `
            <form id="security-settings-form">
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="twoFactorAuth" checked> Enable Two-Factor Authentication
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="passwordComplexity" checked> Enforce Strong Passwords
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="sessionTimeout" checked> Auto-logout after 30 minutes
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="ipWhitelist"> Enable IP Whitelist
                    </label>
                </div>
                <div class="form-group">
                    <label>Failed Login Attempts Limit</label>
                    <input type="number" name="maxFailedAttempts" value="5" min="1" max="10">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Save Settings</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
    }

    // Reports Section
    showReportsSection() {
        this.showSection('reports');
        this.loadReportsData();
    }

    async loadReportsData() {
        const content = document.getElementById('reports-content');
        if (!content) return;

        content.innerHTML = `
            <div class="reports-overview">
                <div class="report-metric">
                    <h3>Total Reports</h3>
                    <p class="metric-value">156</p>
                </div>
                <div class="report-metric">
                    <h3>Generated Today</h3>
                    <p class="metric-value">12</p>
                </div>
                <div class="report-metric">
                    <h3>Scheduled Reports</h3>
                    <p class="metric-value">8</p>
                </div>
                <div class="report-metric">
                    <h3>Custom Reports</h3>
                    <p class="metric-value">24</p>
                </div>
            </div>
            <div class="reports-actions">
                <button class="btn btn-primary" onclick="adminDashboard.generateCustomReport()">
                    <i class="fas fa-plus"></i> Generate Custom Report
                </button>
                <button class="btn btn-secondary" onclick="adminDashboard.scheduleReport()">
                    <i class="fas fa-clock"></i> Schedule Report
                </button>
                <button class="btn btn-secondary" onclick="adminDashboard.exportAllReports()">
                    <i class="fas fa-download"></i> Export All
                </button>
            </div>
            <div class="reports-list">
                <h3>Recent Reports</h3>
                <div class="reports-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Report Name</th>
                                <th>Type</th>
                                <th>Generated</th>
                                <th>Size</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Monthly Patient Report</td>
                                <td><span class="type-badge scheduled">Scheduled</span></td>
                                <td>2024-01-15 10:00</td>
                                <td>2.3 MB</td>
                                <td>
                                    <button class="action-btn edit" onclick="adminDashboard.viewReport('monthly-patient')">View</button>
                                    <button class="action-btn delete" onclick="adminDashboard.downloadReport('monthly-patient')">Download</button>
                                </td>
                            </tr>
                            <tr>
                                <td>Revenue Analysis Q4</td>
                                <td><span class="type-badge custom">Custom</span></td>
                                <td>2024-01-14 15:30</td>
                                <td>1.8 MB</td>
                                <td>
                                    <button class="action-btn edit" onclick="adminDashboard.viewReport('revenue-q4')">View</button>
                                    <button class="action-btn delete" onclick="adminDashboard.downloadReport('revenue-q4')">Download</button>
                                </td>
                            </tr>
                            <tr>
                                <td>Staff Performance Report</td>
                                <td><span class="type-badge scheduled">Scheduled</span></td>
                                <td>2024-01-13 09:00</td>
                                <td>3.1 MB</td>
                                <td>
                                    <button class="action-btn edit" onclick="adminDashboard.viewReport('staff-performance')">View</button>
                                    <button class="action-btn delete" onclick="adminDashboard.downloadReport('staff-performance')">Download</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    generateCustomReport() {
        this.showModal('Generate Custom Report', this.getCustomReportForm());
    }

    getCustomReportForm() {
        return `
            <form id="custom-report-form">
                <div class="form-group">
                    <label>Report Name</label>
                    <input type="text" name="reportName" required>
                </div>
                <div class="form-group">
                    <label>Report Type</label>
                    <select name="reportType" required>
                        <option value="">Select Type</option>
                        <option value="patient">Patient Report</option>
                        <option value="financial">Financial Report</option>
                        <option value="staff">Staff Report</option>
                        <option value="inventory">Inventory Report</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Date Range</label>
                    <div style="display: flex; gap: 10px;">
                        <input type="date" name="startDate" required>
                        <input type="date" name="endDate" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Format</label>
                    <select name="format" required>
                        <option value="pdf">PDF</option>
                        <option value="excel">Excel</option>
                        <option value="csv">CSV</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Generate Report</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
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
        this.showNotification(`Opening report: ${reportId}`, 'info');
    }

    downloadReport(reportId) {
        this.showNotification(`Downloading report: ${reportId}`, 'info');
    }

    // Settings Section
    showSettingsSection() {
        this.showSection('settings');
        this.loadSettingsData();
    }

    async loadSettingsData() {
        const content = document.getElementById('settings-content');
        if (!content) return;

        content.innerHTML = `
            <div class="settings-sections">
                <div class="settings-section">
                    <h3><i class="fas fa-hospital"></i> Hospital Information</h3>
                    <form class="settings-form">
                        <div class="form-group">
                            <label>Hospital Name</label>
                            <input type="text" value="City General Hospital" name="hospitalName">
                        </div>
                        <div class="form-group">
                            <label>Address</label>
                            <textarea name="address" rows="3">123 Medical Center Drive, City, State 12345</textarea>
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="tel" value="+1-555-0123" name="phone">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" value="info@hospital.com" name="email">
                        </div>
                    </form>
                </div>
                <div class="settings-section">
                    <h3><i class="fas fa-cog"></i> System Settings</h3>
                    <form class="settings-form">
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" checked> Enable Email Notifications
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" checked> Enable SMS Notifications
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox"> Enable Maintenance Mode
                            </label>
                        </div>
                        <div class="form-group">
                            <label>Default Language</label>
                            <select name="language">
                                <option value="en">English</option>
                                <option value="hi">Hindi</option>
                                <option value="es">Spanish</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Time Zone</label>
                            <select name="timezone">
                                <option value="UTC">UTC</option>
                                <option value="IST" selected>Indian Standard Time</option>
                                <option value="EST">Eastern Time</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="settings-section">
                    <h3><i class="fas fa-user-shield"></i> User Management</h3>
                    <form class="settings-form">
                        <div class="form-group">
                            <label>Default User Role</label>
                            <select name="defaultRole">
                                <option value="patient">Patient</option>
                                <option value="doctor">Doctor</option>
                                <option value="nurse">Nurse</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Password Expiry (Days)</label>
                            <input type="number" value="90" name="passwordExpiry" min="30" max="365">
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" checked> Require Email Verification
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox"> Allow Self Registration
                            </label>
                        </div>
                    </form>
                </div>
            </div>
            <div class="settings-actions">
                <button class="btn btn-primary" onclick="adminDashboard.saveSettings()">
                    <i class="fas fa-save"></i> Save All Settings
                </button>
                <button class="btn btn-secondary" onclick="adminDashboard.resetSettings()">
                    <i class="fas fa-undo"></i> Reset to Defaults
                </button>
            </div>
        `;
    }

    saveSettings() {
        this.showNotification('Saving settings...', 'info');
        setTimeout(() => {
            this.showNotification('Settings saved successfully!', 'success');
        }, 2000);
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            this.showNotification('Settings reset to defaults!', 'success');
        }
    }

    // Backup Section
    showBackupSection() {
        this.showSection('backup');
        this.loadBackupData();
    }

    async loadBackupData() {
        const content = document.getElementById('backup-content');
        if (!content) return;

        content.innerHTML = `
            <div class="backup-overview">
                <div class="backup-metric">
                    <h3>Last Backup</h3>
                    <p class="metric-value">2 hours ago</p>
                </div>
                <div class="backup-metric">
                    <h3>Backup Size</h3>
                    <p class="metric-value">2.3 GB</p>
                </div>
                <div class="backup-metric">
                    <h3>Storage Used</h3>
                    <p class="metric-value">45%</p>
                </div>
                <div class="backup-metric">
                    <h3>Backup Status</h3>
                    <p class="metric-value success">Healthy</p>
                </div>
            </div>
            <div class="backup-actions">
                <button class="btn btn-primary" onclick="adminDashboard.createBackup()">
                    <i class="fas fa-plus"></i> Create Backup Now
                </button>
                <button class="btn btn-secondary" onclick="adminDashboard.restoreBackup()">
                    <i class="fas fa-undo"></i> Restore from Backup
                </button>
                <button class="btn btn-secondary" onclick="adminDashboard.scheduleBackup()">
                    <i class="fas fa-clock"></i> Schedule Backup
                </button>
            </div>
            <div class="scheduled-backups">
                <h3>Scheduled Backups</h3>
                <div class="backups-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Schedule</th>
                                <th>Type</th>
                                <th>Last Run</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Daily at 2:00 AM</td>
                                <td>Full Backup</td>
                                <td>2024-01-15 02:00</td>
                                <td><span class="status-badge success">Success</span></td>
                                <td>
                                    <button class="action-btn edit" onclick="adminDashboard.editBackupSchedule('daily')">Edit</button>
                                    <button class="action-btn delete" onclick="adminDashboard.deleteBackupSchedule('daily')">Delete</button>
                                </td>
                            </tr>
                            <tr>
                                <td>Weekly on Sunday</td>
                                <td>Incremental</td>
                                <td>2024-01-14 02:00</td>
                                <td><span class="status-badge success">Success</span></td>
                                <td>
                                    <button class="action-btn edit" onclick="adminDashboard.editBackupSchedule('weekly')">Edit</button>
                                    <button class="action-btn delete" onclick="adminDashboard.deleteBackupSchedule('weekly')">Delete</button>
                                </td>
                            </tr>
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

    restoreBackup() {
        this.showModal('Restore from Backup', this.getRestoreBackupContent());
    }

    getRestoreBackupContent() {
        return `
            <div class="form-group">
                <label>Select Backup File</label>
                <select name="backupFile" required>
                    <option value="">Select Backup</option>
                    <option value="backup-2024-01-15">backup-2024-01-15 (2.3 GB)</option>
                    <option value="backup-2024-01-14">backup-2024-01-14 (2.1 GB)</option>
                    <option value="backup-2024-01-13">backup-2024-01-13 (2.0 GB)</option>
                </select>
            </div>
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" required> I understand this will overwrite current data
                </label>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-danger" onclick="adminDashboard.confirmRestore()">Restore Backup</button>
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
            </div>
        `;
    }

    confirmRestore() {
        if (confirm('Are you absolutely sure you want to restore from backup? This will overwrite all current data!')) {
            this.showNotification('Restoring from backup...', 'warning');
            setTimeout(() => {
                this.showNotification('Backup restored successfully!', 'success');
            }, 10000);
        }
    }

    scheduleBackup() {
        this.showModal('Schedule Backup', this.getScheduleBackupForm());
    }

    getScheduleBackupForm() {
        return `
            <form id="schedule-backup-form">
                <div class="form-group">
                    <label>Backup Name</label>
                    <input type="text" name="backupName" required>
                </div>
                <div class="form-group">
                    <label>Frequency</label>
                    <select name="frequency" required>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Time</label>
                    <input type="time" name="time" value="02:00" required>
                </div>
                <div class="form-group">
                    <label>Backup Type</label>
                    <select name="backupType" required>
                        <option value="full">Full Backup</option>
                        <option value="incremental">Incremental Backup</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Schedule Backup</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
    }

    editBackupSchedule(scheduleId) {
        this.showNotification(`Editing backup schedule: ${scheduleId}`, 'info');
    }

    deleteBackupSchedule(scheduleId) {
        if (confirm('Are you sure you want to delete this backup schedule?')) {
            this.showNotification(`Backup schedule deleted: ${scheduleId}`, 'success');
        }
    }

    // Emergency Section
    showEmergencySection() {
        this.showSection('emergency');
        this.loadEmergencyData();
    }

    async loadEmergencyData() {
        const content = document.getElementById('emergency-content');
        if (!content) return;

        content.innerHTML = `
            <div class="emergency-warning">
                <div class="warning-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="warning-text">
                    <h2>Emergency Procedures</h2>
                    <p>Use these controls only in emergency situations. All actions are logged and monitored.</p>
                </div>
            </div>
            <div class="emergency-contacts">
                <h3>Emergency Contacts</h3>
                <div class="contacts-grid">
                    <div class="contact-card emergency">
                        <div class="contact-icon">
                            <i class="fas fa-phone"></i>
                        </div>
                        <div class="contact-info">
                            <h4>Emergency Services</h4>
                            <p>+1-911</p>
                            <p class="contact-type">Emergency</p>
                        </div>
                    </div>
                    <div class="contact-card administration">
                        <div class="contact-icon">
                            <i class="fas fa-user-tie"></i>
                        </div>
                        <div class="contact-info">
                            <h4>Hospital Administrator</h4>
                            <p>+1-555-0100</p>
                            <p class="contact-type">Administration</p>
                        </div>
                    </div>
                    <div class="contact-card technical">
                        <div class="contact-icon">
                            <i class="fas fa-tools"></i>
                        </div>
                        <div class="contact-info">
                            <h4>IT Support</h4>
                            <p>+1-555-0101</p>
                            <p class="contact-type">Technical</p>
                        </div>
                    </div>
                    <div class="contact-card security">
                        <div class="contact-icon">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <div class="contact-info">
                            <h4>Security Team</h4>
                            <p>+1-555-0102</p>
                            <p class="contact-type">Security</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="emergency-procedures">
                <h3>Emergency Procedures</h3>
                <div class="procedures-list">
                    <div class="procedure-card high">
                        <div class="procedure-info">
                            <h4>System Lockdown</h4>
                            <p>Immediately lock down all system access and user accounts</p>
                        </div>
                        <button class="btn btn-danger btn-large" onclick="adminDashboard.emergencyLockdown()">
                            <i class="fas fa-lock"></i> EMERGENCY LOCKDOWN
                        </button>
                    </div>
                    <div class="procedure-card critical">
                        <div class="procedure-info">
                            <h4>Data Backup</h4>
                            <p>Create immediate backup of all critical data</p>
                        </div>
                        <button class="btn btn-warning btn-large" onclick="adminDashboard.emergencyBackup()">
                            <i class="fas fa-save"></i> EMERGENCY BACKUP
                        </button>
                    </div>
                    <div class="procedure-card high">
                        <div class="procedure-info">
                            <h4>System Shutdown</h4>
                            <p>Safely shutdown all non-critical systems</p>
                        </div>
                        <button class="btn btn-danger btn-large" onclick="adminDashboard.emergencyShutdown()">
                            <i class="fas fa-power-off"></i> EMERGENCY SHUTDOWN
                        </button>
                    </div>
                </div>
            </div>
            <div class="emergency-actions">
                <button class="btn btn-secondary" onclick="adminDashboard.viewEmergencyLogs()">
                    <i class="fas fa-file-alt"></i> View Emergency Logs
                </button>
                <button class="btn btn-secondary" onclick="adminDashboard.testEmergencySystems()">
                    <i class="fas fa-vial"></i> Test Emergency Systems
                </button>
            </div>
        `;
    }

    emergencyLockdown() {
        if (confirm('EMERGENCY LOCKDOWN: This will immediately lock down all system access. Are you absolutely sure?')) {
            this.showNotification('EMERGENCY LOCKDOWN INITIATED!', 'error');
            setTimeout(() => {
                this.showNotification('System lockdown completed. All access has been restricted.', 'error');
            }, 3000);
        }
    }

    emergencyBackup() {
        if (confirm('Create emergency backup of all critical data?')) {
            this.showNotification('Creating emergency backup...', 'warning');
            setTimeout(() => {
                this.showNotification('Emergency backup completed successfully!', 'success');
            }, 10000);
        }
    }

    emergencyShutdown() {
        if (confirm('EMERGENCY SHUTDOWN: This will shutdown all non-critical systems. Continue?')) {
            this.showNotification('Initiating emergency shutdown...', 'warning');
            setTimeout(() => {
                this.showNotification('Emergency shutdown completed.', 'error');
            }, 5000);
        }
    }

    viewEmergencyLogs() {
        this.showModal('Emergency Logs', this.getEmergencyLogsContent());
    }

    getEmergencyLogsContent() {
        return `
            <div class="logs-container">
                <div class="log-entry">
                    <span class="log-time">14:32:15</span>
                    <span class="log-level error">CRITICAL</span>
                    <span class="log-message">Emergency lockdown initiated by admin@hospital.com</span>
                </div>
                <div class="log-entry">
                    <span class="log-time">14:30:45</span>
                    <span class="log-level warning">WARN</span>
                    <span class="log-message">Multiple failed login attempts detected</span>
                </div>
                <div class="log-entry">
                    <span class="log-time">14:28:12</span>
                    <span class="log-level info">INFO</span>
                    <span class="log-message">Emergency backup completed successfully</span>
                </div>
            </div>
        `;
    }

    testEmergencySystems() {
        this.showNotification('Testing emergency systems...', 'info');
        setTimeout(() => {
            this.showNotification('Emergency systems test completed successfully!', 'success');
        }, 5000);
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

// Enhanced Admin Dashboard Functions for all sections
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
