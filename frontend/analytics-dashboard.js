// Analytics Dashboard JavaScript
class AnalyticsDashboard {
    constructor() {
        this.charts = {};
        this.currentData = {};
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setDefaultDateRange();
        await this.loadAnalytics();
    }

    setupEventListeners() {
        // Date range change
        document.getElementById('startDate').addEventListener('change', () => {
            this.updateAnalytics();
        });
        
        document.getElementById('endDate').addEventListener('change', () => {
            this.updateAnalytics();
        });

        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.switchTab(tabName);
            });
        });
    }

    setDefaultDateRange() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);

        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    }

    async loadAnalytics() {
        this.showLoading(true);
        this.hideError();

        try {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;

            // Load dashboard analytics
            const dashboardData = await this.fetchAnalytics('/api/analytics/dashboard', {
                startDate,
                endDate
            });

            // Load patient analytics
            const patientData = await this.fetchAnalytics('/api/analytics/patients', {
                startDate,
                endDate,
                groupBy: 'month'
            });

            // Load financial analytics
            const financialData = await this.fetchAnalytics('/api/analytics/financial', {
                startDate,
                endDate,
                groupBy: 'month'
            });

            // Load operational analytics
            const operationalData = await this.fetchAnalytics('/api/analytics/operational', {
                startDate,
                endDate
            });

            this.currentData = {
                dashboard: dashboardData,
                patients: patientData,
                financial: financialData,
                operational: operationalData
            };

            this.updateDashboardMetrics();
            this.updateCharts();
            this.updateTables();

        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showError('Failed to load analytics data: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async fetchAnalytics(endpoint, params = {}) {
        const token = localStorage.getItem('token');
        const queryString = new URLSearchParams(params).toString();
        const url = `${endpoint}${queryString ? '?' + queryString : ''}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.data;
    }

    updateDashboardMetrics() {
        const data = this.currentData.dashboard;
        if (!data) return;

        // Update key metrics
        document.getElementById('totalPatients').textContent = data.patients?.total_patients || 0;
        document.getElementById('totalAppointments').textContent = data.appointments?.total_appointments || 0;
        document.getElementById('totalRevenue').textContent = this.formatCurrency(data.revenue?.total_revenue || 0);
        document.getElementById('completionRate').textContent = this.calculateCompletionRate(data.appointments) + '%';

        // Update change indicators
        this.updateChangeIndicator('patientsChange', data.patients?.new_patients_week || 0);
        this.updateChangeIndicator('appointmentsChange', data.appointments?.upcoming || 0);
        this.updateChangeIndicator('revenueChange', data.revenue?.revenue_month || 0);
        this.updateChangeIndicator('completionChange', this.calculateCompletionRate(data.appointments));
    }

    calculateCompletionRate(appointments) {
        if (!appointments || !appointments.total_appointments) return 0;
        return Math.round((appointments.completed / appointments.total_appointments) * 100);
    }

    updateChangeIndicator(elementId, value) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const isPositive = value > 0;
        element.className = `metric-change ${isPositive ? 'positive' : 'negative'}`;
        element.innerHTML = `
            <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i> 
            ${isPositive ? '+' : ''}${value}${elementId.includes('Rate') ? '%' : ''} from last month
        `;
    }

    updateCharts() {
        this.updatePatientTrendsChart();
        this.updateAppointmentStatusChart();
        this.updateDemographicsChart();
        this.updateRevenueTrendsChart();
        this.updatePaymentStatusChart();
        this.updateResourceUtilizationChart();
    }

    updatePatientTrendsChart() {
        const ctx = document.getElementById('patientTrendsChart');
        if (!ctx) return;

        const data = this.currentData.patients?.registrationTrends || [];
        
        if (this.charts.patientTrends) {
            this.charts.patientTrends.destroy();
        }

        this.charts.patientTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => item.period),
                datasets: [{
                    label: 'New Patients',
                    data: data.map(item => item.new_patients),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    updateAppointmentStatusChart() {
        const ctx = document.getElementById('appointmentStatusChart');
        if (!ctx) return;

        const data = this.currentData.dashboard?.appointments;
        if (!data) return;

        if (this.charts.appointmentStatus) {
            this.charts.appointmentStatus.destroy();
        }

        this.charts.appointmentStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Scheduled', 'Completed', 'Cancelled', 'No Show'],
                datasets: [{
                    data: [
                        data.scheduled || 0,
                        data.completed || 0,
                        data.cancelled || 0,
                        data.no_show || 0
                    ],
                    backgroundColor: [
                        '#667eea',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateDemographicsChart() {
        const ctx = document.getElementById('demographicsChart');
        if (!ctx) return;

        const data = this.currentData.dashboard?.demographics || [];
        
        if (this.charts.demographics) {
            this.charts.demographics.destroy();
        }

        // Group data by age group
        const ageGroups = {};
        data.forEach(item => {
            if (!ageGroups[item.age_group]) {
                ageGroups[item.age_group] = { male: 0, female: 0, other: 0 };
            }
            ageGroups[item.age_group][item.gender] = item.count;
        });

        this.charts.demographics = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(ageGroups),
                datasets: [
                    {
                        label: 'Male',
                        data: Object.values(ageGroups).map(group => group.male),
                        backgroundColor: '#667eea'
                    },
                    {
                        label: 'Female',
                        data: Object.values(ageGroups).map(group => group.female),
                        backgroundColor: '#764ba2'
                    },
                    {
                        label: 'Other',
                        data: Object.values(ageGroups).map(group => group.other),
                        backgroundColor: '#f59e0b'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateRevenueTrendsChart() {
        const ctx = document.getElementById('revenueTrendsChart');
        if (!ctx) return;

        const data = this.currentData.financial?.revenueTrends || [];
        
        if (this.charts.revenueTrends) {
            this.charts.revenueTrends.destroy();
        }

        this.charts.revenueTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => item.period),
                datasets: [{
                    label: 'Revenue',
                    data: data.map(item => item.revenue),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
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
    }

    updatePaymentStatusChart() {
        const ctx = document.getElementById('paymentStatusChart');
        if (!ctx) return;

        const data = this.currentData.financial?.paymentStatus || [];
        
        if (this.charts.paymentStatus) {
            this.charts.paymentStatus.destroy();
        }

        this.charts.paymentStatus = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.map(item => item.payment_status),
                datasets: [{
                    data: data.map(item => item.count),
                    backgroundColor: [
                        '#10b981',
                        '#f59e0b',
                        '#ef4444'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateResourceUtilizationChart() {
        const ctx = document.getElementById('resourceUtilizationChart');
        if (!ctx) return;

        const data = this.currentData.operational?.resourceUtilization || [];
        
        if (this.charts.resourceUtilization) {
            this.charts.resourceUtilization.destroy();
        }

        this.charts.resourceUtilization = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item.resource_name),
                datasets: [{
                    label: 'Utilization %',
                    data: data.map(item => item.utilization_percentage || 0),
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    updateTables() {
        this.updateDoctorPerformanceTable();
        this.updateFinancialSummaryTable();
    }

    updateDoctorPerformanceTable() {
        const tbody = document.getElementById('doctorPerformanceBody');
        if (!tbody) return;

        const data = this.currentData.dashboard?.doctorPerformance || [];
        
        tbody.innerHTML = data.map(doctor => `
            <tr>
                <td>${doctor.first_name} ${doctor.last_name}</td>
                <td>${doctor.total_appointments || 0}</td>
                <td>${doctor.completed_appointments || 0}</td>
                <td>${doctor.completion_rate || 0}%</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${doctor.completion_rate || 0}%"></div>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    updateFinancialSummaryTable() {
        const tbody = document.getElementById('financialSummaryBody');
        if (!tbody) return;

        const data = this.currentData.financial?.revenueByService || [];
        
        tbody.innerHTML = data.map(service => `
            <tr>
                <td>${service.service_type || 'N/A'}</td>
                <td>${this.formatCurrency(service.total_revenue || 0)}</td>
                <td>${service.total_bills || 0}</td>
                <td>${this.formatCurrency(service.average_amount || 0)}</td>
            </tr>
        `).join('');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Load tab-specific data if needed
        if (tabName === 'patients' && !this.charts.demographics) {
            this.updateDemographicsChart();
        } else if (tabName === 'financial' && !this.charts.revenueTrends) {
            this.updateRevenueTrendsChart();
            this.updatePaymentStatusChart();
        } else if (tabName === 'operational' && !this.charts.resourceUtilization) {
            this.updateResourceUtilizationChart();
        }
    }

    async exportData(format) {
        try {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                startDate,
                endDate,
                format
            });

            const response = await fetch(`/api/analytics/export/dashboard?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hmis_analytics_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Export error:', error);
            this.showError('Failed to export data: ' + error.message);
        }
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    hideError() {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }

    updateAnalytics() {
        this.loadAnalytics();
    }
}

// Global functions for HTML onclick handlers
function switchTab(tabName) {
    if (window.analyticsDashboard) {
        window.analyticsDashboard.switchTab(tabName);
    }
}

function updateAnalytics() {
    if (window.analyticsDashboard) {
        window.analyticsDashboard.updateAnalytics();
    }
}

function exportData(format) {
    if (window.analyticsDashboard) {
        window.analyticsDashboard.exportData(format);
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsDashboard = new AnalyticsDashboard();
});


