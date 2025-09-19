const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middlewares/auth');
const { catchAsync } = require('../middlewares/errorHandler');

/**
 * @swagger
 * tags:
 *   name: Dashboards
 *   description: Dashboard access and data endpoints
 */

// Admin Dashboard - Admin only
router.get('/admin', 
  authenticateToken, 
  authorize('admin'),
  catchAsync(async (req, res) => {
    res.json({
      success: true,
      message: 'Admin dashboard access granted',
      data: {
        dashboard: 'admin',
        user: req.user,
        permissions: ['user_management', 'system_config', 'analytics', 'audit_logs']
      }
    });
  })
);

// Doctor Dashboard - Doctor and Admin
router.get('/doctor', 
  authenticateToken, 
  authorize('doctor', 'admin'),
  catchAsync(async (req, res) => {
    res.json({
      success: true,
      message: 'Doctor dashboard access granted',
      data: {
        dashboard: 'doctor',
        user: req.user,
        permissions: ['patient_records', 'prescriptions', 'appointments', 'medical_reports']
      }
    });
  })
);

// Nurse Dashboard - Nurse and Admin
router.get('/nurse', 
  authenticateToken, 
  authorize('nurse', 'admin'),
  catchAsync(async (req, res) => {
    res.json({
      success: true,
      message: 'Nurse dashboard access granted',
      data: {
        dashboard: 'nurse',
        user: req.user,
        permissions: ['patient_care', 'vital_monitoring', 'medication_admin', 'care_plans']
      }
    });
  })
);

// Receptionist Dashboard - Receptionist and Admin
router.get('/receptionist', 
  authenticateToken, 
  authorize('receptionist', 'admin'),
  catchAsync(async (req, res) => {
    res.json({
      success: true,
      message: 'Receptionist dashboard access granted',
      data: {
        dashboard: 'receptionist',
        user: req.user,
        permissions: ['patient_registration', 'appointment_scheduling', 'billing', 'communication']
      }
    });
  })
);

// Pharmacist Dashboard - Pharmacist and Admin
router.get('/pharmacist', 
  authenticateToken, 
  authorize('pharmacist', 'admin'),
  catchAsync(async (req, res) => {
    res.json({
      success: true,
      message: 'Pharmacist dashboard access granted',
      data: {
        dashboard: 'pharmacist',
        user: req.user,
        permissions: ['prescription_processing', 'inventory_management', 'drug_interactions', 'patient_counseling']
      }
    });
  })
);

// Patient Dashboard - Patient only
router.get('/patient', 
  authenticateToken, 
  authorize('patient'),
  catchAsync(async (req, res) => {
    res.json({
      success: true,
      message: 'Patient dashboard access granted',
      data: {
        dashboard: 'patient',
        user: req.user,
        permissions: ['view_records', 'schedule_appointments', 'view_prescriptions', 'billing_info']
      }
    });
  })
);

// Get user's dashboard based on role
router.get('/my-dashboard', 
  authenticateToken,
  catchAsync(async (req, res) => {
    const { role } = req.user;
    
    const dashboardRoutes = {
      'admin': '/admin',
      'doctor': '/doctor',
      'nurse': '/nurse',
      'receptionist': '/receptionist',
      'pharmacist': '/pharmacist',
      'patient': '/patient'
    };
    
    const dashboardRoute = dashboardRoutes[role];
    
    if (!dashboardRoute) {
      return res.status(403).json({
        success: false,
        message: 'No dashboard available for your role'
      });
    }
    
    res.json({
      success: true,
      message: `Dashboard route for ${role}`,
      data: {
        role,
        dashboardRoute,
        redirectTo: `${dashboardRoute}`
      }
    });
  })
);

module.exports = router;

