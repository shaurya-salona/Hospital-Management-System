const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticateToken, staffOnly } = require('../middlewares/auth');
const { ValidationRules, handleValidationErrors } = require('../middlewares/validation');
const { catchAsync } = require('../middlewares/errorHandler');
const { body, param, query } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: Patient management operations
 */

// All validation rules are now centralized in ValidationRules

// All routes require authentication and staff access
router.use(authenticateToken);
router.use(staffOnly);

// GET /api/patients - Get all patients with pagination and filters
router.get('/', 
  ValidationRules.query.pagination,
  handleValidationErrors,
  catchAsync(patientController.getPatients)
);

// GET /api/patients/stats - Get patient statistics
router.get('/stats', 
  catchAsync(patientController.getPatientStatistics)
);

// GET /api/patients/search - Search patients
router.get('/search', 
  ValidationRules.query.search,
  handleValidationErrors,
  catchAsync(patientController.searchPatients)
);

// GET /api/patients/:id - Get patient by ID
router.get('/:id', 
  ValidationRules.params.id,
  handleValidationErrors,
  catchAsync(patientController.getPatientById)
);

// GET /api/patients/:id/appointments - Get patient's appointments
router.get('/:id/appointments', 
  ValidationRules.params.id,
  handleValidationErrors,
  catchAsync(patientController.getPatientAppointments)
);

// GET /api/patients/:id/medical-records - Get patient's medical records
router.get('/:id/medical-records', 
  ValidationRules.params.id,
  handleValidationErrors,
  catchAsync(patientController.getPatientMedicalRecords)
);

// GET /api/patients/:id/prescriptions - Get patient's prescriptions
router.get('/:id/prescriptions', 
  ValidationRules.params.id,
  handleValidationErrors,
  catchAsync(patientController.getPatientPrescriptions)
);

// GET /api/patients/:id/billing - Get patient's billing records
router.get('/:id/billing', 
  ValidationRules.params.id,
  handleValidationErrors,
  catchAsync(patientController.getPatientBilling)
);

// POST /api/patients - Create new patient
router.post('/', 
  ValidationRules.patient.create,
  handleValidationErrors,
  catchAsync(patientController.createPatient)
);

// PUT /api/patients/:id - Update patient
router.put('/:id', 
  ValidationRules.params.id,
  ValidationRules.patient.update,
  handleValidationErrors,
  catchAsync(patientController.updatePatient)
);

// DELETE /api/patients/:id - Delete patient (soft delete)
router.delete('/:id', 
  ValidationRules.params.id,
  handleValidationErrors,
  catchAsync(patientController.deletePatient)
);

module.exports = router;
