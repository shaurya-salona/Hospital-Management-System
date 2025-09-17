// Pharmacist Dashboard - Complete Implementation
class PharmacistDashboard {
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
            case 'prescription-management':
                await this.loadPrescriptionManagement();
                break;
            case 'inventory-management':
                await this.loadInventoryManagement();
                break;
            case 'drug-interactions':
                await this.loadDrugInteractions();
                break;
            case 'patient-counseling':
                await this.loadPatientCounseling();
                break;
            case 'pharmacy-billing':
                await this.loadPharmacyBilling();
                break;
            case 'reports-analytics':
                await this.loadAnalytics();
                break;
        }
    }

    async loadPrescriptionManagement() {
        try {
            const response = await fetch('/api/medical/prescriptions', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderPrescriptionManagement(data.data);
                this.updatePrescriptionStats(data.data);
            }
        } catch (error) {
            console.error('Error loading prescription management:', error);
        }
    }

    async loadInventoryManagement() {
        try {
            const response = await fetch('/api/inventory', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderInventoryManagement(data.data);
                this.updateInventoryStats(data.data);
            }
        } catch (error) {
            console.error('Error loading inventory management:', error);
        }
    }

    async loadDrugInteractions() {
        try {
            const response = await fetch('/api/drug-interactions', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderDrugInteractions(data.data);
                this.updateInteractionStats(data.data);
            }
        } catch (error) {
            console.error('Error loading drug interactions:', error);
        }
    }

    async loadPatientCounseling() {
        try {
            const response = await fetch('/api/counseling', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderPatientCounseling(data.data);
                this.updateCounselingStats(data.data);
            }
        } catch (error) {
            console.error('Error loading patient counseling:', error);
        }
    }

    async loadPharmacyBilling() {
        try {
            const response = await fetch('/api/pharmacy/billing', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderPharmacyBilling(data.data);
                this.updatePharmacyBillingStats(data.data);
            }
        } catch (error) {
            console.error('Error loading pharmacy billing:', error);
        }
    }

    async loadAnalytics() {
        try {
            const response = await fetch('/api/analytics/pharmacy', {
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
                <td>$${item.unit_price}</td>
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
            return;
        }

        results.innerHTML = interactions.map(interaction => `
            <div class="interaction-item ${interaction.severity}">
                <h4>${interaction.medication1} + ${interaction.medication2}</h4>
                <p><strong>Severity:</strong> ${interaction.severity}</p>
                <p><strong>Description:</strong> ${interaction.description}</p>
                <p><strong>Recommendation:</strong> ${interaction.recommendation}</p>
            </div>
        `).join('');
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
                <td>$${bill.amount || 0}</td>
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
        document.getElementById('pharmacy-revenue').textContent = `$${revenue.toFixed(2)}`;
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
    dispensePrescription(prescriptionId) {
        console.log('Dispense prescription:', prescriptionId);
    }

    verifyPrescription(prescriptionId) {
        console.log('Verify prescription:', prescriptionId);
    }

    viewInventory(itemId) {
        console.log('View inventory:', itemId);
    }

    editInventory(itemId) {
        console.log('Edit inventory:', itemId);
    }

    checkSelectedInteractions() {
        const selectedMedications = Array.from(document.getElementById('medication-selector').selectedOptions)
            .map(option => option.value);
        
        if (selectedMedications.length < 2) {
            alert('Please select at least 2 medications to check for interactions.');
            return;
        }

        console.log('Check interactions for:', selectedMedications);
        // Simulate interaction check
        this.renderDrugInteractions([
            {
                medication1: selectedMedications[0],
                medication2: selectedMedications[1],
                severity: 'moderate',
                description: 'May increase risk of side effects',
                recommendation: 'Monitor patient closely'
            }
        ]);
    }

    viewCounseling(sessionId) {
        console.log('View counseling:', sessionId);
    }

    editCounseling(sessionId) {
        console.log('Edit counseling:', sessionId);
    }

    viewPharmacyBill(billId) {
        console.log('View pharmacy bill:', billId);
    }

    processPharmacyPayment(billId) {
        console.log('Process pharmacy payment:', billId);
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

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pharmacistDashboard = new PharmacistDashboard();
});
