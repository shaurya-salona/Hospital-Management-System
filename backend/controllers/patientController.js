const Patient = require('../models/Patient');
const { validationResult } = require('express-validator');

class PatientController {
  // Get all patients with pagination and filters
  async getPatients(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        bloodType,
        gender,
        isActive = true
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        bloodType,
        gender,
        isActive: isActive === 'true'
      };

      const patients = await Patient.findAll(options);
      
      // Get total count for pagination
      const totalQuery = `
        SELECT COUNT(*) as total FROM patients 
        WHERE is_active = $1
        ${search ? 'AND (first_name ILIKE $2 OR last_name ILIKE $2 OR patient_id ILIKE $2 OR email ILIKE $2)' : ''}
        ${bloodType ? `AND blood_type = $${search ? '3' : '2'}` : ''}
        ${gender ? `AND gender = $${search ? (bloodType ? '4' : '3') : (bloodType ? '3' : '2')}` : ''}
      `;

      const totalValues = [isActive];
      if (search) totalValues.push(`%${search}%`);
      if (bloodType) totalValues.push(bloodType);
      if (gender) totalValues.push(gender);

      // Use centralized database manager
      const db = require('../config/database-manager');
      const totalResult = await db.query(totalQuery, totalValues);
      const total = parseInt(totalResult.rows[0].total);

      res.json({
        success: true,
        data: patients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        message: 'Patients retrieved successfully'
      });
    } catch (error) {
      console.error('Get patients error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get patient by ID
  async getPatientById(req, res) {
    try {
      const { id } = req.params;
      const patient = await Patient.findById(id);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      res.json({
        success: true,
        data: patient,
        message: 'Patient retrieved successfully'
      });
    } catch (error) {
      console.error('Get patient by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create new patient
  async createPatient(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const patientData = req.body;
      const patient = await Patient.create(patientData);

      res.status(201).json({
        success: true,
        data: patient,
        message: 'Patient created successfully'
      });
    } catch (error) {
      console.error('Create patient error:', error);
      
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({
          success: false,
          message: 'Patient with this email or patient ID already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update patient
  async updatePatient(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const patient = await Patient.findById(id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      const updatedPatient = await patient.update(updateData);

      res.json({
        success: true,
        data: updatedPatient,
        message: 'Patient updated successfully'
      });
    } catch (error) {
      console.error('Update patient error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete patient (soft delete)
  async deletePatient(req, res) {
    try {
      const { id } = req.params;

      const patient = await Patient.findById(id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      const deletedPatient = await patient.delete();

      res.json({
        success: true,
        data: deletedPatient,
        message: 'Patient deleted successfully'
      });
    } catch (error) {
      console.error('Delete patient error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get patient statistics
  async getPatientStatistics(req, res) {
    try {
      const statistics = await Patient.getStatistics();

      res.json({
        success: true,
        data: {
          overview: {
            totalPatients: parseInt(statistics.totalPatients[0].count),
            newPatientsToday: parseInt(statistics.newPatientsToday[0].count),
            activePatients: parseInt(statistics.totalPatients[0].count)
          },
          bloodTypeDistribution: statistics.bloodTypeDistribution,
          genderDistribution: statistics.genderDistribution,
          ageGroupDistribution: statistics.ageGroupDistribution
        },
        message: 'Patient statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Get patient statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get patient's appointments
  async getPatientAppointments(req, res) {
    try {
      const { id } = req.params;
      const patient = await Patient.findById(id);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      const appointments = await patient.getAppointments();

      res.json({
        success: true,
        data: appointments,
        message: 'Patient appointments retrieved successfully'
      });
    } catch (error) {
      console.error('Get patient appointments error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get patient's medical records
  async getPatientMedicalRecords(req, res) {
    try {
      const { id } = req.params;
      const patient = await Patient.findById(id);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      const medicalRecords = await patient.getMedicalRecords();

      res.json({
        success: true,
        data: medicalRecords,
        message: 'Patient medical records retrieved successfully'
      });
    } catch (error) {
      console.error('Get patient medical records error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get patient's prescriptions
  async getPatientPrescriptions(req, res) {
    try {
      const { id } = req.params;
      const patient = await Patient.findById(id);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      const prescriptions = await patient.getPrescriptions();

      res.json({
        success: true,
        data: prescriptions,
        message: 'Patient prescriptions retrieved successfully'
      });
    } catch (error) {
      console.error('Get patient prescriptions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get patient's billing records
  async getPatientBilling(req, res) {
    try {
      const { id } = req.params;
      const patient = await Patient.findById(id);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      const billingRecords = await patient.getBillingRecords();

      res.json({
        success: true,
        data: billingRecords,
        message: 'Patient billing records retrieved successfully'
      });
    } catch (error) {
      console.error('Get patient billing error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Search patients
  async searchPatients(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const patients = await Patient.findAll({
        search: q,
        limit: 20,
        page: 1
      });

      res.json({
        success: true,
        data: patients,
        message: 'Patient search completed successfully'
      });
    } catch (error) {
      console.error('Search patients error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new PatientController();
