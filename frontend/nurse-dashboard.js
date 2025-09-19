// Nurse Dashboard - Complete Implementation
class NurseDashboard {
    constructor() {
        this.currentUser = null;
        this.mockData = {
            patients: [],
            medications: [],
            vitalSigns: [],
            nursingNotes: [],
            shiftReports: [],
            emergencyAlerts: [],
            analytics: {}
        };
        this.init();
    }

    async init() {
        await this.loadUserData();
        this.setupEventListeners();
        this.generateMockData();
        this.loadDashboardData();
    }

    async loadUserData() {
        this.currentUser = {
            first_name: 'Nurse',
            last_name: 'User',
            email: 'nurse@hospital.com',
            role: 'nurse',
            shift: 'Day Shift',
            department: 'General Ward'
        };
        this.updateUserInterface();
    }

    updateUserInterface() {
        const userInfo = document.getElementById('user-info');
        if (userInfo && this.currentUser) {
            userInfo.innerHTML = `
                <span class="user-name">${this.currentUser.first_name} ${this.currentUser.last_name}</span>
                <span class="user-role">Nurse - ${this.currentUser.shift}</span>
            `;
        }
    }

    setupEventListeners() {
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('global-search').addEventListener('input', (e) => {
            this.handleGlobalSearch(e.target.value);
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.showSection(section);
            });
        });
    }

    generateMockData() {
        this.mockData.patients = this.generateMockPatients(12);
        this.mockData.medications = this.generateMockMedications(15);
        this.mockData.vitalSigns = this.generateMockVitalSigns(20);
        this.mockData.nursingNotes = this.generateMockNursingNotes(18);
        this.mockData.shiftReports = this.generateMockShiftReports(5);
        this.mockData.emergencyAlerts = this.generateMockEmergencyAlerts(3);
        this.mockData.analytics = this.generateMockAnalytics();
    }

    generateMockPatients(count = 12) {
        const names = ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson', 'Lisa Anderson'];
        const conditions = ['Post-Surgery', 'Fever', 'Hypertension', 'Diabetes', 'Recovery', 'Observation'];
        const statuses = ['Stable', 'Critical', 'Improving', 'Discharge Ready'];
        
        return Array.from({ length: count }, (_, i) => ({
            id: `P${String(i + 1).padStart(3, '0')}`,
            name: names[i % names.length],
            room: `Room ${Math.floor(Math.random() * 20) + 101}`,
            condition: conditions[i % conditions.length],
            status: statuses[i % statuses.length],
            admissionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            lastCheck: '2 hours ago',
            nextDue: '30 minutes'
        }));
    }

    generateMockMedications(count = 15) {
        const medications = ['Paracetamol', 'Ibuprofen', 'Insulin', 'Morphine', 'Antibiotics', 'Pain Relief'];
        const patients = this.mockData.patients;
        const statuses = ['Scheduled', 'Administered', 'Missed', 'Pending'];
        
        return Array.from({ length: count }, (_, i) => ({
            id: `M${String(i + 1).padStart(3, '0')}`,
            patient: patients[i % patients.length]?.name || 'Patient ' + (i + 1),
            medication: medications[i % medications.length],
            dosage: `${Math.floor(Math.random() * 10) + 1}mg`,
            time: `${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 4) * 15).padStart(2, '0')}`,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            notes: 'Administer with food'
        }));
    }

    generateMockVitalSigns(count = 20) {
        const patients = this.mockData.patients;
        
        return Array.from({ length: count }, (_, i) => ({
            id: `V${String(i + 1).padStart(3, '0')}`,
            patient: patients[i % patients.length]?.name || 'Patient ' + (i + 1),
            temperature: (36.5 + Math.random() * 2).toFixed(1),
            bloodPressure: `${Math.floor(Math.random() * 40) + 110}/${Math.floor(Math.random() * 20) + 70}`,
            heartRate: Math.floor(Math.random() * 40) + 60,
            oxygenSaturation: Math.floor(Math.random() * 10) + 95,
            time: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            nurse: this.currentUser.first_name + ' ' + this.currentUser.last_name
        }));
    }

    generateMockNursingNotes(count = 18) {
        const patients = this.mockData.patients;
        const noteTypes = ['Assessment', 'Medication', 'Vital Signs', 'Patient Care', 'Family Communication'];
        
        return Array.from({ length: count }, (_, i) => ({
            id: `N${String(i + 1).padStart(3, '0')}`,
            patient: patients[i % patients.length]?.name || 'Patient ' + (i + 1),
            type: noteTypes[i % noteTypes.length],
            content: 'Patient is stable and responding well to treatment. No concerns noted.',
            time: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
            nurse: this.currentUser.first_name + ' ' + this.currentUser.last_name
        }));
    }

    generateMockShiftReports(count = 5) {
        const shifts = ['Day Shift', 'Evening Shift', 'Night Shift'];
        
        return Array.from({ length: count }, (_, i) => ({
            id: `SR${String(i + 1).padStart(3, '0')}`,
            shift: shifts[i % shifts.length],
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
            patientsCaredFor: Math.floor(Math.random() * 10) + 5,
            medicationsAdministered: Math.floor(Math.random() * 20) + 10,
            incidents: Math.floor(Math.random() * 3),
            notes: 'All patients stable. No incidents to report.'
        }));
    }

    generateMockEmergencyAlerts(count = 3) {
        const types = ['Code Blue', 'Fall Risk', 'Medication Error', 'Equipment Malfunction'];
        const severities = ['High', 'Medium', 'Low'];
        const statuses = ['Active', 'Resolved', 'Escalated'];
        
        return Array.from({ length: count }, (_, i) => ({
            id: `EA${String(i + 1).padStart(3, '0')}`,
            type: types[i % types.length],
            severity: severities[i % severities.length],
            status: statuses[i % statuses.length],
            location: `Room ${Math.floor(Math.random() * 20) + 101}`,
            time: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000).toISOString(),
            description: 'Emergency situation requiring immediate attention'
        }));
    }

    generateMockAnalytics() {
        return {
            totalPatients: this.mockData.patients.length,
            criticalPatients: this.mockData.patients.filter(p => p.status === 'Critical').length,
            medicationsDue: this.mockData.medications.filter(m => m.status === 'Scheduled').length,
            activeAlerts: this.mockData.emergencyAlerts.filter(a => a.status === 'Active').length,
            shiftProgress: 75,
            patientSatisfaction: 92
        };
    }

    loadDashboardData() {
        this.updateDashboardStats();
        this.loadPatientCareData();
    }

    updateDashboardStats() {
        const stats = this.mockData.analytics;
        
        document.getElementById('total-patients').textContent = stats.totalPatients;
        document.getElementById('critical-patients').textContent = stats.criticalPatients;
        document.getElementById('medications-due').textContent = stats.medicationsDue;
        document.getElementById('active-alerts').textContent = stats.activeAlerts;
    }

    loadPatientCareData() {
        this.updatePatientsTable();
    }

    updatePatientsTable() {
        const tbody = document.getElementById('patients-table-body');
        if (!tbody) return;

        const columns = [
            { key: 'id', label: 'Patient ID' },
            { key: 'name', label: 'Name' },
            { key: 'room', label: 'Room' },
            { key: 'condition', label: 'Condition' },
            { key: 'status', label: 'Status', formatter: (value) => `<span class="status-badge ${value.toLowerCase().replace(' ', '-')}">${value}</span>` },
            { key: 'lastCheck', label: 'Last Check' }
        ];

        const actions = [
            { class: 'edit', label: 'View', onclick: 'viewPatientDetails' },
            { class: 'edit', label: 'Update', onclick: 'updatePatientCare' }
        ];

        tbody.innerHTML = dashboardCommon.createTable(this.mockData.patients, columns, actions);
    }

    showSection(sectionId) {
        dashboardCommon.showSection(sectionId);
        
        switch (sectionId) {
            case 'patient-care':
                this.loadPatientCareData();
                break;
            case 'medication-management':
                this.loadMedicationData();
                break;
            case 'vital-signs':
                this.loadVitalSignsData();
                break;
            case 'nursing-notes':
                this.loadNursingNotesData();
                break;
            case 'shift-report':
                this.loadShiftReportData();
                break;
            case 'emergency-alerts':
                this.loadEmergencyAlertsData();
                break;
        }
    }

    loadMedicationData() {
        const tbody = document.getElementById('medications-table-body');
        if (!tbody) return;

        const columns = [
            { key: 'id', label: 'ID' },
            { key: 'patient', label: 'Patient' },
            { key: 'medication', label: 'Medication' },
            { key: 'dosage', label: 'Dosage' },
            { key: 'time', label: 'Time' },
            { key: 'status', label: 'Status', formatter: (value) => `<span class="status-badge ${value.toLowerCase()}">${value}</span>` }
        ];

        const actions = [
            { class: 'edit', label: 'Administer', onclick: 'administerMedication' }
        ];

        tbody.innerHTML = dashboardCommon.createTable(this.mockData.medications, columns, actions);
    }

    loadVitalSignsData() {
        const tbody = document.getElementById('vital-signs-table-body');
        if (!tbody) return;

        const columns = [
            { key: 'id', label: 'ID' },
            { key: 'patient', label: 'Patient' },
            { key: 'temperature', label: 'Temp (°C)' },
            { key: 'bloodPressure', label: 'BP' },
            { key: 'heartRate', label: 'HR' },
            { key: 'oxygenSaturation', label: 'SpO2' },
            { key: 'time', label: 'Time', formatter: (value) => dashboardCommon.formatDateTime(value) }
        ];

        const actions = [
            { class: 'edit', label: 'View History', onclick: 'viewVitalSignsHistory' }
        ];

        tbody.innerHTML = dashboardCommon.createTable(this.mockData.vitalSigns, columns, actions);
    }

    loadNursingNotesData() {
        const tbody = document.getElementById('nursing-notes-table-body');
        if (!tbody) return;

        const columns = [
            { key: 'id', label: 'ID' },
            { key: 'patient', label: 'Patient' },
            { key: 'type', label: 'Type' },
            { key: 'content', label: 'Content', formatter: (value) => value.length > 50 ? value.substring(0, 50) + '...' : value },
            { key: 'time', label: 'Time', formatter: (value) => dashboardCommon.formatDateTime(value) }
        ];

        const actions = [
            { class: 'edit', label: 'Edit', onclick: 'editNursingNote' }
        ];

        tbody.innerHTML = dashboardCommon.createTable(this.mockData.nursingNotes, columns, actions);
    }

    loadShiftReportData() {
        const tbody = document.getElementById('shift-reports-table-body');
        if (!tbody) return;

        const columns = [
            { key: 'id', label: 'Report ID' },
            { key: 'shift', label: 'Shift' },
            { key: 'date', label: 'Date', formatter: (value) => dashboardCommon.formatDate(value) },
            { key: 'patientsCaredFor', label: 'Patients' },
            { key: 'medicationsAdministered', label: 'Medications' },
            { key: 'incidents', label: 'Incidents' }
        ];

        const actions = [
            { class: 'edit', label: 'View Details', onclick: 'viewActivityDetails' }
        ];

        tbody.innerHTML = dashboardCommon.createTable(this.mockData.shiftReports, columns, actions);
    }

    loadEmergencyAlertsData() {
        const tbody = document.getElementById('emergency-alerts-table-body');
        if (!tbody) return;

        const columns = [
            { key: 'id', label: 'Alert ID' },
            { key: 'type', label: 'Type' },
            { key: 'severity', label: 'Severity', formatter: (value) => `<span class="priority-badge ${value.toLowerCase()}">${value}</span>` },
            { key: 'location', label: 'Location' },
            { key: 'status', label: 'Status', formatter: (value) => `<span class="status-badge ${value.toLowerCase()}">${value}</span>` },
            { key: 'time', label: 'Time', formatter: (value) => dashboardCommon.formatDateTime(value) }
        ];

        const actions = [
            { class: 'edit', label: 'Respond', onclick: 'respondToAlert' }
        ];

        tbody.innerHTML = dashboardCommon.createTable(this.mockData.emergencyAlerts, columns, actions);
    }

    handleGlobalSearch(query) {
        if (!query.trim()) return;
        dashboardCommon.showNotification('info', 'Search Results', `Searching for: ${query}`);
    }

    logout() {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }
}

// Global functions for button clicks
function showSection(sectionId) {
    if (window.nurseDashboard) {
        window.nurseDashboard.showSection(sectionId);
    }
}

function showPatientCareModal() {
    dashboardCommon.showNotification('info', 'Patient Care', 'Patient care modal opened');
}

function viewPatientList() {
    dashboardCommon.showNotification('info', 'View Patient List', 'Patient list opened');
}

function showMedicationModal() {
    dashboardCommon.showNotification('info', 'Medication Management', 'Medication modal opened');
}

function viewMedicationSchedule() {
    dashboardCommon.showNotification('info', 'View Medication Schedule', 'Medication schedule opened');
}

function showVitalSignsModal() {
    dashboardCommon.showNotification('info', 'Vital Signs', 'Vital signs modal opened');
}

function viewVitalSignsHistory() {
    dashboardCommon.showNotification('info', 'View Vital Signs History', 'Vital signs history opened');
}

function showNursingNotesModal() {
    dashboardCommon.showNotification('info', 'Nursing Notes', 'Nursing notes modal opened');
}

function exportNursingNotes() {
    dashboardCommon.showNotification('success', 'Export Notes', 'Nursing notes exported successfully');
}

function generateShiftReport() {
    dashboardCommon.showNotification('success', 'Generate Report', 'Shift report generated successfully');
}

function viewPreviousReports() {
    dashboardCommon.showNotification('info', 'View Previous Reports', 'Previous reports opened');
}

function createEmergencyAlert() {
    dashboardCommon.showNotification('info', 'Create Emergency Alert', 'Emergency alert creation modal opened');
}

function viewAlertHistory() {
    dashboardCommon.showNotification('info', 'View Alert History', 'Alert history opened');
}

function viewPatientDetails(id) {
    dashboardCommon.showNotification('info', 'View Patient Details', `Viewing patient details for ${id}`);
}

function updatePatientCare(id) {
    dashboardCommon.showNotification('info', 'Update Patient Care', `Updating patient care for ${id}`);
}

function administerMedication(id) {
    dashboardCommon.showNotification('success', 'Medication Administered', `Medication ${id} administered successfully`);
}

function viewVitalSignsHistory(id) {
    dashboardCommon.showNotification('info', 'View Vital Signs History', `Viewing vital signs history for ${id}`);
}

function editNursingNote(id) {
    dashboardCommon.showNotification('info', 'Edit Nursing Note', `Editing nursing note ${id}`);
}

function viewActivityDetails(id) {
    dashboardCommon.showNotification('info', 'View Activity Details', `Viewing activity details for ${id}`);
}

function respondToAlert(id) {
    dashboardCommon.showNotification('success', 'Alert Response', `Responded to alert ${id}`);
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.nurseDashboard = new NurseDashboard();
});

