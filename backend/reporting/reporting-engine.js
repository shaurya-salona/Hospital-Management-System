/**
 * Advanced Reporting Engine for HMIS
 * Handles financial reports, analytics, and custom reporting
 */

const { logger } = require('../config/logger');
const { query } = require('../config/database');

class ReportingEngine {
    constructor() {
        this.reportTypes = {
            FINANCIAL: 'financial',
            PATIENT: 'patient',
            APPOINTMENT: 'appointment',
            INVENTORY: 'inventory',
            STAFF: 'staff',
            CUSTOM: 'custom'
        };

        this.reportFormats = {
            PDF: 'pdf',
            EXCEL: 'excel',
            CSV: 'csv',
            JSON: 'json'
        };

        this.init();
    }

    init() {
        logger.info('Reporting Engine initialized');
    }

    // Financial Reports
    async generateFinancialReport(params) {
        try {
            const {
                startDate,
                endDate,
                reportType = 'revenue',
                department = null,
                format = 'json'
            } = params;

            let reportData = {};

            switch (reportType) {
                case 'revenue':
                    reportData = await this.generateRevenueReport(startDate, endDate, department);
                    break;
                case 'expenses':
                    reportData = await this.generateExpensesReport(startDate, endDate, department);
                    break;
                case 'profit_loss':
                    reportData = await this.generateProfitLossReport(startDate, endDate, department);
                    break;
                case 'billing':
                    reportData = await this.generateBillingReport(startDate, endDate, department);
                    break;
                case 'insurance':
                    reportData = await this.generateInsuranceReport(startDate, endDate, department);
                    break;
                default:
                    throw new Error('Invalid financial report type');
            }

            return {
                success: true,
                data: reportData,
                metadata: {
                    reportType: 'financial',
                    subType: reportType,
                    startDate,
                    endDate,
                    department,
                    generatedAt: new Date(),
                    format
                }
            };

        } catch (error) {
            logger.error('Error generating financial report:', error);
            throw error;
        }
    }

    async generateRevenueReport(startDate, endDate, department) {
        const baseQuery = `
            SELECT
                DATE(created_at) as date,
                SUM(amount) as total_revenue,
                COUNT(*) as transaction_count,
                AVG(amount) as average_transaction
            FROM billing
            WHERE created_at BETWEEN $1 AND $2
        `;

        const params = [startDate, endDate];
        let query = baseQuery;

        if (department) {
            query += ` AND department = $3`;
            params.push(department);
        }

        query += ` GROUP BY DATE(created_at) ORDER BY date`;

        const result = await query(query, params);

        // Calculate summary statistics
        const totalRevenue = result.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0);
        const totalTransactions = result.rows.reduce((sum, row) => sum + parseInt(row.transaction_count), 0);
        const averageTransaction = totalRevenue / totalTransactions || 0;

        return {
            summary: {
                totalRevenue,
                totalTransactions,
                averageTransaction,
                dateRange: { startDate, endDate },
                department
            },
            dailyData: result.rows,
            trends: await this.calculateRevenueTrends(result.rows)
        };
    }

    async generateExpensesReport(startDate, endDate, department) {
        const baseQuery = `
            SELECT
                DATE(created_at) as date,
                category,
                SUM(amount) as total_expense,
                COUNT(*) as expense_count
            FROM expenses
            WHERE created_at BETWEEN $1 AND $2
        `;

        const params = [startDate, endDate];
        let query = baseQuery;

        if (department) {
            query += ` AND department = $3`;
            params.push(department);
        }

        query += ` GROUP BY DATE(created_at), category ORDER BY date, category`;

        const result = await query(query, params);

        // Calculate summary statistics
        const totalExpenses = result.rows.reduce((sum, row) => sum + parseFloat(row.total_expense), 0);
        const categories = [...new Set(result.rows.map(row => row.category))];

        return {
            summary: {
                totalExpenses,
                categories,
                dateRange: { startDate, endDate },
                department
            },
            dailyData: result.rows,
            categoryBreakdown: await this.calculateCategoryBreakdown(result.rows)
        };
    }

    async generateProfitLossReport(startDate, endDate, department) {
        const revenueData = await this.generateRevenueReport(startDate, endDate, department);
        const expenseData = await this.generateExpensesReport(startDate, endDate, department);

        const netProfit = revenueData.summary.totalRevenue - expenseData.summary.totalExpenses;
        const profitMargin = (netProfit / revenueData.summary.totalRevenue) * 100;

        return {
            summary: {
                totalRevenue: revenueData.summary.totalRevenue,
                totalExpenses: expenseData.summary.totalExpenses,
                netProfit,
                profitMargin,
                dateRange: { startDate, endDate },
                department
            },
            revenue: revenueData,
            expenses: expenseData,
            trends: await this.calculateProfitTrends(revenueData.dailyData, expenseData.dailyData)
        };
    }

    async generateBillingReport(startDate, endDate, department) {
        const query = `
            SELECT
                b.*,
                p.name as patient_name,
                p.id as patient_id,
                d.name as doctor_name,
                d.specialization
            FROM billing b
            LEFT JOIN patients p ON b.patient_id = p.id
            LEFT JOIN doctors d ON b.doctor_id = d.id
            WHERE b.created_at BETWEEN $1 AND $2
            ${department ? 'AND b.department = $3' : ''}
            ORDER BY b.created_at DESC
        `;

        const params = department ? [startDate, endDate, department] : [startDate, endDate];
        const result = await query(query, params);

        const summary = {
            totalBills: result.rows.length,
            totalAmount: result.rows.reduce((sum, row) => sum + parseFloat(row.amount), 0),
            paidAmount: result.rows.filter(row => row.status === 'paid').reduce((sum, row) => sum + parseFloat(row.amount), 0),
            pendingAmount: result.rows.filter(row => row.status === 'pending').reduce((sum, row) => sum + parseFloat(row.amount), 0),
            dateRange: { startDate, endDate }
        };

        return {
            summary,
            bills: result.rows,
            statusBreakdown: await this.calculateStatusBreakdown(result.rows)
        };
    }

    async generateInsuranceReport(startDate, endDate, department) {
        const query = `
            SELECT
                i.*,
                p.name as patient_name,
                p.id as patient_id,
                b.amount as bill_amount,
                b.status as bill_status
            FROM insurance_claims i
            LEFT JOIN patients p ON i.patient_id = p.id
            LEFT JOIN billing b ON i.billing_id = b.id
            WHERE i.created_at BETWEEN $1 AND $2
            ${department ? 'AND i.department = $3' : ''}
            ORDER BY i.created_at DESC
        `;

        const params = department ? [startDate, endDate, department] : [startDate, endDate];
        const result = await query(query, params);

        const summary = {
            totalClaims: result.rows.length,
            totalClaimAmount: result.rows.reduce((sum, row) => sum + parseFloat(row.claim_amount), 0),
            approvedClaims: result.rows.filter(row => row.status === 'approved').length,
            pendingClaims: result.rows.filter(row => row.status === 'pending').length,
            rejectedClaims: result.rows.filter(row => row.status === 'rejected').length,
            dateRange: { startDate, endDate }
        };

        return {
            summary,
            claims: result.rows,
            statusBreakdown: await this.calculateInsuranceStatusBreakdown(result.rows)
        };
    }

    // Patient Analytics Reports
    async generatePatientAnalytics(params) {
        try {
            const {
                startDate,
                endDate,
                reportType = 'demographics',
                department = null,
                format = 'json'
            } = params;

            let reportData = {};

            switch (reportType) {
                case 'demographics':
                    reportData = await this.generateDemographicsReport(startDate, endDate, department);
                    break;
                case 'admissions':
                    reportData = await this.generateAdmissionsReport(startDate, endDate, department);
                    break;
                case 'diagnoses':
                    reportData = await this.generateDiagnosesReport(startDate, endDate, department);
                    break;
                case 'outcomes':
                    reportData = await this.generateOutcomesReport(startDate, endDate, department);
                    break;
                default:
                    throw new Error('Invalid patient analytics report type');
            }

            return {
                success: true,
                data: reportData,
                metadata: {
                    reportType: 'patient_analytics',
                    subType: reportType,
                    startDate,
                    endDate,
                    department,
                    generatedAt: new Date(),
                    format
                }
            };

        } catch (error) {
            logger.error('Error generating patient analytics report:', error);
            throw error;
        }
    }

    async generateDemographicsReport(startDate, endDate, department) {
        const query = `
            SELECT
                EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) as age_group,
                gender,
                COUNT(*) as patient_count
            FROM patients
            WHERE created_at BETWEEN $1 AND $2
            ${department ? 'AND department = $3' : ''}
            GROUP BY age_group, gender
            ORDER BY age_group, gender
        `;

        const params = department ? [startDate, endDate, department] : [startDate, endDate];
        const result = await query(query, params);

        const totalPatients = result.rows.reduce((sum, row) => sum + parseInt(row.patient_count), 0);
        const ageGroups = [...new Set(result.rows.map(row => Math.floor(row.age_group / 10) * 10))];
        const genderDistribution = this.calculateGenderDistribution(result.rows);

        return {
            summary: {
                totalPatients,
                dateRange: { startDate, endDate },
                department
            },
            ageDistribution: this.calculateAgeDistribution(result.rows),
            genderDistribution,
            ageGroups: ageGroups.sort((a, b) => a - b)
        };
    }

    async generateAdmissionsReport(startDate, endDate, department) {
        const query = `
            SELECT
                DATE(admission_date) as date,
                COUNT(*) as admissions,
                AVG(EXTRACT(EPOCH FROM (discharge_date - admission_date))/86400) as avg_length_of_stay
            FROM admissions
            WHERE admission_date BETWEEN $1 AND $2
            ${department ? 'AND department = $3' : ''}
            GROUP BY DATE(admission_date)
            ORDER BY date
        `;

        const params = department ? [startDate, endDate, department] : [startDate, endDate];
        const result = await query(query, params);

        const totalAdmissions = result.rows.reduce((sum, row) => sum + parseInt(row.admissions), 0);
        const avgLengthOfStay = result.rows.reduce((sum, row) => sum + parseFloat(row.avg_length_of_stay || 0), 0) / result.rows.length;

        return {
            summary: {
                totalAdmissions,
                avgLengthOfStay,
                dateRange: { startDate, endDate },
                department
            },
            dailyData: result.rows,
            trends: await this.calculateAdmissionTrends(result.rows)
        };
    }

    async generateDiagnosesReport(startDate, endDate, department) {
        const query = `
            SELECT
                diagnosis,
                COUNT(*) as diagnosis_count,
                AVG(EXTRACT(EPOCH FROM (discharge_date - admission_date))/86400) as avg_treatment_duration
            FROM medical_records
            WHERE created_at BETWEEN $1 AND $2
            ${department ? 'AND department = $3' : ''}
            GROUP BY diagnosis
            ORDER BY diagnosis_count DESC
        `;

        const params = department ? [startDate, endDate, department] : [startDate, endDate];
        const result = await query(query, params);

        const totalDiagnoses = result.rows.reduce((sum, row) => sum + parseInt(row.diagnosis_count), 0);
        const topDiagnoses = result.rows.slice(0, 10);

        return {
            summary: {
                totalDiagnoses,
                uniqueDiagnoses: result.rows.length,
                dateRange: { startDate, endDate },
                department
            },
            topDiagnoses,
            allDiagnoses: result.rows,
            trends: await this.calculateDiagnosisTrends(result.rows)
        };
    }

    async generateOutcomesReport(startDate, endDate, department) {
        const query = `
            SELECT
                outcome,
                COUNT(*) as outcome_count,
                AVG(EXTRACT(EPOCH FROM (discharge_date - admission_date))/86400) as avg_treatment_duration
            FROM admissions
            WHERE discharge_date BETWEEN $1 AND $2
            ${department ? 'AND department = $3' : ''}
            GROUP BY outcome
            ORDER BY outcome_count DESC
        `;

        const params = department ? [startDate, endDate, department] : [startDate, endDate];
        const result = await query(query, params);

        const totalOutcomes = result.rows.reduce((sum, row) => sum + parseInt(row.outcome_count), 0);
        const successRate = result.rows.find(row => row.outcome === 'recovered')?.outcome_count / totalOutcomes * 100 || 0;

        return {
            summary: {
                totalOutcomes,
                successRate,
                dateRange: { startDate, endDate },
                department
            },
            outcomes: result.rows,
            trends: await this.calculateOutcomeTrends(result.rows)
        };
    }

    // Appointment Analytics
    async generateAppointmentAnalytics(params) {
        try {
            const {
                startDate,
                endDate,
                reportType = 'scheduling',
                doctor = null,
                department = null,
                format = 'json'
            } = params;

            let reportData = {};

            switch (reportType) {
                case 'scheduling':
                    reportData = await this.generateSchedulingReport(startDate, endDate, doctor, department);
                    break;
                case 'utilization':
                    reportData = await this.generateUtilizationReport(startDate, endDate, doctor, department);
                    break;
                case 'wait_times':
                    reportData = await this.generateWaitTimesReport(startDate, endDate, doctor, department);
                    break;
                case 'cancellations':
                    reportData = await this.generateCancellationsReport(startDate, endDate, doctor, department);
                    break;
                default:
                    throw new Error('Invalid appointment analytics report type');
            }

            return {
                success: true,
                data: reportData,
                metadata: {
                    reportType: 'appointment_analytics',
                    subType: reportType,
                    startDate,
                    endDate,
                    doctor,
                    department,
                    generatedAt: new Date(),
                    format
                }
            };

        } catch (error) {
            logger.error('Error generating appointment analytics report:', error);
            throw error;
        }
    }

    async generateSchedulingReport(startDate, endDate, doctor, department) {
        const query = `
            SELECT
                DATE(appointment_date) as date,
                COUNT(*) as total_appointments,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
                COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show
            FROM appointments
            WHERE appointment_date BETWEEN $1 AND $2
            ${doctor ? 'AND doctor_id = $3' : ''}
            ${department ? `AND ${doctor ? 'department = $4' : 'department = $3'}` : ''}
            GROUP BY DATE(appointment_date)
            ORDER BY date
        `;

        const params = [startDate, endDate];
        if (doctor) params.push(doctor);
        if (department) params.push(department);

        const result = await query(query, params);

        const totalAppointments = result.rows.reduce((sum, row) => sum + parseInt(row.total_appointments), 0);
        const completedAppointments = result.rows.reduce((sum, row) => sum + parseInt(row.completed), 0);
        const completionRate = (completedAppointments / totalAppointments) * 100;

        return {
            summary: {
                totalAppointments,
                completedAppointments,
                completionRate,
                dateRange: { startDate, endDate },
                doctor,
                department
            },
            dailyData: result.rows,
            trends: await this.calculateSchedulingTrends(result.rows)
        };
    }

    async generateUtilizationReport(startDate, endDate, doctor, department) {
        const query = `
            SELECT
                d.name as doctor_name,
                d.specialization,
                COUNT(a.id) as total_appointments,
                COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
                AVG(EXTRACT(EPOCH FROM (a.end_time - a.start_time))/3600) as avg_appointment_duration
            FROM doctors d
            LEFT JOIN appointments a ON d.id = a.doctor_id
                AND a.appointment_date BETWEEN $1 AND $2
            ${department ? 'WHERE d.department = $3' : ''}
            GROUP BY d.id, d.name, d.specialization
            ORDER BY total_appointments DESC
        `;

        const params = [startDate, endDate];
        if (department) params.push(department);

        const result = await query(query, params);

        const totalDoctors = result.rows.length;
        const avgUtilization = result.rows.reduce((sum, row) => {
            const utilization = (parseInt(row.completed_appointments) / parseInt(row.total_appointments)) * 100;
            return sum + (isNaN(utilization) ? 0 : utilization);
        }, 0) / totalDoctors;

        return {
            summary: {
                totalDoctors,
                avgUtilization,
                dateRange: { startDate, endDate },
                department
            },
            doctorUtilization: result.rows,
            trends: await this.calculateUtilizationTrends(result.rows)
        };
    }

    // Custom Report Builder
    async generateCustomReport(params) {
        try {
            const {
                query: customQuery,
                parameters = [],
                reportName,
                description,
                format = 'json'
            } = params;

            // Validate query for security
            if (!this.validateCustomQuery(customQuery)) {
                throw new Error('Invalid or potentially dangerous query');
            }

            const result = await query(customQuery, parameters);

            return {
                success: true,
                data: {
                    reportName,
                    description,
                    results: result.rows,
                    rowCount: result.rows.length,
                    generatedAt: new Date()
                },
                metadata: {
                    reportType: 'custom',
                    reportName,
                    description,
                    generatedAt: new Date(),
                    format
                }
            };

        } catch (error) {
            logger.error('Error generating custom report:', error);
            throw error;
        }
    }

    // Helper Methods
    async calculateRevenueTrends(dailyData) {
        if (dailyData.length < 2) return { trend: 'insufficient_data' };

        const firstHalf = dailyData.slice(0, Math.floor(dailyData.length / 2));
        const secondHalf = dailyData.slice(Math.floor(dailyData.length / 2));

        const firstHalfAvg = firstHalf.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0) / secondHalf.length;

        const trend = secondHalfAvg > firstHalfAvg ? 'increasing' : 'decreasing';
        const percentageChange = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

        return { trend, percentageChange };
    }

    async calculateCategoryBreakdown(expenseData) {
        const categories = {};
        expenseData.forEach(row => {
            if (!categories[row.category]) {
                categories[row.category] = 0;
            }
            categories[row.category] += parseFloat(row.total_expense);
        });

        return Object.entries(categories)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);
    }

    calculateGenderDistribution(data) {
        const distribution = { male: 0, female: 0, other: 0 };
        data.forEach(row => {
            distribution[row.gender.toLowerCase()] += parseInt(row.patient_count);
        });
        return distribution;
    }

    calculateAgeDistribution(data) {
        const ageGroups = {};
        data.forEach(row => {
            const ageGroup = Math.floor(row.age_group / 10) * 10;
            if (!ageGroups[ageGroup]) {
                ageGroups[ageGroup] = 0;
            }
            ageGroups[ageGroup] += parseInt(row.patient_count);
        });

        return Object.entries(ageGroups)
            .map(([ageGroup, count]) => ({ ageGroup: parseInt(ageGroup), count }))
            .sort((a, b) => a.ageGroup - b.ageGroup);
    }

    validateCustomQuery(query) {
        // Basic SQL injection protection
        const dangerousPatterns = [
            /DROP\s+TABLE/i,
            /DELETE\s+FROM/i,
            /UPDATE\s+.*SET/i,
            /INSERT\s+INTO/i,
            /ALTER\s+TABLE/i,
            /CREATE\s+TABLE/i,
            /TRUNCATE/i,
            /EXEC\s*\(/i,
            /UNION\s+SELECT/i
        ];

        return !dangerousPatterns.some(pattern => pattern.test(query));
    }

    // Export Methods
    async exportReport(reportData, format) {
        switch (format) {
            case 'pdf':
                return await this.exportToPDF(reportData);
            case 'excel':
                return await this.exportToExcel(reportData);
            case 'csv':
                return await this.exportToCSV(reportData);
            case 'json':
            default:
                return reportData;
        }
    }

    async exportToPDF(reportData) {
        // PDF generation logic would go here
        // This would typically use a library like puppeteer or pdfkit
        return {
            success: true,
            format: 'pdf',
            data: reportData,
            message: 'PDF export functionality to be implemented'
        };
    }

    async exportToExcel(reportData) {
        // Excel generation logic would go here
        // This would typically use a library like exceljs
        return {
            success: true,
            format: 'excel',
            data: reportData,
            message: 'Excel export functionality to be implemented'
        };
    }

    async exportToCSV(reportData) {
        // CSV generation logic would go here
        return {
            success: true,
            format: 'csv',
            data: reportData,
            message: 'CSV export functionality to be implemented'
        };
    }
}

module.exports = ReportingEngine;


