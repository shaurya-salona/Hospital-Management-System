const express = require('express');
const router = express.Router();
const { authenticateToken, staffOnly } = require('../middlewares/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validatePharmacyBill = [
  body('patientId').isUUID().withMessage('Valid patient ID is required'),
  body('medications').notEmpty().withMessage('Medications are required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('paymentMethod').isIn(['cash', 'card', 'insurance', 'check']).withMessage('Invalid payment method'),
  body('prescriptionId').optional().isUUID().withMessage('Valid prescription ID is required')
];

const validateId = [
  param('id').isUUID().withMessage('Valid bill ID is required')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['paid', 'pending', 'insurance']).withMessage('Invalid status filter'),
  query('paymentMethod').optional().isIn(['cash', 'card', 'insurance', 'check']).withMessage('Invalid payment method filter')
];

// All routes require authentication and staff access
router.use(authenticateToken);
router.use(staffOnly);

// GET /api/pharmacy/billing - Get pharmacy billing records
router.get('/billing', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentMethod } = req.query;

    // Mock data for now - replace with actual database queries
    const mockPharmacyBills = [
      {
        id: '1',
        bill_number: 'PHARM-001',
        patient_id: '1',
        patient_name: 'John Doe',
        medications: 'Lisinopril 10mg x 30, Metformin 500mg x 60',
        amount: 45.50,
        payment_method: 'insurance',
        status: 'paid',
        prescription_id: '1',
        created_at: '2024-01-15T10:00:00Z',
        paid_at: '2024-01-15T10:05:00Z'
      },
      {
        id: '2',
        bill_number: 'PHARM-002',
        patient_id: '2',
        patient_name: 'Jane Smith',
        medications: 'Atorvastatin 20mg x 30',
        amount: 25.00,
        payment_method: 'cash',
        status: 'paid',
        prescription_id: '2',
        created_at: '2024-01-15T11:00:00Z',
        paid_at: '2024-01-15T11:02:00Z'
      },
      {
        id: '3',
        bill_number: 'PHARM-003',
        patient_id: '3',
        patient_name: 'Mike Johnson',
        medications: 'Warfarin 5mg x 90',
        amount: 35.75,
        payment_method: 'card',
        status: 'pending',
        prescription_id: '3',
        created_at: '2024-01-15T12:00:00Z',
        paid_at: null
      }
    ];

    res.json({
      success: true,
      data: mockPharmacyBills,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockPharmacyBills.length,
        pages: Math.ceil(mockPharmacyBills.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pharmacy billing records',
      error: error.message
    });
  }
});

// GET /api/pharmacy/billing/:id - Get pharmacy bill by ID
router.get('/billing/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data - replace with actual database query
    const bill = {
      id,
      bill_number: 'PHARM-001',
      patient_id: '1',
      patient_name: 'John Doe',
      medications: 'Lisinopril 10mg x 30, Metformin 500mg x 60',
      amount: 45.50,
      payment_method: 'insurance',
      status: 'paid',
      prescription_id: '1',
      created_at: '2024-01-15T10:00:00Z',
      paid_at: '2024-01-15T10:05:00Z'
    };

    res.json({
      success: true,
      data: bill
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pharmacy bill',
      error: error.message
    });
  }
});

// POST /api/pharmacy/billing - Create new pharmacy bill
router.post('/billing', validatePharmacyBill, async (req, res) => {
  try {
    const billData = req.body;
    
    // Mock creation - replace with actual database insert
    const newBill = {
      id: Date.now().toString(),
      bill_number: `PHARM-${Date.now()}`,
      ...billData,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: newBill,
      message: 'Pharmacy bill created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating pharmacy bill',
      error: error.message
    });
  }
});

// POST /api/pharmacy/billing/:id/pay - Process pharmacy payment
router.post('/billing/:id/pay', validateId, [
  body('paymentMethod').isIn(['cash', 'card', 'insurance', 'check']).withMessage('Invalid payment method'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('transactionId').optional().isString()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, amount, transactionId } = req.body;
    
    // Mock payment processing - replace with actual payment processing logic
    const paymentResult = {
      id,
      payment_method: paymentMethod,
      amount,
      transaction_id: transactionId,
      status: 'paid',
      paid_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: paymentResult,
      message: 'Pharmacy payment processed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing pharmacy payment',
      error: error.message
    });
  }
});

// GET /api/pharmacy/prescriptions - Get pharmacy prescriptions
router.get('/prescriptions', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Mock data for now - replace with actual database queries
    const mockPrescriptions = [
      {
        id: '1',
        patient_id: '1',
        patient_name: 'John Doe',
        medication: 'Lisinopril 10mg',
        dosage: '10mg once daily',
        quantity: 30,
        status: 'dispensed',
        doctor_name: 'Dr. Smith',
        prescribed_date: '2024-01-15T09:00:00Z',
        dispensed_date: '2024-01-15T10:00:00Z',
        pharmacist_name: 'Sarah Davis'
      },
      {
        id: '2',
        patient_id: '2',
        patient_name: 'Jane Smith',
        medication: 'Metformin 500mg',
        dosage: '500mg twice daily',
        quantity: 60,
        status: 'pending',
        doctor_name: 'Dr. Johnson',
        prescribed_date: '2024-01-15T11:00:00Z',
        dispensed_date: null,
        pharmacist_name: null
      }
    ];

    res.json({
      success: true,
      data: mockPrescriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockPrescriptions.length,
        pages: Math.ceil(mockPrescriptions.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pharmacy prescriptions',
      error: error.message
    });
  }
});

// PUT /api/pharmacy/prescriptions/:id/dispense - Dispense prescription
router.put('/prescriptions/:id/dispense', validateId, [
  body('quantityDispensed').isInt({ min: 1 }).withMessage('Quantity dispensed must be a positive integer'),
  body('instructions').optional().isString(),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityDispensed, instructions, notes } = req.body;
    
    // Mock dispensing - replace with actual database update
    const dispensedPrescription = {
      id,
      quantity_dispensed: quantityDispensed,
      instructions,
      notes,
      status: 'dispensed',
      dispensed_date: new Date().toISOString(),
      pharmacist_name: req.user.username || 'Current Pharmacist'
    };

    res.json({
      success: true,
      data: dispensedPrescription,
      message: 'Prescription dispensed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error dispensing prescription',
      error: error.message
    });
  }
});

// GET /api/pharmacy/inventory - Get pharmacy inventory
router.get('/inventory', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status } = req.query;

    // Mock data for now - replace with actual database queries
    const mockInventory = [
      {
        id: '1',
        name: 'Lisinopril 10mg',
        category: 'medication',
        quantity: 150,
        unit_price: 1.50,
        min_stock: 20,
        expiry_date: '2025-12-31',
        status: 'in-stock',
        supplier: 'MedSupply Co.'
      },
      {
        id: '2',
        name: 'Metformin 500mg',
        category: 'medication',
        quantity: 8,
        unit_price: 0.75,
        min_stock: 50,
        expiry_date: '2024-06-30',
        status: 'low-stock',
        supplier: 'PharmaCorp'
      },
      {
        id: '3',
        name: 'Warfarin 5mg',
        category: 'medication',
        quantity: 0,
        unit_price: 2.25,
        min_stock: 10,
        expiry_date: '2024-03-15',
        status: 'out-of-stock',
        supplier: 'MedSupply Co.'
      }
    ];

    res.json({
      success: true,
      data: mockInventory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockInventory.length,
        pages: Math.ceil(mockInventory.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pharmacy inventory',
      error: error.message
    });
  }
});

module.exports = router;
