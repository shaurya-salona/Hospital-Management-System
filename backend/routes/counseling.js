const express = require('express');
const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    // Mock counseling statistics - replace with actual database queries
    const stats = {
      total_sessions: 45,
      sessions_today: 8,
      patients_counseled: 35,
      follow_up_required: 12,
      average_duration: 18,
      satisfaction_score: 4.2
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching counseling statistics',
      error: error.message
    });
  }
});

// GET /api/counseling/sessions - Get all counseling sessions
router.get('/sessions', async (req, res) => {
  try {
    // Mock counseling sessions data - replace with actual database queries
    const sessions = [
      {
        id: '1',
        patient_id: 'P001',
        patient_name: 'John Doe',
        counselor_id: 'C001',
        counselor_name: 'Dr. Smith',
        session_date: '2024-01-15',
        duration: 45,
        type: 'Individual',
        status: 'Completed',
        notes: 'Patient showed good progress in managing anxiety'
      },
      {
        id: '2',
        patient_id: 'P002',
        patient_name: 'Jane Smith',
        counselor_id: 'C002',
        counselor_name: 'Dr. Johnson',
        session_date: '2024-01-15',
        duration: 30,
        type: 'Group',
        status: 'Scheduled',
        notes: 'Group therapy session for depression management'
      }
    ];

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching counseling sessions',
      error: error.message
    });
  }
});

// POST /api/counseling/sessions - Create new counseling session
router.post('/sessions', async (req, res) => {
  try {
    const { patient_id, counselor_id, session_date, duration, type, notes } = req.body;

    // Mock session creation - replace with actual database insertion
    const newSession = {
      id: Date.now().toString(),
      patient_id,
      counselor_id,
      session_date,
      duration,
      type,
      status: 'Scheduled',
      notes,
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Counseling session created successfully',
      data: newSession
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating counseling session',
      error: error.message
    });
  }
});

// PUT /api/counseling/sessions/:id - Update counseling session
router.put('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, counselor_id, session_date, duration, type, status, notes } = req.body;

    // Mock session update - replace with actual database update
    const updatedSession = {
      id,
      patient_id,
      counselor_id,
      session_date,
      duration,
      type,
      status,
      notes,
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Counseling session updated successfully',
      data: updatedSession
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating counseling session',
      error: error.message
    });
  }
});

// DELETE /api/counseling/sessions/:id - Delete counseling session
router.delete('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Mock session deletion - replace with actual database deletion
    res.json({
      success: true,
      message: 'Counseling session deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting counseling session',
      error: error.message
    });
  }
});

// GET /api/counseling/patients/:id/sessions - Get sessions for specific patient
router.get('/patients/:id/sessions', async (req, res) => {
  try {
    const { id } = req.params;

    // Mock patient sessions - replace with actual database queries
    const patientSessions = [
      {
        id: '1',
        patient_id: id,
        counselor_id: 'C001',
        counselor_name: 'Dr. Smith',
        session_date: '2024-01-15',
        duration: 45,
        type: 'Individual',
        status: 'Completed',
        notes: 'Patient showed good progress in managing anxiety'
      }
    ];

    res.json({
      success: true,
      data: patientSessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient counseling sessions',
      error: error.message
    });
  }
});

// GET /api/counseling/counselors - Get all counselors
router.get('/counselors', async (req, res) => {
  try {
    // Mock counselors data - replace with actual database queries
    const counselors = [
      {
        id: 'C001',
        name: 'Dr. Smith',
        specialization: 'Anxiety and Depression',
        experience_years: 8,
        patients_count: 25,
        rating: 4.5
      },
      {
        id: 'C002',
        name: 'Dr. Johnson',
        specialization: 'Group Therapy',
        experience_years: 12,
        patients_count: 40,
        rating: 4.8
      }
    ];

    res.json({
      success: true,
      data: counselors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching counselors',
      error: error.message
    });
  }
});

// GET /api/counseling/reports - Get counseling reports
router.get('/reports', async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Mock counseling reports - replace with actual database queries
    const reports = {
      period,
      total_sessions: 45,
      completed_sessions: 42,
      cancelled_sessions: 3,
      average_duration: 18,
      patient_satisfaction: 4.2,
      counselor_performance: [
        {
          counselor_id: 'C001',
          counselor_name: 'Dr. Smith',
          sessions_count: 20,
          average_rating: 4.5
        },
        {
          counselor_id: 'C002',
          counselor_name: 'Dr. Johnson',
          sessions_count: 25,
          average_rating: 4.8
        }
      ]
    };

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating counseling reports',
      error: error.message
    });
  }
});

module.exports = router;
