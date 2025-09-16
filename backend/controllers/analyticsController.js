// Try to load real database, fallback to demo database
let db;
try {
  db = require('../config/database');
} catch (error) {
  db = require('../config/demo-database');
}

const logger = require('../config/logger');
const { catchAsync } = require('../middlewares/errorHandler');

/**
 * Advanced Analytics Controller
 * Provides comprehensive reporting and analytics for HMIS
 */

// Dashboard Analytics
const getDashboardAnalytics = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  try {
    // Check if we're using demo database
    const isDemoMode = db.demoData !== undefined;
    
    if (isDemoMode) {
      // Use demo data for analytics
      const demoData = db.demoData;
      
      // Patient statistics
      const patientStats = {
        total_patients: demoData.patients.length,
        new_patients_week: Math.floor(demoData.patients.length * 0.1),
        new_patients_month: Math.floor(demoData.patients.length * 0.3)
      };

      // Appointment statistics
      const appointmentStats = {
        total_appointments: demoData.appointments.length,
        scheduled: demoData.appointments.filter(a => a.status === 'scheduled').length,
        completed: demoData.appointments.filter(a => a.status === 'completed').length,
        cancelled: demoData.appointments.filter(a => a.status === 'cancelled').length,
        upcoming: demoData.appointments.filter(a => new Date(a.appointment_date) > new Date()).length
      };

      // Revenue analytics (mock data)
      const revenueStats = {
        total_revenue: 150000,
        revenue_week: 15000,
        revenue_month: 45000,
        total_bills: 120
      };

      // Doctor performance
      const doctorStats = demoData.users
        .filter(user => user.role === 'doctor')
        .map(doctor => {
          const doctorAppointments = demoData.appointments.filter(apt => apt.doctor_id === doctor.id);
          const completedAppointments = doctorAppointments.filter(apt => apt.status === 'completed');
          return {
            first_name: doctor.first_name,
            last_name: doctor.last_name,
            total_appointments: doctorAppointments.length,
            completed_appointments: completedAppointments.length,
            completion_rate: doctorAppointments.length > 0 
              ? Math.round((completedAppointments.length / doctorAppointments.length) * 100) 
              : 0
          };
        });

      // Patient demographics (mock data)
      const demographics = [
        { age_group: '18-30', gender: 'male', count: 15 },
        { age_group: '18-30', gender: 'female', count: 20 },
        { age_group: '31-50', gender: 'male', count: 25 },
        { age_group: '31-50', gender: 'female', count: 30 },
        { age_group: '51-70', gender: 'male', count: 20 },
        { age_group: '51-70', gender: 'female', count: 25 },
        { age_group: '70+', gender: 'male', count: 10 },
        { age_group: '70+', gender: 'female', count: 15 }
      ];

      return res.json({
        success: true,
        data: {
          patients: patientStats,
          appointments: appointmentStats,
          revenue: revenueStats,
          doctorPerformance: doctorStats,
          demographics: demographics
        }
      });
    }

    // Real database queries
    // Get date range
    const dateFilter = startDate && endDate 
      ? `WHERE created_at BETWEEN '${startDate}' AND '${endDate}'`
      : `WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'`;

    // Patient statistics
    const patientStats = await db.query(`
      SELECT 
        COUNT(*) as total_patients,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_patients_week,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_patients_month
      FROM patients ${dateFilter}
    `);

    // Appointment statistics
    const appointmentStats = await db.query(`
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN appointment_date >= CURRENT_DATE THEN 1 END) as upcoming
      FROM appointments ${dateFilter}
    `);

    // Revenue analytics
    const revenueStats = await db.query(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN amount END), 0) as revenue_week,
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN amount END), 0) as revenue_month,
        COUNT(*) as total_bills
      FROM billing ${dateFilter}
    `);

    // Doctor performance
    const doctorStats = await db.query(`
      SELECT 
        u.first_name,
        u.last_name,
        COUNT(a.id) as total_appointments,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
        ROUND(
          COUNT(CASE WHEN a.status = 'completed' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(a.id), 0), 2
        ) as completion_rate
      FROM users u
      LEFT JOIN appointments a ON u.id = a.doctor_id ${dateFilter.replace('created_at', 'a.created_at')}
      WHERE u.role = 'doctor'
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY total_appointments DESC
      LIMIT 10
    `);

    // Patient demographics
    const demographics = await db.query(`
      SELECT 
        CASE 
          WHEN EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 18 THEN '0-17'
          WHEN EXTRACT(YEAR FROM AGE(u.date_of_birth)) BETWEEN 18 AND 30 THEN '18-30'
          WHEN EXTRACT(YEAR FROM AGE(u.date_of_birth)) BETWEEN 31 AND 50 THEN '31-50'
          WHEN EXTRACT(YEAR FROM AGE(u.date_of_birth)) BETWEEN 51 AND 70 THEN '51-70'
          ELSE '70+'
        END as age_group,
        u.gender,
        COUNT(*) as count
      FROM users u
      JOIN patients p ON u.id = p.user_id
      ${dateFilter.replace('created_at', 'u.created_at')}
      GROUP BY age_group, u.gender
      ORDER BY age_group, u.gender
    `);

    res.json({
      success: true,
      data: {
        patients: patientStats.rows[0],
        appointments: appointmentStats.rows[0],
        revenue: revenueStats.rows[0],
        doctorPerformance: doctorStats.rows,
        demographics: demographics.rows
      }
    });

  } catch (error) {
    logger.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error.message
    });
  }
});

// Patient Analytics
const getPatientAnalytics = catchAsync(async (req, res) => {
  const { startDate, endDate, groupBy = 'month' } = req.query;
  
  try {
    let dateFormat, interval;
    switch (groupBy) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        interval = '1 day';
        break;
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        interval = '1 week';
        break;
      case 'year':
        dateFormat = 'YYYY';
        interval = '1 year';
        break;
      default:
        dateFormat = 'YYYY-MM';
        interval = '1 month';
    }

    const dateFilter = startDate && endDate 
      ? `WHERE p.created_at BETWEEN '${startDate}' AND '${endDate}'`
      : `WHERE p.created_at >= CURRENT_DATE - INTERVAL '12 months'`;

    // Patient registration trends
    const registrationTrends = await db.query(`
      SELECT 
        TO_CHAR(p.created_at, '${dateFormat}') as period,
        COUNT(*) as new_patients
      FROM patients p
      ${dateFilter}
      GROUP BY TO_CHAR(p.created_at, '${dateFormat}')
      ORDER BY period
    `);

    // Patient visits by department
    const visitsByDepartment = await db.query(`
      SELECT 
        d.name as department,
        COUNT(a.id) as total_visits,
        COUNT(DISTINCT a.patient_id) as unique_patients
      FROM appointments a
      JOIN users u ON a.doctor_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      ${dateFilter.replace('p.created_at', 'a.created_at')}
      GROUP BY d.name
      ORDER BY total_visits DESC
    `);

    // Patient satisfaction scores
    const satisfactionScores = await db.query(`
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as total_ratings,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_ratings
      FROM patient_feedback
      ${dateFilter.replace('p.created_at', 'created_at')}
    `);

    res.json({
      success: true,
      data: {
        registrationTrends: registrationTrends.rows,
        visitsByDepartment: visitsByDepartment.rows,
        satisfactionScores: satisfactionScores.rows[0]
      }
    });

  } catch (error) {
    logger.error('Patient analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient analytics',
      error: error.message
    });
  }
});

// Financial Analytics
const getFinancialAnalytics = catchAsync(async (req, res) => {
  const { startDate, endDate, groupBy = 'month' } = req.query;
  
  try {
    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        break;
      case 'year':
        dateFormat = 'YYYY';
        break;
      default:
        dateFormat = 'YYYY-MM';
    }

    const dateFilter = startDate && endDate 
      ? `WHERE b.created_at BETWEEN '${startDate}' AND '${endDate}'`
      : `WHERE b.created_at >= CURRENT_DATE - INTERVAL '12 months'`;

    // Revenue trends
    const revenueTrends = await db.query(`
      SELECT 
        TO_CHAR(b.created_at, '${dateFormat}') as period,
        SUM(b.amount) as revenue,
        COUNT(*) as total_bills,
        AVG(b.amount) as average_bill_amount
      FROM billing b
      ${dateFilter}
      GROUP BY TO_CHAR(b.created_at, '${dateFormat}')
      ORDER BY period
    `);

    // Revenue by service type
    const revenueByService = await db.query(`
      SELECT 
        b.service_type,
        SUM(b.amount) as total_revenue,
        COUNT(*) as total_bills,
        AVG(b.amount) as average_amount
      FROM billing b
      ${dateFilter}
      GROUP BY b.service_type
      ORDER BY total_revenue DESC
    `);

    // Payment status analysis
    const paymentStatus = await db.query(`
      SELECT 
        b.payment_status,
        COUNT(*) as count,
        SUM(b.amount) as total_amount,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
      FROM billing b
      ${dateFilter}
      GROUP BY b.payment_status
      ORDER BY count DESC
    `);

    // Outstanding payments
    const outstandingPayments = await db.query(`
      SELECT 
        SUM(CASE WHEN b.payment_status = 'pending' THEN b.amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN b.payment_status = 'overdue' THEN b.amount ELSE 0 END) as overdue_amount,
        COUNT(CASE WHEN b.payment_status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN b.payment_status = 'overdue' THEN 1 END) as overdue_count
      FROM billing b
      ${dateFilter}
    `);

    res.json({
      success: true,
      data: {
        revenueTrends: revenueTrends.rows,
        revenueByService: revenueByService.rows,
        paymentStatus: paymentStatus.rows,
        outstandingPayments: outstandingPayments.rows[0]
      }
    });

  } catch (error) {
    logger.error('Financial analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial analytics',
      error: error.message
    });
  }
});

// Operational Analytics
const getOperationalAnalytics = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  try {
    const dateFilter = startDate && endDate 
      ? `WHERE a.appointment_date BETWEEN '${startDate}' AND '${endDate}'`
      : `WHERE a.appointment_date >= CURRENT_DATE - INTERVAL '30 days'`;

    // Appointment efficiency
    const appointmentEfficiency = await db.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (a.end_time - a.start_time))/60) as average_duration_minutes,
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) as no_show_count,
        ROUND(
          COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(*), 0), 2
        ) as no_show_rate
      FROM appointments a
      ${dateFilter}
    `);

    // Resource utilization
    const resourceUtilization = await db.query(`
      SELECT 
        r.name as resource_name,
        r.type as resource_type,
        COUNT(ar.id) as total_bookings,
        SUM(EXTRACT(EPOCH FROM (ar.end_time - ar.start_time))/3600) as total_hours_booked,
        ROUND(
          SUM(EXTRACT(EPOCH FROM (ar.end_time - ar.start_time))/3600) * 100.0 / 
          (EXTRACT(EPOCH FROM (CURRENT_DATE - (CURRENT_DATE - INTERVAL '30 days')))/3600 * 8), 2
        ) as utilization_percentage
      FROM resources r
      LEFT JOIN appointment_resources ar ON r.id = ar.resource_id
      ${dateFilter.replace('a.appointment_date', 'ar.start_time')}
      GROUP BY r.id, r.name, r.type
      ORDER BY utilization_percentage DESC
    `);

    // Staff workload
    const staffWorkload = await db.query(`
      SELECT 
        u.first_name,
        u.last_name,
        u.role,
        COUNT(a.id) as total_appointments,
        COUNT(CASE WHEN a.appointment_date >= CURRENT_DATE THEN 1 END) as upcoming_appointments,
        AVG(EXTRACT(EPOCH FROM (a.end_time - a.start_time))/60) as average_appointment_duration
      FROM users u
      LEFT JOIN appointments a ON u.id = a.doctor_id
      ${dateFilter.replace('a.appointment_date', 'a.appointment_date')}
      WHERE u.role IN ('doctor', 'nurse')
      GROUP BY u.id, u.first_name, u.last_name, u.role
      ORDER BY total_appointments DESC
    `);

    res.json({
      success: true,
      data: {
        appointmentEfficiency: appointmentEfficiency.rows[0],
        resourceUtilization: resourceUtilization.rows,
        staffWorkload: staffWorkload.rows
      }
    });

  } catch (error) {
    logger.error('Operational analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch operational analytics',
      error: error.message
    });
  }
});

// Generate Custom Report
const generateCustomReport = catchAsync(async (req, res) => {
  const { reportType, startDate, endDate, filters = {} } = req.body;
  
  try {
    let reportData = {};

    switch (reportType) {
      case 'patient_summary':
        reportData = await generatePatientSummaryReport(startDate, endDate, filters);
        break;
      case 'financial_summary':
        reportData = await generateFinancialSummaryReport(startDate, endDate, filters);
        break;
      case 'appointment_analysis':
        reportData = await generateAppointmentAnalysisReport(startDate, endDate, filters);
        break;
      case 'staff_performance':
        reportData = await generateStaffPerformanceReport(startDate, endDate, filters);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    logger.error('Custom report generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate custom report',
      error: error.message
    });
  }
});

// Helper functions for custom reports
async function generatePatientSummaryReport(startDate, endDate, filters) {
  const dateFilter = startDate && endDate 
    ? `WHERE p.created_at BETWEEN '${startDate}' AND '${endDate}'`
    : '';

  const patients = await db.query(`
    SELECT 
      p.patient_id,
      u.first_name,
      u.last_name,
      u.date_of_birth,
      u.gender,
      p.created_at as registration_date,
      COUNT(a.id) as total_appointments,
      COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments
    FROM patients p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN appointments a ON p.id = a.patient_id
    ${dateFilter}
    GROUP BY p.id, p.patient_id, u.first_name, u.last_name, u.date_of_birth, u.gender, p.created_at
    ORDER BY p.created_at DESC
  `);

  return { patients: patients.rows };
}

async function generateFinancialSummaryReport(startDate, endDate, filters) {
  const dateFilter = startDate && endDate 
    ? `WHERE b.created_at BETWEEN '${startDate}' AND '${endDate}'`
    : '';

  const summary = await db.query(`
    SELECT 
      SUM(b.amount) as total_revenue,
      COUNT(*) as total_bills,
      AVG(b.amount) as average_bill_amount,
      SUM(CASE WHEN b.payment_status = 'paid' THEN b.amount ELSE 0 END) as paid_amount,
      SUM(CASE WHEN b.payment_status = 'pending' THEN b.amount ELSE 0 END) as pending_amount,
      SUM(CASE WHEN b.payment_status = 'overdue' THEN b.amount ELSE 0 END) as overdue_amount
    FROM billing b
    ${dateFilter}
  `);

  return { summary: summary.rows[0] };
}

async function generateAppointmentAnalysisReport(startDate, endDate, filters) {
  const dateFilter = startDate && endDate 
    ? `WHERE a.appointment_date BETWEEN '${startDate}' AND '${endDate}'`
    : '';

  const analysis = await db.query(`
    SELECT 
      COUNT(*) as total_appointments,
      COUNT(CASE WHEN a.status = 'scheduled' THEN 1 END) as scheduled,
      COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled,
      COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) as no_show,
      AVG(EXTRACT(EPOCH FROM (a.end_time - a.start_time))/60) as average_duration_minutes
    FROM appointments a
    ${dateFilter}
  `);

  return { analysis: analysis.rows[0] };
}

async function generateStaffPerformanceReport(startDate, endDate, filters) {
  const dateFilter = startDate && endDate 
    ? `WHERE a.appointment_date BETWEEN '${startDate}' AND '${endDate}'`
    : '';

  const performance = await db.query(`
    SELECT 
      u.first_name,
      u.last_name,
      u.role,
      COUNT(a.id) as total_appointments,
      COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
      ROUND(
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) * 100.0 / 
        NULLIF(COUNT(a.id), 0), 2
      ) as completion_rate,
      AVG(EXTRACT(EPOCH FROM (a.end_time - a.start_time))/60) as average_duration_minutes
    FROM users u
    LEFT JOIN appointments a ON u.id = a.doctor_id
    ${dateFilter}
    WHERE u.role IN ('doctor', 'nurse')
    GROUP BY u.id, u.first_name, u.last_name, u.role
    ORDER BY completion_rate DESC
  `);

  return { performance: performance.rows };
}

module.exports = {
  getDashboardAnalytics,
  getPatientAnalytics,
  getFinancialAnalytics,
  getOperationalAnalytics,
  generateCustomReport
};
