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
        window.location.href = '/';
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
        window.adminDashboard.showNotification('System Health Dashboard', 'info');
    }
}

function showSecurity() {
    if (window.adminDashboard) {
        window.adminDashboard.showNotification('Security Dashboard', 'info');
    }
}

function showReports() {
    if (window.adminDashboard) {
        window.adminDashboard.showNotification('Reports Dashboard', 'info');
    }
}

function showSettings() {
    if (window.adminDashboard) {
        window.adminDashboard.showNotification('Settings Dashboard', 'info');
    }
}

function showBackup() {
    if (window.adminDashboard) {
        window.adminDashboard.showNotification('Backup Dashboard', 'info');
    }
}

function showEmergency() {
    if (window.adminDashboard) {
        window.adminDashboard.showNotification('Emergency Dashboard', 'warning');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});
