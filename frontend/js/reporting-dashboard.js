/**
 * Advanced Reporting Dashboard for HMIS
 * Provides comprehensive reporting interface with charts and analytics
 */

class ReportingDashboard {
    constructor() {
        this.currentReport = null;
        this.reportHistory = [];
        this.chartInstances = new Map();
        this.filters = {
            startDate: this.getDefaultStartDate(),
            endDate: this.getDefaultEndDate(),
            department: null,
            doctor: null,
            format: 'json'
        };

        this.init();
    }

    init() {
        this.createReportingInterface();
        this.setupEventListeners();
        this.loadReportTemplates();
        this.setupChartLibraries();
    }

    createReportingInterface() {
        // Check if reporting interface already exists
        if (document.getElementById('reporting-dashboard')) return;

        const container = document.createElement('div');
        container.id = 'reporting-dashboard';
        container.className = 'reporting-dashboard';
        container.innerHTML = `
            <div class="reporting-header">
                <h2><i class="fas fa-chart-line"></i> Advanced Reporting Dashboard</h2>
                <div class="reporting-controls">
                    <button id="new-report-btn" class="reporting-btn primary">
                        <i class="fas fa-plus"></i> New Report
                    </button>
                    <button id="report-templates-btn" class="reporting-btn">
                        <i class="fas fa-file-alt"></i> Templates
                    </button>
                    <button id="report-history-btn" class="reporting-btn">
                        <i class="fas fa-history"></i> History
                    </button>
                    <button id="export-all-btn" class="reporting-btn">
                        <i class="fas fa-download"></i> Export All
                    </button>
                </div>
            </div>

            <div class="reporting-filters">
                <div class="filter-group">
                    <label for="start-date">Start Date:</label>
                    <input type="date" id="start-date" value="${this.filters.startDate}">
                </div>
                <div class="filter-group">
                    <label for="end-date">End Date:</label>
                    <input type="date" id="end-date" value="${this.filters.endDate}">
                </div>
                <div class="filter-group">
                    <label for="department-filter">Department:</label>
                    <select id="department-filter">
                        <option value="">All Departments</option>
                        <option value="cardiology">Cardiology</option>
                        <option value="neurology">Neurology</option>
                        <option value="orthopedics">Orthopedics</option>
                        <option value="pediatrics">Pediatrics</option>
                        <option value="emergency">Emergency</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="doctor-filter">Doctor:</label>
                    <select id="doctor-filter">
                        <option value="">All Doctors</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="format-filter">Export Format:</label>
                    <select id="format-filter">
                        <option value="json">JSON</option>
                        <option value="pdf">PDF</option>
                        <option value="excel">Excel</option>
                        <option value="csv">CSV</option>
                    </select>
                </div>
                <button id="apply-filters-btn" class="apply-filters-btn">
                    <i class="fas fa-filter"></i> Apply Filters
                </button>
            </div>

            <div class="reporting-content">
                <div class="reporting-sidebar">
                    <div class="report-categories">
                        <h3>Report Categories</h3>
                        <div class="category-section">
                            <h4><i class="fas fa-dollar-sign"></i> Financial Reports</h4>
                            <ul class="report-list">
                                <li><a href="#" data-report="revenue">Revenue Analysis</a></li>
                                <li><a href="#" data-report="expenses">Expense Breakdown</a></li>
                                <li><a href="#" data-report="profit-loss">Profit & Loss</a></li>
                                <li><a href="#" data-report="billing">Billing Summary</a></li>
                                <li><a href="#" data-report="insurance">Insurance Claims</a></li>
                            </ul>
                        </div>

                        <div class="category-section">
                            <h4><i class="fas fa-users"></i> Patient Analytics</h4>
                            <ul class="report-list">
                                <li><a href="#" data-report="demographics">Demographics</a></li>
                                <li><a href="#" data-report="admissions">Admissions</a></li>
                                <li><a href="#" data-report="diagnoses">Diagnoses</a></li>
                                <li><a href="#" data-report="outcomes">Treatment Outcomes</a></li>
                            </ul>
                        </div>

                        <div class="category-section">
                            <h4><i class="fas fa-calendar"></i> Appointment Analytics</h4>
                            <ul class="report-list">
                                <li><a href="#" data-report="scheduling">Scheduling Analysis</a></li>
                                <li><a href="#" data-report="utilization">Resource Utilization</a></li>
                                <li><a href="#" data-report="wait-times">Wait Times</a></li>
                                <li><a href="#" data-report="cancellations">Cancellations</a></li>
                            </ul>
                        </div>

                        <div class="category-section">
                            <h4><i class="fas fa-cogs"></i> Custom Reports</h4>
                            <ul class="report-list">
                                <li><a href="#" data-report="custom">Custom Query</a></li>
                                <li><a href="#" data-report="templates">Report Templates</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="reporting-main">
                    <div id="report-content" class="report-content">
                        <div class="welcome-message">
                            <i class="fas fa-chart-line"></i>
                            <h3>Welcome to Advanced Reporting</h3>
                            <p>Select a report category from the sidebar to get started with comprehensive analytics and insights.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
    }

    setupEventListeners() {
        // Filter controls
        document.getElementById('apply-filters-btn')?.addEventListener('click', () => {
            this.applyFilters();
        });

        // Report category links
        document.querySelectorAll('[data-report]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const reportType = e.target.getAttribute('data-report');
                this.loadReport(reportType);
            });
        });

        // Control buttons
        document.getElementById('new-report-btn')?.addEventListener('click', () => {
            this.showNewReportModal();
        });

        document.getElementById('report-templates-btn')?.addEventListener('click', () => {
            this.showTemplatesModal();
        });

        document.getElementById('report-history-btn')?.addEventListener('click', () => {
            this.showHistoryModal();
        });

        document.getElementById('export-all-btn')?.addEventListener('click', () => {
            this.exportAllReports();
        });

        // Date change handlers
        document.getElementById('start-date')?.addEventListener('change', (e) => {
            this.filters.startDate = e.target.value;
        });

        document.getElementById('end-date')?.addEventListener('change', (e) => {
            this.filters.endDate = e.target.value;
        });

        document.getElementById('department-filter')?.addEventListener('change', (e) => {
            this.filters.department = e.target.value;
            this.updateDoctorFilter();
        });

        document.getElementById('format-filter')?.addEventListener('change', (e) => {
            this.filters.format = e.target.value;
        });
    }

    setupChartLibraries() {
        // Load Chart.js if not already loaded
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => {
                console.log('Chart.js loaded successfully');
            };
            document.head.appendChild(script);
        }
    }

    async loadReport(reportType) {
        try {
            this.showLoadingState();

            let reportData;
            const endpoint = this.getReportEndpoint(reportType);

            if (endpoint) {
                reportData = await this.fetchReport(endpoint);
            } else if (reportType === 'custom') {
                this.showCustomReportModal();
                return;
            } else if (reportType === 'templates') {
                this.showTemplatesModal();
                return;
            }

            if (reportData) {
                this.displayReport(reportData, reportType);
                this.currentReport = { type: reportType, data: reportData };
            }

        } catch (error) {
            console.error('Error loading report:', error);
            this.showErrorState('Failed to load report: ' + error.message);
        }
    }

    getReportEndpoint(reportType) {
        const endpoints = {
            'revenue': '/api/reporting/financial/revenue',
            'expenses': '/api/reporting/financial/expenses',
            'profit-loss': '/api/reporting/financial/profit-loss',
            'billing': '/api/reporting/financial/billing',
            'insurance': '/api/reporting/financial/insurance',
            'demographics': '/api/reporting/analytics/patients/demographics',
            'admissions': '/api/reporting/analytics/patients/admissions',
            'diagnoses': '/api/reporting/analytics/patients/diagnoses',
            'outcomes': '/api/reporting/analytics/patients/outcomes',
            'scheduling': '/api/reporting/analytics/appointments/scheduling',
            'utilization': '/api/reporting/analytics/appointments/utilization',
            'wait-times': '/api/reporting/analytics/appointments/wait-times',
            'cancellations': '/api/reporting/analytics/appointments/cancellations'
        };

        return endpoints[reportType];
    }

    async fetchReport(endpoint) {
        const queryParams = new URLSearchParams({
            startDate: this.filters.startDate,
            endDate: this.filters.endDate,
            format: this.filters.format
        });

        if (this.filters.department) {
            queryParams.append('department', this.filters.department);
        }

        if (this.filters.doctor) {
            queryParams.append('doctor', this.filters.doctor);
        }

        const response = await fetch(`${endpoint}?${queryParams}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    displayReport(reportData, reportType) {
        const content = document.getElementById('report-content');
        if (!content) return;

        const reportTitle = this.getReportTitle(reportType);

        content.innerHTML = `
            <div class="report-header">
                <h3>${reportTitle}</h3>
                <div class="report-actions">
                    <button class="export-btn" onclick="window.reportingDashboard.exportReport('${reportType}')">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button class="refresh-btn" onclick="window.reportingDashboard.refreshReport('${reportType}')">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
            </div>

            <div class="report-content-body">
                ${this.generateReportContent(reportData, reportType)}
            </div>
        `;

        // Initialize charts if data is available
        this.initializeCharts(reportData, reportType);
    }

    generateReportContent(reportData, reportType) {
        if (!reportData.success) {
            return `<div class="error-message">Failed to load report data</div>`;
        }

        const data = reportData.data;

        switch (reportType) {
            case 'revenue':
                return this.generateRevenueReportContent(data);
            case 'expenses':
                return this.generateExpensesReportContent(data);
            case 'profit-loss':
                return this.generateProfitLossReportContent(data);
            case 'billing':
                return this.generateBillingReportContent(data);
            case 'demographics':
                return this.generateDemographicsReportContent(data);
            case 'admissions':
                return this.generateAdmissionsReportContent(data);
            case 'diagnoses':
                return this.generateDiagnosesReportContent(data);
            case 'scheduling':
                return this.generateSchedulingReportContent(data);
            case 'utilization':
                return this.generateUtilizationReportContent(data);
            default:
                return this.generateGenericReportContent(data);
        }
    }

    generateRevenueReportContent(data) {
        const summary = data.summary;

        return `
            <div class="report-summary">
                <div class="summary-cards">
                    <div class="summary-card">
                        <h4>Total Revenue</h4>
                        <div class="metric-value">$${summary.totalRevenue.toLocaleString()}</div>
                    </div>
                    <div class="summary-card">
                        <h4>Total Transactions</h4>
                        <div class="metric-value">${summary.totalTransactions.toLocaleString()}</div>
                    </div>
                    <div class="summary-card">
                        <h4>Average Transaction</h4>
                        <div class="metric-value">$${summary.averageTransaction.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            <div class="report-charts">
                <div class="chart-container">
                    <h4>Daily Revenue Trend</h4>
                    <canvas id="revenue-chart"></canvas>
                </div>
            </div>

            <div class="report-table">
                <h4>Daily Revenue Data</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Revenue</th>
                            <th>Transactions</th>
                            <th>Average</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.dailyData.map(row => `
                            <tr>
                                <td>${new Date(row.date).toLocaleDateString()}</td>
                                <td>$${parseFloat(row.total_revenue).toLocaleString()}</td>
                                <td>${row.transaction_count}</td>
                                <td>$${parseFloat(row.average_transaction).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    generateExpensesReportContent(data) {
        const summary = data.summary;

        return `
            <div class="report-summary">
                <div class="summary-cards">
                    <div class="summary-card">
                        <h4>Total Expenses</h4>
                        <div class="metric-value">$${summary.totalExpenses.toLocaleString()}</div>
                    </div>
                    <div class="summary-card">
                        <h4>Categories</h4>
                        <div class="metric-value">${summary.categories.length}</div>
                    </div>
                </div>
            </div>

            <div class="report-charts">
                <div class="chart-container">
                    <h4>Expense Categories</h4>
                    <canvas id="expenses-chart"></canvas>
                </div>
            </div>

            <div class="report-table">
                <h4>Daily Expenses</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.dailyData.map(row => `
                            <tr>
                                <td>${new Date(row.date).toLocaleDateString()}</td>
                                <td>${row.category}</td>
                                <td>$${parseFloat(row.total_expense).toLocaleString()}</td>
                                <td>${row.expense_count}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    generateDemographicsReportContent(data) {
        const summary = data.summary;

        return `
            <div class="report-summary">
                <div class="summary-cards">
                    <div class="summary-card">
                        <h4>Total Patients</h4>
                        <div class="metric-value">${summary.totalPatients.toLocaleString()}</div>
                    </div>
                    <div class="summary-card">
                        <h4>Age Groups</h4>
                        <div class="metric-value">${summary.ageGroups.length}</div>
                    </div>
                </div>
            </div>

            <div class="report-charts">
                <div class="chart-container">
                    <h4>Age Distribution</h4>
                    <canvas id="age-distribution-chart"></canvas>
                </div>
                <div class="chart-container">
                    <h4>Gender Distribution</h4>
                    <canvas id="gender-distribution-chart"></canvas>
                </div>
            </div>

            <div class="report-table">
                <h4>Demographic Breakdown</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Age Group</th>
                            <th>Gender</th>
                            <th>Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.ageDistribution.map(row => `
                            <tr>
                                <td>${row.ageGroup}-${row.ageGroup + 9}</td>
                                <td>${row.gender}</td>
                                <td>${row.count}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    generateGenericReportContent(data) {
        return `
            <div class="report-summary">
                <h4>Report Summary</h4>
                <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
        `;
    }

    initializeCharts(reportData, reportType) {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded, skipping chart initialization');
            return;
        }

        switch (reportType) {
            case 'revenue':
                this.createRevenueChart(reportData.data);
                break;
            case 'expenses':
                this.createExpensesChart(reportData.data);
                break;
            case 'demographics':
                this.createDemographicsCharts(reportData.data);
                break;
            default:
                console.log('No specific chart for report type:', reportType);
        }
    }

    createRevenueChart(data) {
        const ctx = document.getElementById('revenue-chart');
        if (!ctx) return;

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.dailyData.map(row => new Date(row.date).toLocaleDateString()),
                datasets: [{
                    label: 'Daily Revenue',
                    data: data.dailyData.map(row => parseFloat(row.total_revenue)),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Revenue Trend'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });

        this.chartInstances.set('revenue-chart', chart);
    }

    createExpensesChart(data) {
        const ctx = document.getElementById('expenses-chart');
        if (!ctx) return;

        const categoryData = data.categoryBreakdown || [];

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryData.map(item => item.category),
                datasets: [{
                    data: categoryData.map(item => item.amount),
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#f5576c',
                        '#4facfe',
                        '#00f2fe'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Expense Categories'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        this.chartInstances.set('expenses-chart', chart);
    }

    createDemographicsCharts(data) {
        // Age distribution chart
        const ageCtx = document.getElementById('age-distribution-chart');
        if (ageCtx) {
            const ageChart = new Chart(ageCtx, {
                type: 'bar',
                data: {
                    labels: data.ageDistribution.map(item => `${item.ageGroup}-${item.ageGroup + 9}`),
                    datasets: [{
                        label: 'Patient Count',
                        data: data.ageDistribution.map(item => item.count),
                        backgroundColor: '#667eea'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Age Distribution'
                        }
                    }
                }
            });
            this.chartInstances.set('age-distribution-chart', ageChart);
        }

        // Gender distribution chart
        const genderCtx = document.getElementById('gender-distribution-chart');
        if (genderCtx) {
            const genderChart = new Chart(genderCtx, {
                type: 'pie',
                data: {
                    labels: Object.keys(data.genderDistribution),
                    datasets: [{
                        data: Object.values(data.genderDistribution),
                        backgroundColor: ['#667eea', '#764ba2', '#f093fb']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Gender Distribution'
                        }
                    }
                }
            });
            this.chartInstances.set('gender-distribution-chart', genderChart);
        }
    }

    // Utility methods
    getDefaultStartDate() {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().split('T')[0];
    }

    getDefaultEndDate() {
        return new Date().toISOString().split('T')[0];
    }

    getReportTitle(reportType) {
        const titles = {
            'revenue': 'Revenue Analysis',
            'expenses': 'Expense Breakdown',
            'profit-loss': 'Profit & Loss Statement',
            'billing': 'Billing Summary',
            'insurance': 'Insurance Claims',
            'demographics': 'Patient Demographics',
            'admissions': 'Admissions Analysis',
            'diagnoses': 'Diagnoses Report',
            'outcomes': 'Treatment Outcomes',
            'scheduling': 'Scheduling Analysis',
            'utilization': 'Resource Utilization',
            'wait-times': 'Wait Times Analysis',
            'cancellations': 'Cancellations Report'
        };

        return titles[reportType] || 'Report';
    }

    applyFilters() {
        this.filters.startDate = document.getElementById('start-date').value;
        this.filters.endDate = document.getElementById('end-date').value;
        this.filters.department = document.getElementById('department-filter').value;
        this.filters.doctor = document.getElementById('doctor-filter').value;
        this.filters.format = document.getElementById('format-filter').value;

        // Reload current report if one is active
        if (this.currentReport) {
            this.loadReport(this.currentReport.type);
        }
    }

    updateDoctorFilter() {
        // This would typically fetch doctors based on department
        // For now, just showing a placeholder
        const doctorSelect = document.getElementById('doctor-filter');
        if (doctorSelect) {
            doctorSelect.innerHTML = '<option value="">All Doctors</option>';
        }
    }

    showLoadingState() {
        const content = document.getElementById('report-content');
        if (content) {
            content.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Loading report...</p>
                </div>
            `;
        }
    }

    showErrorState(message) {
        const content = document.getElementById('report-content');
        if (content) {
            content.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Report</h3>
                    <p>${message}</p>
                    <button class="retry-btn" onclick="window.reportingDashboard.refreshReport('${this.currentReport?.type}')">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    async exportReport(reportType) {
        try {
            const endpoint = this.getReportEndpoint(reportType);
            if (!endpoint) return;

            const queryParams = new URLSearchParams({
                startDate: this.filters.startDate,
                endDate: this.filters.endDate,
                format: this.filters.format
            });

            if (this.filters.department) {
                queryParams.append('department', this.filters.department);
            }

            const response = await fetch(`${endpoint}?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${reportType}-report.${this.filters.format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Error exporting report:', error);
            alert('Failed to export report: ' + error.message);
        }
    }

    async refreshReport(reportType) {
        if (reportType) {
            await this.loadReport(reportType);
        }
    }

    showNewReportModal() {
        // Implementation for new report modal
        console.log('Show new report modal');
    }

    showTemplatesModal() {
        // Implementation for templates modal
        console.log('Show templates modal');
    }

    showHistoryModal() {
        // Implementation for history modal
        console.log('Show history modal');
    }

    showCustomReportModal() {
        // Implementation for custom report modal
        console.log('Show custom report modal');
    }

    async exportAllReports() {
        // Implementation for exporting all reports
        console.log('Export all reports');
    }

    async loadReportTemplates() {
        try {
            const response = await fetch('/api/reporting/templates', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Report templates loaded:', data);
            }
        } catch (error) {
            console.error('Error loading report templates:', error);
        }
    }
}

// Initialize reporting dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.reportingDashboard = new ReportingDashboard();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportingDashboard;
}


