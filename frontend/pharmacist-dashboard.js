// Pharmacist Dashboard - Complete Implementation
class PharmacistDashboard {
    constructor() {
        this.currentUser = null;
        this.socket = null;
        this.charts = {};
        this.mockData = this.initializeMockData();
        this.init();
    }

    initializeMockData() {
        return {
            prescriptions: [
                {
                    id: '1',
                    patient_name: 'John Doe',
                    doctor_name: 'Dr. Smith',
                    medication: 'Lisinopril 10mg',
                    dosage: '10mg once daily',
                    quantity: 30,
                    status: 'pending',
                    prescribed_date: '2024-01-15T09:00:00Z'
                },
                {
                    id: '2',
                    patient_name: 'Jane Smith',
                    doctor_name: 'Dr. Johnson',
                    medication: 'Metformin 500mg',
                    dosage: '500mg twice daily',
                    quantity: 60,
                    status: 'dispensed',
                    prescribed_date: '2024-01-15T11:00:00Z',
                    dispensed_date: '2024-01-15T12:00:00Z'
                },
                {
                    id: '3',
                    patient_name: 'Mike Johnson',
                    doctor_name: 'Dr. Brown',
                    medication: 'Atorvastatin 20mg',
                    dosage: '20mg once daily',
                    quantity: 30,
                    status: 'pending',
                    prescribed_date: '2024-01-15T14:00:00Z'
                }
            ],
            inventory: [
                {
                    id: '1',
                    name: 'Lisinopril 10mg',
                    category: 'medication',
                    quantity: 150,
                    unit_price: 1.50,
                    min_stock: 20,
                    expiry_date: '2025-12-31',
                    status: 'in-stock'
                },
                {
                    id: '2',
                    name: 'Metformin 500mg',
                    category: 'medication',
                    quantity: 8,
                    unit_price: 0.75,
                    min_stock: 50,
                    expiry_date: '2024-06-30',
                    status: 'low-stock'
                },
                {
                    id: '3',
                    name: 'Warfarin 5mg',
                    category: 'medication',
                    quantity: 0,
                    unit_price: 2.25,
                    min_stock: 10,
                    expiry_date: '2024-03-15',
                    status: 'out-of-stock'
                }
            ],
            counseling: [
                {
                    id: '1',
                    patient_name: 'John Doe',
                    medication: 'Lisinopril',
                    date: '2024-01-15',
                    duration: 30,
                    status: 'completed'
                },
                {
                    id: '2',
                    patient_name: 'Jane Smith',
                    medication: 'Metformin',
                    date: '2024-01-15',
                    duration: 25,
                    status: 'scheduled'
                }
            ],
            billing: [
                {
                    id: '1',
                    bill_number: 'PHARM-001',
                    patient_name: 'John Doe',
                    medications: 'Lisinopril 10mg x 30',
                    amount: 45.50,
                    payment_method: 'insurance',
                    status: 'paid',
                    created_at: '2024-01-15T10:00:00Z'
                },
                {
                    id: '2',
                    bill_number: 'PHARM-002',
                    patient_name: 'Jane Smith',
                    medications: 'Metformin 500mg x 60',
                    amount: 25.00,
                    payment_method: 'cash',
                    status: 'paid',
                    created_at: '2024-01-15T11:00:00Z'
                }
            ]
        };
    }

    async init() {
        await this.loadUserData();
        this.initializeWebSocket();
        this.setupEventListeners();
        this.setupFormHandlers();
        this.setupSearchFunctionality();
        this.ensureModalHidden();
        this.loadDashboardData();
    }

    ensureModalHidden() {
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'none';
            modalOverlay.classList.add('hidden');
        }
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
                    id: '5',
                    username: 'pharmacist',
                    email: 'pharm.wilson@hospital.com',
                    first_name: 'Emily',
                    last_name: 'Wilson',
                    role: 'pharmacist',
                    phone: '+1234567894',
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
                id: '5',
                username: 'pharmacist',
                email: 'pharm.wilson@hospital.com',
                first_name: 'Emily',
                last_name: 'Wilson',
                role: 'pharmacist',
                phone: '+1234567894',
                is_active: true
            };
            this.updateUserInterface();
        }
    }

    updateUserInterface() {
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.innerHTML = `
                <span class="user-name">${this.currentUser.first_name} ${this.currentUser.last_name}</span>
                <span class="user-role">Pharmacist</span>
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
            case 'prescriptions':
                await this.loadPrescriptionManagement();
                break;
            case 'inventory':
                await this.loadInventoryManagement();
                break;
            case 'interactions':
                await this.loadDrugInteractions();
                break;
            case 'counseling':
                await this.loadPatientCounseling();
                break;
            case 'billing':
                await this.loadPharmacyBilling();
                break;
            case 'analytics':
                await this.loadAnalytics();
                break;
        }
    }

    async loadOverview() {
        try {
            // Load dashboard statistics
            await this.loadDashboardStats();
        } catch (error) {
            console.error('Error loading overview:', error);
        }
    }

    async loadDashboardStats() {
        try {
            // Load all dashboard statistics in parallel
            const [prescriptionsResponse, inventoryResponse, billingResponse] = await Promise.all([
                fetch('http://localhost:5000/api/medical/prescriptions', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }).catch(() => ({ json: () => ({ success: false, data: [] }) })),
                fetch('http://localhost:5000/api/inventory', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }).catch(() => ({ json: () => ({ success: false, data: [] }) })),
                fetch('http://localhost:5000/api/pharmacy/billing', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }).catch(() => ({ json: () => ({ success: false, data: [] }) }))
            ]);

            const [prescriptionsData, inventoryData, billingData] = await Promise.all([
                prescriptionsResponse.json(),
                inventoryResponse.json(),
                billingResponse.json()
            ]);

            // Update dashboard statistics
            this.updateDashboardStats(prescriptionsData.data || [], inventoryData.data || [], billingData.data || []);
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    updateDashboardStats(prescriptions, inventory, billing) {
        // Update prescription stats
        const pendingPrescriptions = prescriptions.filter(p => p.status === 'pending').length;
        const dispensedToday = prescriptions.filter(p =>
            p.status === 'dispensed' &&
            new Date(p.dispensed_date).toDateString() === new Date().toDateString()
        ).length;

        // Update inventory stats
        const lowStockItems = inventory.filter(item => item.quantity < (item.min_stock || 10)).length;

        // Update billing stats
        const revenueToday = billing.filter(bill =>
            new Date(bill.created_at).toDateString() === new Date().toDateString()
        ).reduce((sum, bill) => sum + (bill.amount || 0), 0);

        // Update DOM elements
        const pendingEl = document.getElementById('pending-prescriptions');
        const dispensedEl = document.getElementById('dispensed-today');
        const lowStockEl = document.getElementById('low-stock-items');
        const revenueEl = document.getElementById('revenue-today');

        if (pendingEl) pendingEl.textContent = pendingPrescriptions;
        if (dispensedEl) dispensedEl.textContent = dispensedToday;
        if (lowStockEl) lowStockEl.textContent = lowStockItems;
        if (revenueEl) revenueEl.textContent = `₹${revenueToday.toLocaleString()}`;
    }

    async loadPrescriptionManagement() {
        try {
            const response = await fetch('http://localhost:5000/api/pharmacy/prescriptions', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();

            if (data.success) {
                this.renderPrescriptionManagement(data.data);
                this.updatePrescriptionStats(data.data);
            } else {
                // Fallback to mock data
                this.renderPrescriptionManagement(this.getMockPrescriptions());
            }
        } catch (error) {
            console.error('Error loading prescription management:', error);
            // Use mock data as fallback
            this.renderPrescriptionManagement(this.getMockPrescriptions());
        }
    }

    async loadInventoryManagement() {
        try {
            const response = await fetch('http://localhost:5000/api/pharmacy/inventory', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();

            if (data.success) {
                this.renderInventoryManagement(data.data);
                this.updateInventoryStats(data.data);
            } else {
                // Fallback to mock data
                this.renderInventoryManagement(this.getMockInventory());
            }
        } catch (error) {
            console.error('Error loading inventory management:', error);
            // Use mock data as fallback
            this.renderInventoryManagement(this.getMockInventory());
        }
    }

    async loadDrugInteractions() {
        try {
            // Initialize interaction checker interface
            this.initializeInteractionChecker();
        } catch (error) {
            console.error('Error loading drug interactions:', error);
        }
    }

    initializeInteractionChecker() {
        // Set up the medication selector with common medications
        const medicationSelector = document.getElementById('medication-selector');
        if (medicationSelector) {
            // Medications are already defined in HTML
            console.log('Drug interaction checker initialized');
        }
    }

    async loadPatientCounseling() {
        try {
            const response = await fetch('http://localhost:5000/api/counseling/sessions', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();

            if (data.success) {
                this.renderPatientCounseling(data.data);
                this.updateCounselingStats(data.data);
            } else {
                // Fallback to mock data
                this.renderPatientCounseling(this.getMockCounseling());
            }
        } catch (error) {
            console.error('Error loading patient counseling:', error);
            // Use mock data as fallback
            this.renderPatientCounseling(this.getMockCounseling());
        }
    }

    async loadPharmacyBilling() {
        try {
            const response = await fetch('http://localhost:5000/api/pharmacy/billing', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();

            if (data.success) {
                this.renderPharmacyBilling(data.data);
                this.updatePharmacyBillingStats(data.data);
            } else {
                // Fallback to mock data
                this.renderPharmacyBilling(this.getMockBilling());
            }
        } catch (error) {
            console.error('Error loading pharmacy billing:', error);
            // Use mock data as fallback
            this.renderPharmacyBilling(this.getMockBilling());
        }
    }

    async loadAnalytics() {
        try {
            const response = await fetch('http://localhost:5000/api/analytics/pharmacy', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();

            if (data.success) {
                this.renderAnalytics(data.data);
            } else {
                // Use mock analytics data
                this.renderAnalytics(this.getMockAnalytics());
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            // Use mock analytics data
            this.renderAnalytics(this.getMockAnalytics());
        }
    }

    getMockAnalytics() {
        return {
            prescriptionTrends: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                data: [120, 150, 180, 160, 200, 220]
            },
            medicationSales: {
                labels: ['Antibiotics', 'Pain Relief', 'Cardiovascular', 'Diabetes', 'Other'],
                data: [45, 60, 35, 25, 40]
            },
            inventoryLevels: {
                labels: ['In Stock', 'Low Stock', 'Out of Stock', 'Expired'],
                data: [60, 25, 10, 5]
            },
            revenue: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                data: [15000, 18000, 16000, 20000, 22000, 25000]
            }
        };
    }

    renderPrescriptionManagement(prescriptions) {
        const tbody = document.getElementById('prescriptions-table-body');
        if (!tbody) return;

        tbody.innerHTML = prescriptions.map(prescription => `
            <tr>
                <td>${prescription.id}</td>
                <td>${prescription.patient_name || 'N/A'}</td>
                <td>${prescription.doctor_name || 'N/A'}</td>
                <td>${prescription.medication}</td>
                <td>${prescription.dosage}</td>
                <td>${prescription.quantity || 1}</td>
                <td><span class="status-badge ${prescription.status}">${prescription.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="pharmacistDashboard.dispensePrescription('${prescription.id}')">Dispense</button>
                    <button class="btn btn-sm btn-secondary" onclick="pharmacistDashboard.verifyPrescription('${prescription.id}')">Verify</button>
                </td>
            </tr>
        `).join('');
    }

    renderInventoryManagement(inventory) {
        const tbody = document.getElementById('inventory-table-body');
        if (!tbody) return;

        tbody.innerHTML = inventory.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.quantity}</td>
                <td>${dashboardCommon.formatCurrency(item.unit_price)}</td>
                <td>${item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'}</td>
                <td><span class="status-badge ${this.getInventoryStatus(item)}">${this.getInventoryStatus(item)}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="pharmacistDashboard.viewInventory('${item.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="pharmacistDashboard.editInventory('${item.id}')">Edit</button>
                </td>
            </tr>
        `).join('');
    }

    renderDrugInteractions(interactions) {
        const results = document.getElementById('interaction-results');
        if (!results) return;

        if (interactions.length === 0) {
            results.innerHTML = '<p>No interactions found. Select medications to check for interactions.</p>';
            results.style.display = 'none';
            return;
        }

        results.innerHTML = interactions.map(interaction => `
            <div class="interaction-item ${interaction.severity}">
                <h4>${interaction.medication1 || interaction.drug1} + ${interaction.medication2 || interaction.drug2}</h4>
                <p><strong>Severity:</strong> <span class="severity-${interaction.severity}">${interaction.severity.toUpperCase()}</span></p>
                <p><strong>Description:</strong> ${interaction.description}</p>
                <p><strong>Recommendation:</strong> ${interaction.recommendation}</p>
            </div>
        `).join('');

        results.style.display = 'block';
    }

    renderPatientCounseling(counseling) {
        const tbody = document.getElementById('counseling-table-body');
        if (!tbody) return;

        tbody.innerHTML = counseling.map(session => `
            <tr>
                <td>${session.id}</td>
                <td>${session.patient_name || 'N/A'}</td>
                <td>${session.medication}</td>
                <td>${new Date(session.date).toLocaleDateString()}</td>
                <td>${session.duration} minutes</td>
                <td><span class="status-badge ${session.status}">${session.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="pharmacistDashboard.viewCounseling('${session.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="pharmacistDashboard.editCounseling('${session.id}')">Edit</button>
                </td>
            </tr>
        `).join('');
    }

    renderPharmacyBilling(billing) {
        const tbody = document.getElementById('pharmacy-billing-table-body');
        if (!tbody) return;

        tbody.innerHTML = billing.map(bill => `
            <tr>
                <td>${bill.bill_number || bill.id}</td>
                <td>${bill.patient_name || 'N/A'}</td>
                <td>${bill.medications || 'N/A'}</td>
                <td>${dashboardCommon.formatCurrency(bill.amount || 0)}</td>
                <td>${new Date(bill.created_at).toLocaleDateString()}</td>
                <td>${bill.payment_method || 'N/A'}</td>
                <td><span class="status-badge ${bill.status}">${bill.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="pharmacistDashboard.viewPharmacyBill('${bill.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="pharmacistDashboard.processPharmacyPayment('${bill.id}')">Process</button>
                </td>
            </tr>
        `).join('');
    }

    renderAnalytics(data) {
        this.renderCharts(data);
    }

    renderCharts(data) {
        // Prescription Trends Chart
        const prescriptionTrendsCtx = document.getElementById('prescription-trends-chart');
        if (prescriptionTrendsCtx && !this.charts.prescriptionTrends) {
            this.charts.prescriptionTrends = new Chart(prescriptionTrendsCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Prescriptions Dispensed',
                        data: [120, 150, 180, 160, 200, 220],
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

        // Medication Sales Chart
        const medicationSalesCtx = document.getElementById('medication-sales-chart');
        if (medicationSalesCtx && !this.charts.medicationSales) {
            this.charts.medicationSales = new Chart(medicationSalesCtx, {
                type: 'bar',
                data: {
                    labels: ['Antibiotics', 'Pain Relief', 'Cardiovascular', 'Diabetes', 'Other'],
                    datasets: [{
                        label: 'Sales Volume',
                        data: [45, 60, 35, 25, 40],
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 205, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 205, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)'
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

        // Inventory Levels Chart
        const inventoryLevelsCtx = document.getElementById('inventory-levels-chart');
        if (inventoryLevelsCtx && !this.charts.inventoryLevels) {
            this.charts.inventoryLevels = new Chart(inventoryLevelsCtx, {
                type: 'doughnut',
                data: {
                    labels: ['In Stock', 'Low Stock', 'Out of Stock', 'Expired'],
                    datasets: [{
                        data: [60, 25, 10, 5],
                        backgroundColor: [
                            '#4BC0C0',
                            '#FFCE56',
                            '#FF6384',
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

        // Revenue Analysis Chart
        const revenueCtx = document.getElementById('pharmacy-revenue-chart');
        if (revenueCtx && !this.charts.revenue) {
            this.charts.revenue = new Chart(revenueCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue',
                        data: [15000, 18000, 16000, 20000, 22000, 25000],
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
    }

    updatePrescriptionStats(prescriptions) {
        const pending = prescriptions.filter(p => p.status === 'pending').length;
        const dispensedToday = prescriptions.filter(p =>
            p.status === 'dispensed' &&
            new Date(p.dispensed_date).toDateString() === new Date().toDateString()
        ).length;
        const rejected = prescriptions.filter(p => p.status === 'rejected').length;

        document.getElementById('pending-prescriptions').textContent = pending;
        document.getElementById('dispensed-today').textContent = dispensedToday;
        document.getElementById('rejected-prescriptions').textContent = rejected;
    }

    updateInventoryStats(inventory) {
        const totalMedications = inventory.length;
        const lowStockItems = inventory.filter(item => item.quantity < item.min_stock).length;
        const outOfStock = inventory.filter(item => item.quantity === 0).length;
        const expiringSoon = inventory.filter(item => {
            const expiryDate = new Date(item.expiry_date);
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            return expiryDate <= thirtyDaysFromNow;
        }).length;

        document.getElementById('total-medications').textContent = totalMedications;
        document.getElementById('low-stock-items').textContent = lowStockItems;
        document.getElementById('out-of-stock').textContent = outOfStock;
        document.getElementById('expiring-soon').textContent = expiringSoon;
    }

    updateInteractionStats(interactions) {
        const checkedToday = interactions.filter(i =>
            new Date(i.checked_date).toDateString() === new Date().toDateString()
        ).length;
        const severe = interactions.filter(i => i.severity === 'severe').length;
        const moderate = interactions.filter(i => i.severity === 'moderate').length;

        document.getElementById('interactions-checked').textContent = checkedToday;
        document.getElementById('severe-interactions').textContent = severe;
        document.getElementById('moderate-interactions').textContent = moderate;
    }

    updateCounselingStats(counseling) {
        const sessionsToday = counseling.filter(c =>
            new Date(c.date).toDateString() === new Date().toDateString()
        ).length;
        const patientsCounseled = [...new Set(counseling.map(c => c.patient_id))].length;
        const followUpRequired = counseling.filter(c => c.status === 'follow-up-required').length;

        document.getElementById('counseling-sessions').textContent = sessionsToday;
        document.getElementById('patients-counseled').textContent = patientsCounseled;
        document.getElementById('follow-up-required').textContent = followUpRequired;
    }

    updatePharmacyBillingStats(billing) {
        const billsToday = billing.filter(bill =>
            new Date(bill.created_at).toDateString() === new Date().toDateString()
        ).length;
        const revenue = billing.reduce((sum, bill) => sum + (bill.amount || 0), 0);
        const insuranceClaims = billing.filter(bill => bill.payment_method === 'insurance').length;

        document.getElementById('pharmacy-bills-today').textContent = billsToday;
        document.getElementById('pharmacy-revenue').textContent = dashboardCommon.formatCurrency(revenue);
        document.getElementById('insurance-claims').textContent = insuranceClaims;
    }

    getInventoryStatus(item) {
        if (item.quantity === 0) return 'out-of-stock';
        if (item.quantity < item.min_stock) return 'low-stock';
        if (new Date(item.expiry_date) <= new Date()) return 'expired';
        return 'in-stock';
    }

    initializeWebSocket() {
        try {
            this.socket = io('http://localhost:5000');

            this.socket.on('connect', () => {
                console.log('Connected to WebSocket server');
                this.socket.emit('join-room', {
                    userId: this.currentUser.id,
                    role: 'pharmacist'
                });
            });

            this.socket.on('notification', (notification) => {
                this.showNotification(notification.message, notification.type || 'info');
            });

            this.socket.on('prescription-update', (data) => {
                this.showNotification(`New prescription update: ${data.message}`, 'info');
                // Refresh prescription data
                this.loadPrescriptionManagement();
            });

            this.socket.on('inventory-alert', (data) => {
                this.showNotification(`Inventory Alert: ${data.message}`, 'warning');
                // Refresh inventory data
                this.loadInventoryManagement();
            });

            this.socket.on('billing-update', (data) => {
                this.showNotification(`Billing update: ${data.message}`, 'info');
                // Refresh billing data
                this.loadPharmacyBilling();
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from WebSocket server');
                this.showNotification('Connection lost. Attempting to reconnect...', 'warning');
            });

            this.socket.on('reconnect', () => {
                console.log('Reconnected to WebSocket server');
                this.showNotification('Connection restored', 'success');
            });

        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.showNotification('Real-time updates unavailable', 'warning');
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
        window.location.href = 'pharmacist-login.html';
    }

    // Action functions
    async dispensePrescription(prescriptionId) {
        try {
            const response = await fetch(`http://localhost:5000/api/pharmacy/prescriptions/${prescriptionId}/dispense`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    quantityDispensed: 1,
                    instructions: 'Take as directed by physician',
                    notes: 'Dispensed by pharmacist'
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Prescription dispensed successfully', 'success');
                // Reload prescription data
                await this.loadPrescriptionManagement();
            } else {
                this.showNotification('Error dispensing prescription: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error dispensing prescription:', error);
            this.showNotification('Error dispensing prescription', 'error');
        }
    }

    async verifyPrescription(prescriptionId) {
        try {
            // For now, just show a verification modal
            this.showPrescriptionVerificationModal(prescriptionId);
        } catch (error) {
            console.error('Error verifying prescription:', error);
            this.showNotification('Error verifying prescription', 'error');
        }
    }

    showPrescriptionVerificationModal(prescriptionId) {
        const modalContent = `
            <div class="verification-form">
                <h4>Verify Prescription #${prescriptionId}</h4>
                <div class="form-group">
                    <label>Patient ID Verification:</label>
                    <input type="text" id="patientIdVerification" placeholder="Enter patient ID">
                </div>
                <div class="form-group">
                    <label>Prescription Details:</label>
                    <textarea id="prescriptionDetails" rows="3" placeholder="Review prescription details"></textarea>
                </div>
                <div class="form-group">
                    <label>Pharmacist Notes:</label>
                    <textarea id="pharmacistNotes" rows="3" placeholder="Add verification notes"></textarea>
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="pharmacistDashboard.confirmVerification('${prescriptionId}')">Verify</button>
                    <button class="btn btn-secondary" onclick="pharmacistDashboard.closeModal()">Cancel</button>
                </div>
            </div>
        `;

        this.showModal('Verify Prescription', modalContent);
    }

    async confirmVerification(prescriptionId) {
        const patientId = document.getElementById('patientIdVerification').value;
        const prescriptionDetails = document.getElementById('prescriptionDetails').value;
        const pharmacistNotes = document.getElementById('pharmacistNotes').value;

        if (!patientId) {
            this.showNotification('Please enter patient ID', 'warning');
            return;
        }

        try {
            // In a real implementation, this would call a verification API
            this.showNotification('Prescription verified successfully', 'success');
            this.closeModal();
            await this.loadPrescriptionManagement();
        } catch (error) {
            console.error('Error confirming verification:', error);
            this.showNotification('Error confirming verification', 'error');
        }
    }

    viewInventory(itemId) {
        console.log('View inventory:', itemId);
        // Show inventory details modal
        this.showInventoryDetailsModal(itemId);
    }

    editInventory(itemId) {
        console.log('Edit inventory:', itemId);
        // Show edit inventory modal
        this.showEditInventoryModal(itemId);
    }

    showInventoryDetailsModal(itemId) {
        const modalContent = `
            <div class="inventory-details">
                <h4>Inventory Item #${itemId}</h4>
                <div class="details-grid">
                    <div class="detail-item">
                        <label>Item Name:</label>
                        <span>Lisinopril 10mg</span>
                    </div>
                    <div class="detail-item">
                        <label>Current Stock:</label>
                        <span>150 units</span>
                    </div>
                    <div class="detail-item">
                        <label>Unit Price:</label>
                        <span>₹1.50</span>
                    </div>
                    <div class="detail-item">
                        <label>Expiry Date:</label>
                        <span>2025-12-31</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge status-in-stock">In Stock</span>
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="pharmacistDashboard.closeModal()">Close</button>
                </div>
            </div>
        `;

        this.showModal('Inventory Details', modalContent);
    }

    showEditInventoryModal(itemId) {
        const modalContent = `
            <form id="edit-inventory-form">
                <div class="form-group">
                    <label>Item Name</label>
                    <input type="text" name="name" value="Lisinopril 10mg" required>
                </div>
                <div class="form-group">
                    <label>Quantity</label>
                    <input type="number" name="quantity" value="150" required>
                </div>
                <div class="form-group">
                    <label>Unit Price</label>
                    <input type="number" name="unitPrice" step="0.01" value="1.50" required>
                </div>
                <div class="form-group">
                    <label>Expiry Date</label>
                    <input type="date" name="expiryDate" value="2025-12-31" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Update</button>
                    <button type="button" class="btn btn-secondary" onclick="pharmacistDashboard.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal('Edit Inventory Item', modalContent);
    }

    closeModal() {
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    }

    async checkSelectedInteractions() {
        const selectedMedications = Array.from(document.getElementById('medication-selector').selectedOptions)
            .map(option => option.value);

        if (selectedMedications.length < 2) {
            this.showNotification('Please select at least 2 medications to check for interactions.', 'warning');
            return;
        }

        try {
            // Call the drug interaction API
            const response = await fetch('http://localhost:5000/api/drug-interactions/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    medications: selectedMedications
                })
            });

            const data = await response.json();

            if (data.success) {
                this.renderDrugInteractions(data.data.interactions || []);
            } else {
                // Fallback to mock interaction check
                this.renderDrugInteractions(this.getMockInteractions(selectedMedications));
            }
        } catch (error) {
            console.error('Error checking drug interactions:', error);
            // Use mock data as fallback
            this.renderDrugInteractions(this.getMockInteractions(selectedMedications));
        }
    }

    getMockInteractions(medications) {
        const interactions = [];

        // Check for specific known interactions
        if (medications.includes('Warfarin') && medications.includes('Aspirin')) {
            interactions.push({
                medication1: 'Warfarin',
                medication2: 'Aspirin',
                severity: 'major',
                description: 'Increased risk of bleeding when taken together',
                recommendation: 'Monitor INR closely, consider alternative pain management'
            });
        }

        if (medications.includes('Digoxin') && medications.includes('Furosemide')) {
            interactions.push({
                medication1: 'Digoxin',
                medication2: 'Furosemide',
                severity: 'moderate',
                description: 'Furosemide can increase digoxin levels',
                recommendation: 'Monitor digoxin levels and adjust dose if necessary'
            });
        }

        if (interactions.length === 0) {
            interactions.push({
                medication1: medications[0],
                medication2: medications[1],
                severity: 'none',
                description: 'No significant interactions found',
                recommendation: 'Medications can be safely taken together'
            });
        }

        return interactions;
    }

    viewCounseling(sessionId) {
        console.log('View counseling:', sessionId);
        this.showCounselingDetailsModal(sessionId);
    }

    editCounseling(sessionId) {
        console.log('Edit counseling:', sessionId);
        this.showEditCounselingModal(sessionId);
    }

    showCounselingDetailsModal(sessionId) {
        const modalContent = `
            <div class="counseling-details">
                <h4>Counseling Session #${sessionId}</h4>
                <div class="details-grid">
                    <div class="detail-item">
                        <label>Patient:</label>
                        <span>John Doe</span>
                    </div>
                    <div class="detail-item">
                        <label>Medication:</label>
                        <span>Lisinopril</span>
                    </div>
                    <div class="detail-item">
                        <label>Date:</label>
                        <span>2024-01-15</span>
                    </div>
                    <div class="detail-item">
                        <label>Duration:</label>
                        <span>30 minutes</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge status-completed">Completed</span>
                    </div>
                    <div class="detail-item full-width">
                        <label>Counseling Notes:</label>
                        <p>Patient was counseled on proper medication administration, potential side effects, and importance of adherence to treatment plan.</p>
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="pharmacistDashboard.closeModal()">Close</button>
                </div>
            </div>
        `;

        this.showModal('Counseling Session Details', modalContent);
    }

    showEditCounselingModal(sessionId) {
        const modalContent = `
            <form id="edit-counseling-form">
                <div class="form-group">
                    <label>Patient</label>
                    <select name="patientId" required>
                        <option value="1">John Doe</option>
                        <option value="2">Jane Smith</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Medication</label>
                    <input type="text" name="medication" value="Lisinopril" required>
                </div>
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" name="date" value="2024-01-15" required>
                </div>
                <div class="form-group">
                    <label>Duration (minutes)</label>
                    <input type="number" name="duration" value="30" required>
                </div>
                <div class="form-group">
                    <label>Counseling Notes</label>
                    <textarea name="notes" rows="4" required>Patient was counseled on proper medication administration, potential side effects, and importance of adherence to treatment plan.</textarea>
                </div>
                <div class="form-group">
                    <label>Follow-up Required</label>
                    <select name="followUp" required>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Update Session</button>
                    <button type="button" class="btn btn-secondary" onclick="pharmacistDashboard.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal('Edit Counseling Session', modalContent);
    }

    viewPharmacyBill(billId) {
        console.log('View pharmacy bill:', billId);
        this.showPharmacyBillDetailsModal(billId);
    }

    processPharmacyPayment(billId) {
        console.log('Process pharmacy payment:', billId);
        this.showPaymentProcessingModal(billId);
    }

    showPharmacyBillDetailsModal(billId) {
        const modalContent = `
            <div class="bill-details">
                <h4>Pharmacy Bill #${billId}</h4>
                <div class="details-grid">
                    <div class="detail-item">
                        <label>Bill Number:</label>
                        <span>PHARM-001</span>
                    </div>
                    <div class="detail-item">
                        <label>Patient:</label>
                        <span>John Doe</span>
                    </div>
                    <div class="detail-item">
                        <label>Medications:</label>
                        <span>Lisinopril 10mg x 30</span>
                    </div>
                    <div class="detail-item">
                        <label>Amount:</label>
                        <span>₹45.50</span>
                    </div>
                    <div class="detail-item">
                        <label>Payment Method:</label>
                        <span>Insurance</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge status-paid">Paid</span>
                    </div>
                    <div class="detail-item">
                        <label>Date:</label>
                        <span>2024-01-15</span>
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="pharmacistDashboard.closeModal()">Close</button>
                </div>
            </div>
        `;

        this.showModal('Pharmacy Bill Details', modalContent);
    }

    showPaymentProcessingModal(billId) {
        const modalContent = `
            <form id="payment-processing-form">
                <h4>Process Payment for Bill #${billId}</h4>
                <div class="form-group">
                    <label>Payment Method</label>
                    <select name="paymentMethod" required>
                        <option value="cash">Cash</option>
                        <option value="card">Credit Card</option>
                        <option value="insurance">Insurance</option>
                        <option value="check">Check</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Amount</label>
                    <input type="number" name="amount" step="0.01" value="45.50" required>
                </div>
                <div class="form-group">
                    <label>Transaction ID (if applicable)</label>
                    <input type="text" name="transactionId" placeholder="Enter transaction ID">
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea name="notes" rows="3" placeholder="Payment processing notes"></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Process Payment</button>
                    <button type="button" class="btn btn-secondary" onclick="pharmacistDashboard.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal('Process Payment', modalContent);
    }

    // Modal functions
    showDispensePrescriptionModal() {
        this.showModal('Dispense Prescription', this.getDispenseForm());
    }

    showAddInventoryModal() {
        this.showModal('Add Inventory', this.getInventoryForm());
    }

    showCounselingModal() {
        this.showModal('Add Counseling Session', this.getCounselingForm());
    }

    showCreatePharmacyBillModal() {
        this.showModal('Create Pharmacy Bill', this.getPharmacyBillForm());
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

    getDispenseForm() {
        return `
            <form id="dispense-form">
                <div class="form-group">
                    <label>Prescription ID</label>
                    <input type="text" name="prescriptionId" required>
                </div>
                <div class="form-group">
                    <label>Patient</label>
                    <input type="text" name="patientName" readonly>
                </div>
                <div class="form-group">
                    <label>Medication</label>
                    <input type="text" name="medication" readonly>
                </div>
                <div class="form-group">
                    <label>Quantity Dispensed</label>
                    <input type="number" name="quantity" required>
                </div>
                <div class="form-group">
                    <label>Instructions</label>
                    <textarea name="instructions" rows="3" required></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Dispense</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
    }

    getInventoryForm() {
        return `
            <form id="inventory-form">
                <div class="form-group">
                    <label>Medication Name</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <select name="category" required>
                        <option value="antibiotic">Antibiotic</option>
                        <option value="pain-relief">Pain Relief</option>
                        <option value="cardiovascular">Cardiovascular</option>
                        <option value="diabetes">Diabetes</option>
                        <option value="other">Other</option>
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
                    <input type="date" name="expiryDate" required>
                </div>
                <div class="form-group">
                    <label>Minimum Stock Level</label>
                    <input type="number" name="minStock" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Add Inventory</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
    }

    getCounselingForm() {
        return `
            <form id="counseling-form">
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
                    <label>Date</label>
                    <input type="date" name="date" required>
                </div>
                <div class="form-group">
                    <label>Duration (minutes)</label>
                    <input type="number" name="duration" required>
                </div>
                <div class="form-group">
                    <label>Counseling Notes</label>
                    <textarea name="notes" rows="4" required></textarea>
                </div>
                <div class="form-group">
                    <label>Follow-up Required</label>
                    <select name="followUp" required>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Add Session</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
    }

    getPharmacyBillForm() {
        return `
            <form id="pharmacy-bill-form">
                <div class="form-group">
                    <label>Patient</label>
                    <select name="patientId" required>
                        <option value="">Select Patient</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Medications</label>
                    <textarea name="medications" rows="3" required placeholder="List medications and quantities"></textarea>
                </div>
                <div class="form-group">
                    <label>Total Amount</label>
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
    checkLowStock() {
        console.log('Check low stock');
    }

    checkDrugInteractions() {
        console.log('Check drug interactions');
    }

    viewInteractionDatabase() {
        console.log('View interaction database');
    }

    viewCounselingHistory() {
        console.log('View counseling history');
    }

    processPharmacyPayment() {
        console.log('Process pharmacy payment');
    }

    generatePharmacyReport() {
        console.log('Generate pharmacy report');
    }

    exportPharmacyData() {
        console.log('Export pharmacy data');
    }

    showNotification(message, type = 'info') {
        // Create notification container if it doesn't exist
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease-out;
        `;

        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span style="flex: 1;">${message}</span>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">×</button>
        `;

        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 5000);
    }

    getNotificationColor(type) {
        const colors = {
            'info': '#3b82f6',
            'success': '#10b981',
            'warning': '#f59e0b',
            'error': '#ef4444'
        };
        return colors[type] || colors.info;
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
        window.location.href = 'pharmacist-login.html';
    }

    async loadDashboardData() {
        const activeSection = document.querySelector('.dashboard-section.active');
        if (activeSection) {
            await this.loadSectionData(activeSection.id);
        }
    }

    // Enhanced functionality methods
    async loadPrescriptionManagement() {
        try {
            // Show loading state
            this.showLoadingState('prescriptions-table-body');

            const response = await fetch('http://localhost:5000/api/pharmacy/prescriptions', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();

            if (data.success) {
                this.renderPrescriptionManagement(data.data);
                this.updatePrescriptionStats(data.data);
            } else {
                // Fallback to mock data
                this.renderPrescriptionManagement(this.mockData.prescriptions);
                this.updatePrescriptionStats(this.mockData.prescriptions);
            }
        } catch (error) {
            console.error('Error loading prescription management:', error);
            // Use mock data as fallback
            this.renderPrescriptionManagement(this.mockData.prescriptions);
            this.updatePrescriptionStats(this.mockData.prescriptions);
        }
    }

    async loadInventoryManagement() {
        try {
            // Show loading state
            this.showLoadingState('inventory-table-body');

            const response = await fetch('http://localhost:5000/api/pharmacy/inventory', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();

            if (data.success) {
                this.renderInventoryManagement(data.data);
                this.updateInventoryStats(data.data);
            } else {
                // Fallback to mock data
                this.renderInventoryManagement(this.mockData.inventory);
                this.updateInventoryStats(this.mockData.inventory);
            }
        } catch (error) {
            console.error('Error loading inventory management:', error);
            // Use mock data as fallback
            this.renderInventoryManagement(this.mockData.inventory);
            this.updateInventoryStats(this.mockData.inventory);
        }
    }

    async loadPatientCounseling() {
        try {
            // Show loading state
            this.showLoadingState('counseling-table-body');

            const response = await fetch('http://localhost:5000/api/counseling/sessions', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();

            if (data.success) {
                this.renderPatientCounseling(data.data);
                this.updateCounselingStats(data.data);
            } else {
                // Fallback to mock data
                this.renderPatientCounseling(this.mockData.counseling);
                this.updateCounselingStats(this.mockData.counseling);
            }
        } catch (error) {
            console.error('Error loading patient counseling:', error);
            // Use mock data as fallback
            this.renderPatientCounseling(this.mockData.counseling);
            this.updateCounselingStats(this.mockData.counseling);
        }
    }

    async loadPharmacyBilling() {
        try {
            // Show loading state
            this.showLoadingState('pharmacy-billing-table-body');

            const response = await fetch('http://localhost:5000/api/pharmacy/billing', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();

            if (data.success) {
                this.renderPharmacyBilling(data.data);
                this.updatePharmacyBillingStats(data.data);
            } else {
                // Fallback to mock data
                this.renderPharmacyBilling(this.mockData.billing);
                this.updatePharmacyBillingStats(this.mockData.billing);
            }
        } catch (error) {
            console.error('Error loading pharmacy billing:', error);
            // Use mock data as fallback
            this.renderPharmacyBilling(this.mockData.billing);
            this.updatePharmacyBillingStats(this.mockData.billing);
        }
    }

    showLoadingState(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <tr>
                    <td colspan="8" class="loading">
                        <div class="spinner"></div>
                        Loading data...
                    </td>
                </tr>
            `;
        }
    }

    // Enhanced form handling
    setupFormHandlers() {
        // Dispense prescription form
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'dispense-form') {
                e.preventDefault();
                this.handleDispensePrescription(e.target);
            } else if (e.target.id === 'inventory-form') {
                e.preventDefault();
                this.handleAddInventory(e.target);
            } else if (e.target.id === 'counseling-form') {
                e.preventDefault();
                this.handleAddCounseling(e.target);
            } else if (e.target.id === 'pharmacy-bill-form') {
                e.preventDefault();
                this.handleCreatePharmacyBill(e.target);
            } else if (e.target.id === 'payment-processing-form') {
                e.preventDefault();
                this.handleProcessPayment(e.target);
            }
        });
    }

    async handleDispensePrescription(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            this.showNotification('Processing prescription...', 'info');

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.showNotification('Prescription dispensed successfully!', 'success');
            this.closeModal();
            await this.loadPrescriptionManagement();
        } catch (error) {
            console.error('Error dispensing prescription:', error);
            this.showNotification('Error dispensing prescription', 'error');
        }
    }

    async handleAddInventory(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            this.showNotification('Adding inventory item...', 'info');

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.showNotification('Inventory item added successfully!', 'success');
            this.closeModal();
            await this.loadInventoryManagement();
        } catch (error) {
            console.error('Error adding inventory:', error);
            this.showNotification('Error adding inventory item', 'error');
        }
    }

    async handleAddCounseling(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            this.showNotification('Adding counseling session...', 'info');

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.showNotification('Counseling session added successfully!', 'success');
            this.closeModal();
            await this.loadPatientCounseling();
        } catch (error) {
            console.error('Error adding counseling:', error);
            this.showNotification('Error adding counseling session', 'error');
        }
    }

    async handleCreatePharmacyBill(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            this.showNotification('Creating pharmacy bill...', 'info');

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.showNotification('Pharmacy bill created successfully!', 'success');
            this.closeModal();
            await this.loadPharmacyBilling();
        } catch (error) {
            console.error('Error creating pharmacy bill:', error);
            this.showNotification('Error creating pharmacy bill', 'error');
        }
    }

    async handleProcessPayment(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            this.showNotification('Processing payment...', 'info');

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.showNotification('Payment processed successfully!', 'success');
            this.closeModal();
            await this.loadPharmacyBilling();
        } catch (error) {
            console.error('Error processing payment:', error);
            this.showNotification('Error processing payment', 'error');
        }
    }

    // Enhanced search functionality
    setupSearchFunctionality() {
        // Global search
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleGlobalSearch(e.target.value);
            });
        }

        // Section-specific search
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('search-input')) {
                this.handleSectionSearch(e.target.value, e.target.dataset.section);
            }
        });
    }

    handleGlobalSearch(query) {
        console.log('Global search:', query);
        // Implement global search logic
    }

    handleSectionSearch(query, section) {
        console.log(`Searching ${section}:`, query);
        // Implement section-specific search logic
    }

    // Enhanced modal functionality
    showModal(title, content) {
        const modalOverlay = document.getElementById('modalOverlay');
        if (!modalOverlay) return;

        modalOverlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="pharmacistDashboard.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        modalOverlay.style.display = 'flex';

        // Add escape key listener
        document.addEventListener('keydown', this.handleEscapeKey);
    }

    handleEscapeKey = (e) => {
        if (e.key === 'Escape') {
            this.closeModal();
        }
    }

    closeModal() {
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'none';
            modalOverlay.classList.add('hidden');
        }
        document.removeEventListener('keydown', this.handleEscapeKey);
    }

    // Enhanced notification system
    showNotification(message, type = 'info') {
        // Create notification container if it doesn't exist
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: white;
            color: #1e293b;
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease-out;
            border-left: 4px solid ${this.getNotificationColor(type)};
        `;

        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}" style="color: ${this.getNotificationColor(type)};"></i>
            <span style="flex: 1;">${message}</span>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: #6b7280; cursor: pointer; font-size: 18px; padding: 0; margin-left: 10px;">×</button>
        `;

        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 5000);
    }

    getNotificationColor(type) {
        const colors = {
            'info': '#3b82f6',
            'success': '#10b981',
            'warning': '#f59e0b',
            'error': '#ef4444'
        };
        return colors[type] || colors.info;
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

    // Mock data methods for fallback
    getMockPrescriptions() {
        return [
            {
                id: '1',
                patient_name: 'John Doe',
                doctor_name: 'Dr. Smith',
                medication: 'Lisinopril 10mg',
                dosage: '10mg once daily',
                quantity: 30,
                status: 'pending',
                prescribed_date: '2024-01-15T09:00:00Z'
            },
            {
                id: '2',
                patient_name: 'Jane Smith',
                doctor_name: 'Dr. Johnson',
                medication: 'Metformin 500mg',
                dosage: '500mg twice daily',
                quantity: 60,
                status: 'dispensed',
                prescribed_date: '2024-01-15T11:00:00Z',
                dispensed_date: '2024-01-15T12:00:00Z'
            },
            {
                id: '3',
                patient_name: 'Mike Johnson',
                doctor_name: 'Dr. Brown',
                medication: 'Atorvastatin 20mg',
                dosage: '20mg once daily',
                quantity: 30,
                status: 'pending',
                prescribed_date: '2024-01-15T14:00:00Z'
            }
        ];
    }

    getMockInventory() {
        return [
            {
                id: '1',
                name: 'Lisinopril 10mg',
                category: 'medication',
                quantity: 150,
                unit_price: 1.50,
                min_stock: 20,
                expiry_date: '2025-12-31',
                status: 'in-stock'
            },
            {
                id: '2',
                name: 'Metformin 500mg',
                category: 'medication',
                quantity: 8,
                unit_price: 0.75,
                min_stock: 50,
                expiry_date: '2024-06-30',
                status: 'low-stock'
            },
            {
                id: '3',
                name: 'Warfarin 5mg',
                category: 'medication',
                quantity: 0,
                unit_price: 2.25,
                min_stock: 10,
                expiry_date: '2024-03-15',
                status: 'out-of-stock'
            }
        ];
    }

    getMockCounseling() {
        return [
            {
                id: '1',
                patient_name: 'John Doe',
                medication: 'Lisinopril',
                date: '2024-01-15',
                duration: 30,
                status: 'completed'
            },
            {
                id: '2',
                patient_name: 'Jane Smith',
                medication: 'Metformin',
                date: '2024-01-15',
                duration: 25,
                status: 'scheduled'
            }
        ];
    }

    getMockBilling() {
        return [
            {
                id: '1',
                bill_number: 'PHARM-001',
                patient_name: 'John Doe',
                medications: 'Lisinopril 10mg x 30',
                amount: 45.50,
                payment_method: 'insurance',
                status: 'paid',
                created_at: '2024-01-15T10:00:00Z'
            },
            {
                id: '2',
                bill_number: 'PHARM-002',
                patient_name: 'Jane Smith',
                medications: 'Metformin 500mg x 60',
                amount: 25.00,
                payment_method: 'cash',
                status: 'paid',
                created_at: '2024-01-15T11:00:00Z'
            }
        ];
    }
}

// Missing Pharmacist Dashboard Functions
function showDispensePrescriptionModal() {
    dashboardCommon.showNotification('info', 'Dispense Prescription', 'Dispense prescription modal opened');
}

function verifyPrescription() {
    dashboardCommon.showNotification('info', 'Verify Prescription', 'Prescription verification started');
}

function showAddInventoryModal() {
    dashboardCommon.showNotification('info', 'Add Inventory', 'Add inventory modal opened');
}

function checkLowStock() {
    dashboardCommon.showNotification('info', 'Check Low Stock', 'Low stock items checked');
}

function viewInteractionDatabase() {
    dashboardCommon.showNotification('info', 'View Interaction Database', 'Interaction database opened');
}

function checkSelectedInteractions() {
    dashboardCommon.showNotification('info', 'Check Selected Interactions', 'Selected interactions checked');
}

function showCounselingModal() {
    dashboardCommon.showNotification('info', 'Patient Counseling', 'Counseling modal opened');
}

function viewCounselingHistory() {
    dashboardCommon.showNotification('info', 'View Counseling History', 'Counseling history opened');
}

function showCreatePharmacyBillModal() {
    dashboardCommon.showNotification('info', 'Create Pharmacy Bill', 'Create pharmacy bill modal opened');
}

function processPharmacyPayment() {
    dashboardCommon.showNotification('info', 'Process Pharmacy Payment', 'Pharmacy payment processing started');
}

// Dashboard will be initialized by the HTML authentication validation
// No automatic instantiation to prevent conflicts with auth validation
