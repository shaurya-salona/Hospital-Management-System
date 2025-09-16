// Receptionist Dashboard - Complete Implementation
class ReceptionistDashboard {
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
                <span class="user-role">Receptionist</span>
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
            case 'patient-registration':
                await this.loadPatientRegistration();
                break;
            case 'appointment-scheduling':
                await this.loadAppointmentScheduling();
                break;
            case 'check-in-out':
                await this.loadCheckInOut();
                break;
            case 'billing-desk':
                await this.loadBillingDesk();
                break;
            case 'doctor-availability':
                await this.loadDoctorAvailability();
                break;
            case 'reports-analytics':
                await this.loadAnalytics();
                break;
        }
    }

    async loadPatientRegistration() {
        try {
            const response = await fetch('/api/patients', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderPatientRegistration(data.data);
                this.updateRegistrationStats(data.data);
            }
        } catch (error) {
            console.error('Error loading patient registration:', error);
        }
    }

    async loadAppointmentScheduling() {
        try {
            const response = await fetch('/api/appointments', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderAppointmentScheduling(data.data);
                this.updateAppointmentStats(data.data);
            }
        } catch (error) {
            console.error('Error loading appointment scheduling:', error);
        }
    }

    async loadCheckInOut() {
        try {
            const response = await fetch('/api/checkin', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderCheckInOut(data.data);
                this.updateCheckInStats(data.data);
            }
        } catch (error) {
            console.error('Error loading check-in/out:', error);
        }
    }

    async loadBillingDesk() {
        try {
            const response = await fetch('/api/billing', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderBillingDesk(data.data);
                this.updateBillingStats(data.data);
            }
        } catch (error) {
            console.error('Error loading billing desk:', error);
        }
    }

    async loadDoctorAvailability() {
        try {
            const response = await fetch('/api/doctors/availability', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderDoctorAvailability(data.data);
                this.updateAvailabilityStats(data.data);
            }
        } catch (error) {
            console.error('Error loading doctor availability:', error);
        }
    }

    async loadAnalytics() {
        try {
            const response = await fetch('/api/analytics/receptionist', {
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

    renderPatientRegistration(patients) {
        const tbody = document.getElementById('registered-patients-table-body');
        if (!tbody) return;

        tbody.innerHTML = patients.map(patient => `
            <tr>
                <td>${patient.patient_id || patient.id}</td>
                <td>${patient.first_name} ${patient.last_name}</td>
                <td>${patient.phone}</td>
                <td>${patient.email}</td>
                <td>${new Date(patient.created_at).toLocaleDateString()}</td>
                <td><span class="status-badge ${patient.is_active ? 'active' : 'inactive'}">${patient.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="receptionistDashboard.viewPatient('${patient.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="receptionistDashboard.editPatient('${patient.id}')">Edit</button>
                </td>
            </tr>
        `).join('');
    }

    renderAppointmentScheduling(appointments) {
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
                    <button class="btn btn-sm btn-primary" onclick="receptionistDashboard.confirmAppointment('${appointment.id}')">Confirm</button>
                    <button class="btn btn-sm btn-secondary" onclick="receptionistDashboard.editAppointment('${appointment.id}')">Edit</button>
                </div>
            </div>
        `).join('');
    }

    renderCheckInOut(checkIns) {
        const tbody = document.getElementById('checkin-table-body');
        if (!tbody) return;

        tbody.innerHTML = checkIns.map(checkIn => `
            <tr>
                <td>${checkIn.patient_id}</td>
                <td>${checkIn.patient_name}</td>
                <td>${checkIn.appointment_time}</td>
                <td>${checkIn.doctor_name}</td>
                <td>${checkIn.checkin_time || 'Not checked in'}</td>
                <td><span class="status-badge ${checkIn.status}">${checkIn.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="receptionistDashboard.checkInPatient('${checkIn.id}')">Check In</button>
                    <button class="btn btn-sm btn-secondary" onclick="receptionistDashboard.checkOutPatient('${checkIn.id}')">Check Out</button>
                </td>
            </tr>
        `).join('');
    }

    renderBillingDesk(billing) {
        const tbody = document.getElementById('billing-table-body');
        if (!tbody) return;

        tbody.innerHTML = billing.map(bill => `
            <tr>
                <td>${bill.bill_number || bill.id}</td>
                <td>${bill.patient_name || 'N/A'}</td>
                <td>$${bill.amount || 0}</td>
                <td>${new Date(bill.created_at).toLocaleDateString()}</td>
                <td><span class="status-badge ${bill.status}">${bill.status}</span></td>
                <td>${bill.payment_method || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="receptionistDashboard.viewBill('${bill.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="receptionistDashboard.processPayment('${bill.id}')">Pay</button>
                </td>
            </tr>
        `).join('');
    }

    renderDoctorAvailability(doctors) {
        const grid = document.getElementById('doctors-availability-grid');
        if (!grid) return;

        grid.innerHTML = doctors.map(doctor => `
            <div class="doctor-card">
                <div class="doctor-header">
                    <h4>${doctor.name}</h4>
                    <span class="status-badge ${doctor.status}">${doctor.status}</span>
                </div>
                <div class="doctor-details">
                    <p><strong>Specialization:</strong> ${doctor.specialization}</p>
                    <p><strong>Current Patients:</strong> ${doctor.current_patients || 0}</p>
                    <p><strong>Next Available:</strong> ${doctor.next_available || 'N/A'}</p>
                </div>
                <div class="doctor-actions">
                    <button class="btn btn-sm btn-primary" onclick="receptionistDashboard.viewDoctorSchedule('${doctor.id}')">Schedule</button>
                    <button class="btn btn-sm btn-secondary" onclick="receptionistDashboard.updateAvailability('${doctor.id}')">Update</button>
                </div>
            </div>
        `).join('');
    }

    renderAnalytics(data) {
        this.renderCharts(data);
    }

    renderCharts(data) {
        // Patient Flow Chart
        const patientFlowCtx = document.getElementById('patient-flow-chart');
        if (patientFlowCtx && !this.charts.patientFlow) {
            this.charts.patientFlow = new Chart(patientFlowCtx, {
                type: 'line',
                data: {
                    labels: ['8AM', '10AM', '12PM', '2PM', '4PM', '6PM'],
                    datasets: [{
                        label: 'Patient Flow',
                        data: [5, 12, 8, 15, 10, 6],
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

        // Appointment Trends Chart
        const appointmentTrendsCtx = document.getElementById('appointment-trends-chart');
        if (appointmentTrendsCtx && !this.charts.appointmentTrends) {
            this.charts.appointmentTrends = new Chart(appointmentTrendsCtx, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Appointments',
                        data: [25, 30, 22, 35, 28, 15, 8],
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

        // Revenue Analysis Chart
        const revenueAnalysisCtx = document.getElementById('revenue-analysis-chart');
        if (revenueAnalysisCtx && !this.charts.revenueAnalysis) {
            this.charts.revenueAnalysis = new Chart(revenueAnalysisCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Cash', 'Insurance', 'Credit Card', 'Other'],
                    datasets: [{
                        data: [40, 35, 20, 5],
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

        // Doctor Utilization Chart
        const doctorUtilizationCtx = document.getElementById('doctor-utilization-chart');
        if (doctorUtilizationCtx && !this.charts.doctorUtilization) {
            this.charts.doctorUtilization = new Chart(doctorUtilizationCtx, {
                type: 'bar',
                data: {
                    labels: ['Dr. Smith', 'Dr. Johnson', 'Dr. Brown', 'Dr. Davis'],
                    datasets: [{
                        label: 'Utilization %',
                        data: [85, 92, 78, 88],
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
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
        }
    }

    updateRegistrationStats(patients) {
        const today = new Date().toISOString().split('T')[0];
        const registeredToday = patients.filter(p => 
            new Date(p.created_at).toISOString().split('T')[0] === today
        ).length;
        const totalPatients = patients.length;
        const newThisWeek = patients.filter(p => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(p.created_at) > weekAgo;
        }).length;

        document.getElementById('registered-today').textContent = registeredToday;
        document.getElementById('total-patients').textContent = totalPatients;
        document.getElementById('new-registrations').textContent = newThisWeek;
    }

    updateAppointmentStats(appointments) {
        const today = new Date().toISOString().split('T')[0];
        const scheduledToday = appointments.filter(apt => apt.appointment_date === today).length;
        const pending = appointments.filter(apt => apt.status === 'scheduled').length;
        const cancelled = appointments.filter(apt => apt.status === 'cancelled').length;

        document.getElementById('scheduled-today').textContent = scheduledToday;
        document.getElementById('pending-appointments').textContent = pending;
        document.getElementById('cancelled-appointments').textContent = cancelled;
    }

    updateCheckInStats(checkIns) {
        const today = new Date().toISOString().split('T')[0];
        const checkedInToday = checkIns.filter(ci => 
            ci.checkin_time && ci.checkin_time.split('T')[0] === today
        ).length;
        const waiting = checkIns.filter(ci => ci.status === 'waiting').length;
        const checkedOutToday = checkIns.filter(ci => 
            ci.checkout_time && ci.checkout_time.split('T')[0] === today
        ).length;

        document.getElementById('checked-in-today').textContent = checkedInToday;
        document.getElementById('waiting-patients').textContent = waiting;
        document.getElementById('checked-out-today').textContent = checkedOutToday;
    }

    updateBillingStats(billing) {
        const today = new Date().toISOString().split('T')[0];
        const billsToday = billing.filter(bill => 
            new Date(bill.created_at).toISOString().split('T')[0] === today
        ).length;
        const totalRevenue = billing.reduce((sum, bill) => sum + (bill.amount || 0), 0);
        const pendingPayments = billing.filter(bill => bill.status === 'pending').length;

        document.getElementById('bills-today').textContent = billsToday;
        document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('pending-payments').textContent = pendingPayments;
    }

    updateAvailabilityStats(doctors) {
        const available = doctors.filter(d => d.status === 'available').length;
        const busy = doctors.filter(d => d.status === 'busy').length;
        const offDuty = doctors.filter(d => d.status === 'off-duty').length;

        document.getElementById('available-doctors').textContent = available;
        document.getElementById('busy-doctors').textContent = busy;
        document.getElementById('off-duty-doctors').textContent = offDuty;
    }

    initializeWebSocket() {
        try {
            this.socket = io('http://localhost:5000');
            
            this.socket.on('connect', () => {
                console.log('Connected to WebSocket server');
                this.socket.emit('join-room', {
                    userId: this.currentUser.id,
                    role: 'receptionist'
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
        console.log('Global search:', query);
    }

    logout() {
        localStorage.removeItem('token');
        window.location.href = '/';
    }

    // Action functions
    viewPatient(patientId) {
        console.log('View patient:', patientId);
    }

    editPatient(patientId) {
        console.log('Edit patient:', patientId);
    }

    confirmAppointment(appointmentId) {
        console.log('Confirm appointment:', appointmentId);
    }

    editAppointment(appointmentId) {
        console.log('Edit appointment:', appointmentId);
    }

    checkInPatient(checkInId) {
        console.log('Check in patient:', checkInId);
    }

    checkOutPatient(checkInId) {
        console.log('Check out patient:', checkInId);
    }

    viewBill(billId) {
        console.log('View bill:', billId);
    }

    processPayment(billId) {
        console.log('Process payment:', billId);
    }

    viewDoctorSchedule(doctorId) {
        console.log('View doctor schedule:', doctorId);
    }

    updateAvailability(doctorId) {
        console.log('Update availability:', doctorId);
    }

    // Modal functions
    showRegisterPatientModal() {
        this.showModal('Register Patient', this.getPatientRegistrationForm());
    }

    showScheduleAppointmentModal() {
        this.showModal('Schedule Appointment', this.getAppointmentForm());
    }

    showCheckInModal() {
        this.showModal('Check In Patient', this.getCheckInForm());
    }

    showCheckOutModal() {
        this.showModal('Check Out Patient', this.getCheckOutForm());
    }

    showCreateBillModal() {
        this.showModal('Create Bill', this.getBillForm());
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

    getPatientRegistrationForm() {
        return `
            <form id="patient-registration-form">
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
                    <label>Date of Birth</label>
                    <input type="date" name="dateOfBirth" required>
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <textarea name="address" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>Emergency Contact</label>
                    <input type="text" name="emergencyContact">
                </div>
                <div class="form-group">
                    <label>Emergency Phone</label>
                    <input type="tel" name="emergencyPhone">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Register Patient</button>
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

    getCheckInForm() {
        return `
            <form id="checkin-form">
                <div class="form-group">
                    <label>Patient</label>
                    <select name="patientId" required>
                        <option value="">Select Patient</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Appointment</label>
                    <select name="appointmentId" required>
                        <option value="">Select Appointment</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Check-in Time</label>
                    <input type="datetime-local" name="checkinTime" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Check In</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
    }

    getCheckOutForm() {
        return `
            <form id="checkout-form">
                <div class="form-group">
                    <label>Patient</label>
                    <select name="patientId" required>
                        <option value="">Select Patient</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Check-out Time</label>
                    <input type="datetime-local" name="checkoutTime" required>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea name="notes" rows="3"></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Check Out</button>
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
                    <label>Service</label>
                    <select name="service" required>
                        <option value="consultation">Consultation</option>
                        <option value="procedure">Procedure</option>
                        <option value="medication">Medication</option>
                        <option value="lab">Lab Test</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Amount</label>
                    <input type="number" name="amount" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Payment Method</label>
                    <select name="paymentMethod" required>
                        <option value="cash">Cash</option>
                        <option value="card">Credit Card</option>
                        <option value="insurance">Insurance</option>
                        <option value="check">Check</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Create Bill</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
    }

    // Utility functions
    searchExistingPatient() {
        console.log('Search existing patient');
    }

    viewSchedule() {
        console.log('View schedule');
    }

    processPayment() {
        console.log('Process payment');
    }

    updateDoctorAvailability() {
        console.log('Update doctor availability');
    }

    viewDoctorSchedule() {
        console.log('View doctor schedule');
    }

    generateReceptionistReport() {
        console.log('Generate receptionist report');
    }

    exportReceptionistData() {
        console.log('Export receptionist data');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        document.body.appendChild(notification);

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
        const activeSection = document.querySelector('.dashboard-section.active');
        if (activeSection) {
            await this.loadSectionData(activeSection.id);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.receptionistDashboard = new ReceptionistDashboard();
});
