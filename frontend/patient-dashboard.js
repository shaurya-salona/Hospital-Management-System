// Patient Dashboard - Implementation
class PatientDashboard {
    constructor() {
        this.currentUser = null;
        this.socket = null;
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

            // Try to get user data from localStorage first (from login)
            const userData = localStorage.getItem('userData');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                this.updateUserInterface();
                return;
            }

            // Fallback: try to get from profile endpoint
            const response = await fetch('http://localhost:5000/api/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                // If profile endpoint fails, use demo data
                this.currentUser = {
                    id: '6',
                    username: 'patient',
                    email: 'patient@hospital.com',
                    first_name: 'Jane',
                    last_name: 'Doe',
                    role: 'patient',
                    phone: '+1234567895',
                    is_active: true
                };
                this.updateUserInterface();
                return;
            }

            const data = await response.json();
            this.currentUser = data.data;
            this.updateUserInterface();
        } catch (error) {
            console.error('Error loading user data:', error);
            // Use demo data as fallback
            this.currentUser = {
                id: '6',
                username: 'patient',
                email: 'patient@hospital.com',
                first_name: 'Jane',
                last_name: 'Doe',
                role: 'patient',
                phone: '+1234567895',
                is_active: true
            };
            this.updateUserInterface();
        }
    }

    updateUserInterface() {
        const userInfo = document.getElementById('user-info');
        if (userInfo && this.currentUser) {
            userInfo.innerHTML = `
                <span class="user-name">${this.currentUser.first_name} ${this.currentUser.last_name}</span>
                <span class="user-role">Patient</span>
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
            case 'overview':
                await this.loadOverview();
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
            case 'billing':
                await this.loadBilling();
                break;
            case 'messages':
                await this.loadMessages();
                break;
        }
    }

    async loadOverview() {
        try {
            const response = await fetch('http://localhost:5000/api/patient-portal/dashboard', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const result = await response.json();
            if (result.success) {
                this.renderOverview(result.data);
            }
        } catch (error) {
            console.error('Error loading overview:', error);
        }
    }

    async loadAppointments() {
        try {
            const status = (document.getElementById('appointment-status-filter') || {}).value || '';
            const url = new URL('/api/patient-portal/appointments', window.location.origin);
            if (status) url.searchParams.set('status', status);

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const result = await response.json();
            if (result.success) {
                this.renderAppointments(result.data);
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
        }
    }

    async loadMedicalRecords() {
        try {
            const response = await fetch('http://localhost:5000/api/patient-portal/medical-records', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const result = await response.json();
            if (result.success) {
                this.renderMedicalRecords(result.data);
            }
        } catch (error) {
            console.error('Error loading medical records:', error);
        }
    }

    async loadPrescriptions() {
        try {
            const status = (document.getElementById('prescription-status-filter') || {}).value || 'active';
            const url = new URL('/api/patient-portal/prescriptions', window.location.origin);
            if (status) url.searchParams.set('status', status);

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const result = await response.json();
            if (result.success) {
                this.renderPrescriptions(result.data);
            }
        } catch (error) {
            console.error('Error loading prescriptions:', error);
        }
    }

    async loadBilling() {
        try {
            const status = (document.getElementById('billing-status-filter') || {}).value || '';
            const url = new URL('/api/patient-portal/billing', window.location.origin);
            if (status) url.searchParams.set('status', status);

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const result = await response.json();
            if (result.success) {
                this.renderBilling(result.data);
            }
        } catch (error) {
            console.error('Error loading billing:', error);
        }
    }

    async loadMessages() {
        try {
            const response = await fetch('http://localhost:5000/api/patient-portal/messages', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const result = await response.json();
            if (result.success) {
                this.renderMessages(result.data);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    // Renderers
    renderOverview(data) {
        const profile = data.patient || {};
        const profileSummary = document.getElementById('profile-summary');
        if (profileSummary) {
            profileSummary.innerHTML = `
                <div class="content-card" style="margin-bottom: 16px;">
                    <div class="profile-grid">
                        <div><strong>Name:</strong> ${profile.firstName || ''} ${profile.lastName || ''}</div>
                        <div><strong>Email:</strong> ${profile.email || ''}</div>
                        <div><strong>Phone:</strong> ${profile.phone || ''}</div>
                        <div><strong>DOB:</strong> ${profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
                        <div><strong>Blood Type:</strong> ${profile.bloodType || 'N/A'}</div>
                    </div>
                </div>
            `;
        }

        // Upcoming appointments
        const upcoming = document.getElementById('upcoming-appointments');
        if (upcoming) {
            const appts = data.upcomingAppointments || [];
            upcoming.innerHTML = appts.length ? appts.map(apt => `
                <div class="appointment-card">
                    <div class="appointment-header">
                        <h4>${apt.reason || 'Consultation'}</h4>
                        <span class="status-badge ${apt.status}">${apt.status}</span>
                    </div>
                    <div class="appointment-details">
                        <p><strong>Date:</strong> ${apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString() : ''}</p>
                        <p><strong>Time:</strong> ${apt.appointment_time || ''}</p>
                        <p><strong>Doctor:</strong> ${[apt.doctor_first_name, apt.doctor_last_name].filter(Boolean).join(' ') || 'N/A'} (${apt.specialization || 'General'})</p>
                    </div>
                    <div class="appointment-actions">
                        ${apt.status === 'scheduled' || apt.status === 'confirmed' ? `<button class="btn btn-sm btn-danger" onclick="patientDashboard.cancelAppointment('${apt.id}')">Cancel</button>` : ''}
                    </div>
                </div>
            `).join('') : '<p>No upcoming appointments.</p>';
        }

        // Active prescriptions (overview)
        const overviewRxBody = document.getElementById('overview-prescriptions');
        if (overviewRxBody) {
            const rx = data.activePrescriptions || [];
            overviewRxBody.innerHTML = rx.length ? rx.map(p => `
                <tr>
                    <td>${p.medication}</td>
                    <td>${p.dosage}</td>
                    <td>${[p.doctor_first_name, p.doctor_last_name].filter(Boolean).join(' ')}</td>
                    <td>${p.start_date ? new Date(p.start_date).toLocaleDateString() : 'N/A'}</td>
                    <td>${p.end_date ? new Date(p.end_date).toLocaleDateString() : 'N/A'}</td>
                </tr>
            `).join('') : '<tr><td colspan="5">No active prescriptions.</td></tr>';
        }

        // Recent records (overview)
        const overviewRecBody = document.getElementById('overview-records');
        if (overviewRecBody) {
            const recs = data.recentRecords || [];
            overviewRecBody.innerHTML = recs.length ? recs.map(r => `
                <tr>
                    <td>${r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</td>
                    <td>${r.type || 'Consultation'}</td>
                    <td>${[r.doctor_first_name, r.doctor_last_name].filter(Boolean).join(' ')}</td>
                    <td>${r.notes ? (r.notes.length > 60 ? r.notes.slice(0, 60) + '…' : r.notes) : '—'}</td>
                </tr>
            `).join('') : '<tr><td colspan="4">No recent records.</td></tr>';
        }

        // Billing summary
        const summary = data.billingSummary || {};
        const totalBills = parseInt(summary.total_bills || 0, 10);
        const pending = Number(summary.pending_amount || 0);
        const paid = Number(summary.paid_amount || 0);
        const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
        setText('summary-total-bills', totalBills);
        setText('summary-pending', `$${pending.toFixed(2)}`);
        setText('summary-paid', `$${paid.toFixed(2)}`);
    }

    renderAppointments(appointments) {
        const grid = document.getElementById('appointments-grid');
        if (!grid) return;
        grid.innerHTML = appointments.length ? appointments.map(apt => `
            <div class="appointment-card">
                <div class="appointment-header">
                    <h4>${apt.reason || 'Consultation'}</h4>
                    <span class="status-badge ${apt.status}">${apt.status}</span>
                </div>
                <div class="appointment-details">
                    <p><strong>Date:</strong> ${apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString() : ''}</p>
                    <p><strong>Time:</strong> ${apt.appointment_time || ''}</p>
                    <p><strong>Doctor:</strong> ${[apt.doctor_first_name, apt.doctor_last_name].filter(Boolean).join(' ') || 'N/A'} (${apt.specialization || 'General'})</p>
                </div>
                <div class="appointment-actions">
                    ${apt.status === 'scheduled' || apt.status === 'confirmed' ? `<button class="btn btn-sm btn-danger" onclick=\"patientDashboard.cancelAppointment('${apt.id}')\">Cancel</button>` : ''}
                </div>
            </div>
        `).join('') : '<p>No appointments found.</p>';
    }

    renderMedicalRecords(records) {
        const tbody = document.getElementById('medical-records-table-body');
        if (!tbody) return;
        tbody.innerHTML = records.length ? records.map(r => `
            <tr>
                <td>${r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</td>
                <td>${r.type || 'Consultation'}</td>
                <td>${[r.doctor_first_name, r.doctor_last_name].filter(Boolean).join(' ')}</td>
                <td>${r.diagnosis || 'N/A'}</td>
                <td><span class="status-badge ${r.status || 'active'}">${r.status || 'Active'}</span></td>
            </tr>
        `).join('') : '<tr><td colspan="5">No medical records found.</td></tr>';
    }

    renderPrescriptions(prescriptions) {
        const tbody = document.getElementById('prescriptions-table-body');
        if (!tbody) return;
        tbody.innerHTML = prescriptions.length ? prescriptions.map(p => `
            <tr>
                <td>${p.medication}</td>
                <td>${p.dosage}</td>
                <td>${[p.doctor_first_name, p.doctor_last_name].filter(Boolean).join(' ')}</td>
                <td>${p.start_date ? new Date(p.start_date).toLocaleDateString() : 'N/A'}</td>
                <td>${p.end_date ? new Date(p.end_date).toLocaleDateString() : 'N/A'}</td>
                <td><span class="status-badge ${p.status}">${p.status}</span></td>
                <td>
                    ${p.status === 'active' ? `<button class="btn btn-sm btn-primary" onclick=\"patientDashboard.requestRefill('${p.id}')\">Request Refill</button>` : ''}
                </td>
            </tr>
        `).join('') : '<tr><td colspan="7">No prescriptions found.</td></tr>';
    }

    renderBilling(billing) {
        const tbody = document.getElementById('billing-table-body');
        if (!tbody) return;
        tbody.innerHTML = billing.length ? billing.map(b => `
            <tr>
                <td>${b.bill_number || b.id}</td>
                <td>${b.created_at ? new Date(b.created_at).toLocaleDateString() : ''}</td>
                <td>${[b.doctor_first_name, b.doctor_last_name].filter(Boolean).join(' ') || 'N/A'}</td>
                <td>${dashboardCommon.formatCurrency(b.amount || 0)}</td>
                <td><span class="status-badge ${b.status}">${b.status}</span></td>
            </tr>
        `).join('') : '<tr><td colspan="5">No billing records found.</td></tr>';
    }

    renderMessages(messages) {
        const tbody = document.getElementById('messages-table-body');
        if (!tbody) return;
        tbody.innerHTML = messages.length ? messages.map(m => `
            <tr>
                <td>${m.created_at ? new Date(m.created_at).toLocaleString() : ''}</td>
                <td>${[m.sender_first_name, m.sender_last_name].filter(Boolean).join(' ')}</td>
                <td>${m.sender_role || 'N/A'}</td>
                <td>${m.message || ''}</td>
            </tr>
        `).join('') : '<tr><td colspan="4">No messages.</td></tr>';
    }

    // Actions
    async cancelAppointment(appointmentId) {
        try {
            if (!confirm('Cancel this appointment?')) return;
            const response = await fetch(`/api/patient-portal/appointments/${appointmentId}/cancel`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const result = await response.json();
            if (result.success) {
                this.showNotification('Appointment cancelled', 'success');
                await this.loadAppointments();
                await this.loadOverview();
            } else {
                this.showNotification(result.message || 'Failed to cancel', 'error');
            }
        } catch (error) {
            console.error('Cancel appointment error:', error);
            this.showNotification('Cancel failed', 'error');
        }
    }

    async requestRefill(prescriptionId) {
        try {
            const response = await fetch(`/api/patient-portal/prescriptions/${prescriptionId}/refill`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const result = await response.json();
            if (result.success) {
                this.showNotification('Refill requested', 'success');
            } else {
                this.showNotification(result.message || 'Refill request failed', 'error');
            }
        } catch (error) {
            console.error('Refill request error:', error);
            this.showNotification('Refill request failed', 'error');
        }
    }

    // Sockets and events
    initializeWebSocket() {
        try {
            this.socket = io('http://localhost:5000');
            this.socket.on('connect', () => {
                try {
                    this.socket.emit('join-room', {
                        userId: this.currentUser?.id,
                        role: 'patient'
                    });
                } catch {}
            });
            this.socket.on('notification', (notification) => {
                this.showNotification(notification.message);
            });
        } catch (error) {
            console.error('WebSocket connection error:', error);
        }
    }

    setupEventListeners() {
        const globalSearch = document.getElementById('global-search');
        if (globalSearch) {
            globalSearch.addEventListener('input', this.handleGlobalSearch.bind(this));
        }
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.logout.bind(this));
        }

        const appointmentFilter = document.getElementById('appointment-status-filter');
        if (appointmentFilter) {
            appointmentFilter.addEventListener('change', () => this.loadAppointments());
        }
        const rxFilter = document.getElementById('prescription-status-filter');
        if (rxFilter) {
            rxFilter.addEventListener('change', () => this.loadPrescriptions());
        }
        const billingFilter = document.getElementById('billing-status-filter');
        if (billingFilter) {
            billingFilter.addEventListener('change', () => this.loadBilling());
        }
    }

    handleGlobalSearch(event) {
        const query = (event.target.value || '').toLowerCase();
        console.log('Global search:', query);
    }

    logout() {
        localStorage.removeItem('token');
        window.location.href = 'patient-login.html';
    }

    // UI helpers
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
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
        window.location.href = 'patient-login.html';
    }

    async loadDashboardData() {
        const activeSection = document.querySelector('.dashboard-section.active');
        if (activeSection) {
            await this.loadSectionData(activeSection.id);
        }
    }
}

// Dashboard will be initialized by the HTML authentication validation
// No automatic instantiation to prevent conflicts with auth validation


