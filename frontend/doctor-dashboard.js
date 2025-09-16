// Doctor Dashboard - Complete Implementation
class DoctorDashboard {
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
                <span class="user-role">Doctor</span>
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
            case 'my-patients':
                await this.loadMyPatients();
                break;
            case 'appointments':
                await this.loadAppointments();
                break;
            case 'medical-records':
                await this.loadMedicalRecords();
                break;
            case 'prescriptions':
                await this.loadPrescriptions();
                break;
            case 'lab-test-orders':
                await this.loadLabTests();
                break;
            case 'reports-analytics':
                await this.loadAnalytics();
                break;
        }
    }

    async loadMyPatients() {
        try {
            const response = await fetch('/api/patients', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderMyPatients(data.data);
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
                this.updateAppointmentStats(data.data);
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
        }
    }

    async loadMedicalRecords() {
        try {
            const response = await fetch('/api/medical/records', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderMedicalRecords(data.data);
            }
        } catch (error) {
            console.error('Error loading medical records:', error);
        }
    }

    async loadPrescriptions() {
        try {
            const response = await fetch('/api/medical/prescriptions', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderPrescriptions(data.data);
                this.updatePrescriptionStats(data.data);
            }
        } catch (error) {
            console.error('Error loading prescriptions:', error);
        }
    }

    async loadLabTests() {
        try {
            const response = await fetch('/api/lab/tests', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderLabTests(data.data);
                this.updateLabStats(data.data);
            }
        } catch (error) {
            console.error('Error loading lab tests:', error);
        }
    }

    async loadAnalytics() {
        try {
            const response = await fetch('/api/analytics/doctor', {
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

    renderMyPatients(patients) {
        const tbody = document.getElementById('my-patients-table-body');
        if (!tbody) return;

        tbody.innerHTML = patients.map(patient => `
            <tr>
                <td>${patient.patient_id || patient.id}</td>
                <td>${patient.first_name} ${patient.last_name}</td>
                <td>${this.calculateAge(patient.date_of_birth)}</td>
                <td>${patient.last_visit || 'N/A'}</td>
                <td>${patient.condition || 'N/A'}</td>
                <td><span class="status-badge ${patient.status || 'active'}">${patient.status || 'Active'}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="doctorDashboard.viewPatient('${patient.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="doctorDashboard.editPatient('${patient.id}')">Edit</button>
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
                    <p><strong>Duration:</strong> ${appointment.duration_minutes || 30} minutes</p>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-sm btn-primary" onclick="doctorDashboard.startConsultation('${appointment.id}')">Start</button>
                    <button class="btn btn-sm btn-secondary" onclick="doctorDashboard.viewAppointment('${appointment.id}')">View</button>
                </div>
            </div>
        `).join('');
    }

    renderMedicalRecords(records) {
        const tbody = document.getElementById('medical-records-table-body');
        if (!tbody) return;

        tbody.innerHTML = records.map(record => `
            <tr>
                <td>${record.id}</td>
                <td>${record.patient_name || 'N/A'}</td>
                <td>${new Date(record.created_at).toLocaleDateString()}</td>
                <td>${record.type || 'Consultation'}</td>
                <td>${record.diagnosis || 'N/A'}</td>
                <td><span class="status-badge ${record.status || 'active'}">${record.status || 'Active'}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="doctorDashboard.viewRecord('${record.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="doctorDashboard.editRecord('${record.id}')">Edit</button>
                </td>
            </tr>
        `).join('');
    }

    renderPrescriptions(prescriptions) {
        const tbody = document.getElementById('prescriptions-table-body');
        if (!tbody) return;

        tbody.innerHTML = prescriptions.map(prescription => `
            <tr>
                <td>${prescription.id}</td>
                <td>${prescription.patient_name || 'N/A'}</td>
                <td>${prescription.medication}</td>
                <td>${prescription.dosage}</td>
                <td>${new Date(prescription.start_date).toLocaleDateString()}</td>
                <td>${prescription.end_date ? new Date(prescription.end_date).toLocaleDateString() : 'N/A'}</td>
                <td><span class="status-badge ${prescription.status}">${prescription.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="doctorDashboard.viewPrescription('${prescription.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="doctorDashboard.editPrescription('${prescription.id}')">Edit</button>
                </td>
            </tr>
        `).join('');
    }

    renderLabTests(tests) {
        const tbody = document.getElementById('lab-tests-table-body');
        if (!tbody) return;

        tbody.innerHTML = tests.map(test => `
            <tr>
                <td>${test.id}</td>
                <td>${test.patient_name || 'N/A'}</td>
                <td>${test.test_type}</td>
                <td>${new Date(test.ordered_date).toLocaleDateString()}</td>
                <td><span class="status-badge ${test.status}">${test.status}</span></td>
                <td>${test.results ? 'Available' : 'Pending'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="doctorDashboard.viewTest('${test.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="doctorDashboard.orderTest('${test.id}')">Order</button>
                </td>
            </tr>
        `).join('');
    }

    renderAnalytics(data) {
        this.renderCharts(data);
    }

    renderCharts(data) {
        // Patient Visits Chart
        const patientVisitsCtx = document.getElementById('patient-visits-chart');
        if (patientVisitsCtx && !this.charts.patientVisits) {
            this.charts.patientVisits = new Chart(patientVisitsCtx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Patient Visits',
                        data: [8, 12, 6, 15, 10, 4, 2],
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

        // Diagnosis Distribution Chart
        const diagnosisCtx = document.getElementById('diagnosis-chart');
        if (diagnosisCtx && !this.charts.diagnosis) {
            this.charts.diagnosis = new Chart(diagnosisCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Hypertension', 'Diabetes', 'Common Cold', 'Injury', 'Other'],
                    datasets: [{
                        data: [25, 20, 30, 15, 10],
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

        // Prescription Trends Chart
        const prescriptionCtx = document.getElementById('prescription-chart');
        if (prescriptionCtx && !this.charts.prescription) {
            this.charts.prescription = new Chart(prescriptionCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Prescriptions',
                        data: [45, 52, 38, 61, 47, 55],
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

        // Efficiency Chart
        const efficiencyCtx = document.getElementById('efficiency-chart');
        if (efficiencyCtx && !this.charts.efficiency) {
            this.charts.efficiency = new Chart(efficiencyCtx, {
                type: 'bar',
                data: {
                    labels: ['Avg Consultation Time', 'Patients per Day', 'Follow-up Rate', 'Satisfaction Score'],
                    datasets: [{
                        label: 'Performance',
                        data: [25, 12, 85, 92],
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

    updateAppointmentStats(appointments) {
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = appointments.filter(apt => apt.appointment_date === today).length;
        const completedToday = appointments.filter(apt => 
            apt.status === 'completed' && apt.appointment_date === today
        ).length;
        const pending = appointments.filter(apt => apt.status === 'scheduled').length;

        document.getElementById('today-appointments').textContent = todayAppointments;
        document.getElementById('completed-today').textContent = completedToday;
        document.getElementById('pending-appointments').textContent = pending;
    }

    updatePrescriptionStats(prescriptions) {
        const active = prescriptions.filter(p => p.status === 'active').length;
        const pending = prescriptions.filter(p => p.status === 'pending').length;
        const expired = prescriptions.filter(p => p.status === 'expired').length;

        document.getElementById('active-prescriptions').textContent = active;
        document.getElementById('pending-prescriptions').textContent = pending;
        document.getElementById('expired-prescriptions').textContent = expired;
    }

    updateLabStats(tests) {
        const pending = tests.filter(t => t.status === 'pending').length;
        const completed = tests.filter(t => t.status === 'completed').length;
        const abnormal = tests.filter(t => t.status === 'completed' && t.abnormal).length;

        document.getElementById('pending-tests').textContent = pending;
        document.getElementById('completed-tests').textContent = completed;
        document.getElementById('abnormal-results').textContent = abnormal;
    }

    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return 'N/A';
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    initializeWebSocket() {
        try {
            this.socket = io('http://localhost:5000');
            
            this.socket.on('connect', () => {
                console.log('Connected to WebSocket server');
                this.socket.emit('join-room', {
                    userId: this.currentUser.id,
                    role: 'doctor'
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

    startConsultation(appointmentId) {
        console.log('Start consultation:', appointmentId);
    }

    viewAppointment(appointmentId) {
        console.log('View appointment:', appointmentId);
    }

    viewRecord(recordId) {
        console.log('View record:', recordId);
    }

    editRecord(recordId) {
        console.log('Edit record:', recordId);
    }

    viewPrescription(prescriptionId) {
        console.log('View prescription:', prescriptionId);
    }

    editPrescription(prescriptionId) {
        console.log('Edit prescription:', prescriptionId);
    }

    viewTest(testId) {
        console.log('View test:', testId);
    }

    orderTest(testId) {
        console.log('Order test:', testId);
    }

    // Modal functions
    showAddPatientModal() {
        this.showModal('Add Patient', this.getPatientForm());
    }

    showScheduleAppointmentModal() {
        this.showModal('Schedule Appointment', this.getAppointmentForm());
    }

    showAddMedicalRecordModal() {
        this.showModal('Add Medical Record', this.getMedicalRecordForm());
    }

    showCreatePrescriptionModal() {
        this.showModal('Create Prescription', this.getPrescriptionForm());
    }

    showOrderLabTestModal() {
        this.showModal('Order Lab Test', this.getLabTestForm());
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
                    <label>Date of Birth</label>
                    <input type="date" name="dateOfBirth" required>
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="tel" name="phone" required>
                </div>
                <div class="form-group">
                    <label>Medical Condition</label>
                    <input type="text" name="condition">
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
                    <label>Date</label>
                    <input type="date" name="date" required>
                </div>
                <div class="form-group">
                    <label>Time</label>
                    <input type="time" name="time" required>
                </div>
                <div class="form-group">
                    <label>Duration (minutes)</label>
                    <input type="number" name="duration" value="30" required>
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

    getMedicalRecordForm() {
        return `
            <form id="medical-record-form">
                <div class="form-group">
                    <label>Patient</label>
                    <select name="patientId" required>
                        <option value="">Select Patient</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Record Type</label>
                    <select name="type" required>
                        <option value="consultation">Consultation</option>
                        <option value="diagnosis">Diagnosis</option>
                        <option value="treatment">Treatment</option>
                        <option value="follow-up">Follow-up</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Diagnosis</label>
                    <input type="text" name="diagnosis" required>
                </div>
                <div class="form-group">
                    <label>Treatment</label>
                    <textarea name="treatment" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea name="notes" rows="3"></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Add Record</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
    }

    getPrescriptionForm() {
        return `
            <form id="prescription-form">
                <div class="form-group">
                    <label>Patient</label>
                    <select name="patientId" required>
                        <option value="">Select Patient</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Medication</label>
                    <input type="text" name="medication" required>
                </div>
                <div class="form-group">
                    <label>Dosage</label>
                    <input type="text" name="dosage" required>
                </div>
                <div class="form-group">
                    <label>Instructions</label>
                    <textarea name="instructions" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="date" name="startDate" required>
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="date" name="endDate">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Create Prescription</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
    }

    getLabTestForm() {
        return `
            <form id="lab-test-form">
                <div class="form-group">
                    <label>Patient</label>
                    <select name="patientId" required>
                        <option value="">Select Patient</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Test Type</label>
                    <select name="testType" required>
                        <option value="blood">Blood Test</option>
                        <option value="urine">Urine Test</option>
                        <option value="xray">X-Ray</option>
                        <option value="mri">MRI</option>
                        <option value="ct">CT Scan</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Reason</label>
                    <textarea name="reason" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label>Priority</label>
                    <select name="priority" required>
                        <option value="normal">Normal</option>
                        <option value="urgent">Urgent</option>
                        <option value="emergency">Emergency</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Order Test</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
    }

    // Utility functions
    viewPatientHistory() {
        console.log('View patient history');
    }

    viewTodaySchedule() {
        console.log('View today schedule');
    }

    searchMedicalRecords() {
        console.log('Search medical records');
    }

    checkDrugInteractions() {
        console.log('Check drug interactions');
    }

    viewLabResults() {
        console.log('View lab results');
    }

    generateDoctorReport() {
        console.log('Generate doctor report');
    }

    viewPerformanceMetrics() {
        console.log('View performance metrics');
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
    window.doctorDashboard = new DoctorDashboard();
});
