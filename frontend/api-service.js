/**
 * API Service for HMIS Frontend
 * Handles all API communication with the backend
 */

class APIService {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.token = localStorage.getItem('token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // Get authentication token
    getToken() {
        return this.token || localStorage.getItem('token');
    }

    // Clear authentication token
    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    this.clearToken();
                    window.location.href = '/login.html';
                    throw new Error('Authentication required');
                }
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Authentication API
    async login(username, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (response.success) {
            this.setToken(response.data.token);
            localStorage.setItem('userData', JSON.stringify(response.data.user));
        }

        return response;
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } finally {
            this.clearToken();
        }
    }

    async getProfile() {
        return await this.request('/auth/profile');
    }

    // Patients API
    async getPatients(page = 1, limit = 10, filters = {}) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
        });
        return await this.request(`/patients?${params}`);
    }

    async getPatientById(id) {
        return await this.request(`/patients/${id}`);
    }

    async createPatient(patientData) {
        return await this.request('/patients', {
            method: 'POST',
            body: JSON.stringify(patientData)
        });
    }

    async updatePatient(id, patientData) {
        return await this.request(`/patients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(patientData)
        });
    }

    async deletePatient(id) {
        return await this.request(`/patients/${id}`, {
            method: 'DELETE'
        });
    }

    async getPatientStatistics() {
        return await this.request('/patients/stats');
    }

    async searchPatients(query) {
        return await this.request(`/patients/search?q=${encodeURIComponent(query)}`);
    }

    // Appointments API
    async getAppointments(page = 1, limit = 10, filters = {}) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
        });
        return await this.request(`/appointments?${params}`);
    }

    async getAppointmentById(id) {
        return await this.request(`/appointments/${id}`);
    }

    async createAppointment(appointmentData) {
        return await this.request('/appointments', {
            method: 'POST',
            body: JSON.stringify(appointmentData)
        });
    }

    async updateAppointment(id, appointmentData) {
        return await this.request(`/appointments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(appointmentData)
        });
    }

    async deleteAppointment(id) {
        return await this.request(`/appointments/${id}`, {
            method: 'DELETE'
        });
    }

    // Doctors API
    async getDoctors(page = 1, limit = 10, filters = {}) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
        });
        return await this.request(`/doctors/availability?${params}`);
    }

    async getDoctorById(id) {
        return await this.request(`/doctors/availability/${id}`);
    }

    async updateDoctorAvailability(id, availabilityData) {
        return await this.request(`/doctors/availability/${id}`, {
            method: 'PUT',
            body: JSON.stringify(availabilityData)
        });
    }

    async getDoctorSchedule(id, date) {
        const params = date ? `?date=${date}` : '';
        return await this.request(`/doctors/schedule/${id}${params}`);
    }

    // Medical Records API
    async getMedicalRecords(patientId) {
        return await this.request(`/patients/${patientId}/medical-records`);
    }

    async createMedicalRecord(recordData) {
        return await this.request('/medical/records', {
            method: 'POST',
            body: JSON.stringify(recordData)
        });
    }

    async updateMedicalRecord(id, recordData) {
        return await this.request(`/medical/records/${id}`, {
            method: 'PUT',
            body: JSON.stringify(recordData)
        });
    }

    // Prescriptions API
    async getPrescriptions(patientId) {
        return await this.request(`/patients/${patientId}/prescriptions`);
    }

    async createPrescription(prescriptionData) {
        return await this.request('/medical/prescriptions', {
            method: 'POST',
            body: JSON.stringify(prescriptionData)
        });
    }

    async updatePrescription(id, prescriptionData) {
        return await this.request(`/medical/prescriptions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(prescriptionData)
        });
    }

    // Lab Tests API
    async getLabTests(patientId) {
        return await this.request(`/patients/${patientId}/lab-tests`);
    }

    async createLabTest(testData) {
        return await this.request('/lab/tests', {
            method: 'POST',
            body: JSON.stringify(testData)
        });
    }

    async updateLabTest(id, testData) {
        return await this.request(`/lab/tests/${id}`, {
            method: 'PUT',
            body: JSON.stringify(testData)
        });
    }

    // Billing API
    async getBilling(patientId) {
        return await this.request(`/patients/${patientId}/billing`);
    }

    async createBill(billData) {
        return await this.request('/billing', {
            method: 'POST',
            body: JSON.stringify(billData)
        });
    }

    async updateBill(id, billData) {
        return await this.request(`/billing/${id}`, {
            method: 'PUT',
            body: JSON.stringify(billData)
        });
    }

    // Notifications API
    async getNotifications() {
        return await this.request('/notifications');
    }

    async markNotificationAsRead(id) {
        return await this.request(`/notifications/${id}/read`, {
            method: 'PUT'
        });
    }

    // Analytics API
    async getDashboardStats() {
        return await this.request('/analytics/dashboard');
    }

    async getPatientAnalytics() {
        return await this.request('/analytics/patients');
    }

    async getAppointmentAnalytics() {
        return await this.request('/analytics/appointments');
    }

    // Health Check
    async healthCheck() {
        return await this.request('/health');
    }

    // Utility methods
    formatDate(date) {
        return new Date(date).toLocaleDateString();
    }

    formatTime(time) {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Error handling
    handleError(error, context = '') {
        console.error(`API Error ${context}:`, error);

        let message = 'An unexpected error occurred';

        if (error.message) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }

        // Show user-friendly error message
        this.showNotification(message, 'error');

        return message;
    }

    // Notification system
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${this.getNotificationColor(type)};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 1001;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: 400px;
      word-wrap: break-word;
    `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }
}

// Create global instance
window.apiService = new APIService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIService;
}

