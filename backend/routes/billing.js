const express = require('express');
const router = express.Router();
const { authenticateToken, staffOnly } = require('../middlewares/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateBill = [
  body('patientId').isUUID().withMessage('Valid patient ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('description').notEmpty().withMessage('Description is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('serviceType').optional().isIn(['consultation', 'procedure', 'medication', 'lab', 'other']).withMessage('Invalid service type'),
  body('paymentMethod').optional().isIn(['cash', 'card', 'insurance', 'check']).withMessage('Invalid payment method')
];

const validateId = [
  param('id').isUUID().withMessage('Valid bill ID is required')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'paid', 'overdue', 'cancelled']).withMessage('Invalid status filter'),
  query('patientId').optional().isUUID().withMessage('Valid patient ID filter is required')
];

// All routes require authentication and staff access
router.use(authenticateToken);
router.use(staffOnly);

// GET /api/billing - Get all bills with pagination and filters
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, patientId } = req.query;
    const offset = (page - 1) * limit;

    // Mock data for now - replace with actual database queries
    const mockBills = [
      {
        id: '1',
        bill_number: 'BILL-001',
        patient_id: '1',
        patient_name: 'John Doe',
        amount: 150.00,
        description: 'General Consultation',
        service_type: 'consultation',
        status: 'pending',
        payment_method: 'cash',
        due_date: '2024-02-15',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        bill_number: 'BILL-002',
        patient_id: '2',
        patient_name: 'Jane Smith',
        amount: 250.00,
        description: 'Lab Tests',
        service_type: 'lab',
        status: 'paid',
        payment_method: 'insurance',
        due_date: '2024-02-10',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        bill_number: 'BILL-003',
        patient_id: '3',
        patient_name: 'Mike Johnson',
        amount: 500.00,
        description: 'Surgical Procedure',
        service_type: 'procedure',
        status: 'overdue',
        payment_method: 'card',
        due_date: '2024-01-15',
        created_at: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: mockBills,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockBills.length,
        pages: Math.ceil(mockBills.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bills',
      error: error.message
    });
  }
});

// GET /api/billing/:id - Get bill by ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data - replace with actual database query
    const bill = {
      id,
      bill_number: 'BILL-001',
      patient_id: '1',
      patient_name: 'John Doe',
      amount: 150.00,
      description: 'General Consultation',
      service_type: 'consultation',
      status: 'pending',
      payment_method: 'cash',
      due_date: '2024-02-15',
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: bill
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bill',
      error: error.message
    });
  }
});

// POST /api/billing - Create new bill
router.post('/', validateBill, async (req, res) => {
  try {
    const billData = req.body;
    
    // Mock creation - replace with actual database insert
    const newBill = {
      id: Date.now().toString(),
      bill_number: `BILL-${Date.now()}`,
      ...billData,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: newBill,
      message: 'Bill created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating bill',
      error: error.message
    });
  }
});

// PUT /api/billing/:id - Update bill
router.put('/:id', validateId, validateBill, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Mock update - replace with actual database update
    const updatedBill = {
      id,
      ...updateData,
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: updatedBill,
      message: 'Bill updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating bill',
      error: error.message
    });
  }
});

// POST /api/billing/:id/pay - Process payment
router.post('/:id/pay', validateId, [
  body('paymentMethod').isIn(['cash', 'card', 'insurance', 'check']).withMessage('Invalid payment method'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, amount } = req.body;
    
    // Mock payment processing - replace with actual payment processing logic
    const paymentResult = {
      id,
      payment_method: paymentMethod,
      amount,
      status: 'paid',
      paid_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: paymentResult,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message
    });
  }
});

// DELETE /api/billing/:id - Cancel bill
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock cancellation - replace with actual database update
    res.json({
      success: true,
      message: 'Bill cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling bill',
      error: error.message
    });
  }
});

module.exports = router;
