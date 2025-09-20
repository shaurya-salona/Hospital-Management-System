const express = require('express');
const router = express.Router();
const { authenticateToken, staffOnly } = require('../middlewares/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateBill = [
  body('patientId').isUUID().withMessage('Valid patient ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('description').isString().withMessage('Description is required'),
  body('billType').isIn(['consultation', 'procedure', 'medication', 'lab_test', 'other']).withMessage('Valid bill type is required'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date is required')
];

const validatePayment = [
  body('billId').isUUID().withMessage('Valid bill ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('paymentMethod').isIn(['cash', 'card', 'insurance', 'bank_transfer', 'check']).withMessage('Valid payment method is required'),
  body('paymentDate').optional().isISO8601().withMessage('Valid payment date is required')
];

const validateId = [
  param('id').isUUID().withMessage('Valid bill ID is required')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'paid', 'overdue', 'cancelled']).withMessage('Valid status is required'),
  query('billType').optional().isIn(['consultation', 'procedure', 'medication', 'lab_test', 'other']).withMessage('Valid bill type is required')
];

// All routes require authentication and staff access
router.use(authenticateToken);
router.use(staffOnly);

// GET /api/billing - Get all bills with pagination and filters
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, billType, patientId } = req.query;
    const offset = (page - 1) * limit;
    const db = require('../config/database-manager');

    // Build query with filters
    let query = `
      SELECT b.*,
             p.patient_id, pu.first_name as patient_first_name, pu.last_name as patient_last_name
      FROM billing b
      JOIN patients p ON b.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND b.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (billType) {
      paramCount++;
      query += ` AND b.bill_type = $${paramCount}`;
      queryParams.push(billType);
    }

    if (patientId) {
      paramCount++;
      query += ` AND b.patient_id = $${paramCount}`;
      queryParams.push(patientId);
    }

    // Add pagination
    query += ` ORDER BY b.created_at DESC`;

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    queryParams.push(parseInt(limit));

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    queryParams.push(offset);

    // Get count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM billing b
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (status) {
      countParamCount++;
      countQuery += ` AND b.status = $${countParamCount}`;
      countParams.push(status);
    }

    if (billType) {
      countParamCount++;
      countQuery += ` AND b.bill_type = $${countParamCount}`;
      countParams.push(billType);
    }

    if (patientId) {
      countParamCount++;
      countQuery += ` AND b.patient_id = $${countParamCount}`;
      countParams.push(patientId);
    }

    const [billsResult, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query(countQuery, countParams)
    ]);

    const bills = billsResult.rows.map(bill => ({
      id: bill.id,
      patient_id: bill.patient_id,
      patient_name: `${bill.patient_first_name} ${bill.patient_last_name}`,
      amount: parseFloat(bill.amount),
      description: bill.description,
      bill_type: bill.bill_type,
      status: bill.status,
      due_date: bill.due_date,
      created_at: bill.created_at
    }));

    const totalCount = parseInt(countResult.rows[0]?.total || 0);

    res.json({
      success: true,
      data: bills,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
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
    const db = require('../config/database-manager');

    const query = `
      SELECT b.*,
             p.patient_id, pu.first_name as patient_first_name, pu.last_name as patient_last_name
      FROM billing b
      JOIN patients p ON b.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      WHERE b.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    const bill = result.rows[0];
    const billData = {
      id: bill.id,
      patient_id: bill.patient_id,
      patient_name: `${bill.patient_first_name} ${bill.patient_last_name}`,
      amount: parseFloat(bill.amount),
      description: bill.description,
      bill_type: bill.bill_type,
      status: bill.status,
      due_date: bill.due_date,
      created_at: bill.created_at
    };

    res.json({
      success: true,
      data: billData
    });
  } catch (error) {
    console.error('Error fetching bill:', error);
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
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      patientId,
      amount,
      description,
      billType,
      dueDate
    } = req.body;

    const db = require('../config/database-manager');

    // Check if patient exists
    const patientCheck = await db.query('SELECT id FROM patients WHERE id = $1', [patientId]);
    if (patientCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Create bill
    const billQuery = `
      INSERT INTO billing (
        patient_id, amount, description, bill_type, status, due_date
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const billValues = [
      patientId,
      parseFloat(amount),
      description,
      billType,
      'pending',
      dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    ];

    const billResult = await db.query(billQuery, billValues);
    const newBill = billResult.rows[0];

    res.status(201).json({
      success: true,
      data: newBill,
      message: 'Bill created successfully'
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating bill',
      error: error.message
    });
  }
});

// PUT /api/billing/:id - Update bill
router.put('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, billType, status, dueDate } = req.body;
    const db = require('../config/database-manager');

    // Check if bill exists
    const billCheck = await db.query('SELECT * FROM billing WHERE id = $1', [id]);
    if (billCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (amount !== undefined) {
      paramCount++;
      updates.push(`amount = $${paramCount}`);
      values.push(parseFloat(amount));
    }
    if (description) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      values.push(description);
    }
    if (billType) {
      paramCount++;
      updates.push(`bill_type = $${paramCount}`);
      values.push(billType);
    }
    if (status) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      values.push(status);
    }
    if (dueDate) {
      paramCount++;
      updates.push(`due_date = $${paramCount}`);
      values.push(dueDate);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    paramCount++;
    values.push(id);

    const query = `
      UPDATE billing
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Bill updated successfully'
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating bill',
      error: error.message
    });
  }
});

// POST /api/billing/:id/payment - Record payment for bill
router.post('/:id/payment', validateId, validatePayment, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, paymentDate, notes } = req.body;
    const db = require('../config/database-manager');

    // Check if bill exists
    const billCheck = await db.query('SELECT * FROM billing WHERE id = $1', [id]);
    if (billCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    const bill = billCheck.rows[0];

    // Record payment
    const paymentQuery = `
      INSERT INTO payments (bill_id, amount, payment_method, payment_date, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const paymentValues = [
      id,
      parseFloat(amount),
      paymentMethod,
      paymentDate || new Date(),
      notes
    ];

    const paymentResult = await db.query(paymentQuery, paymentValues);

    // Calculate total payments for this bill
    const totalPaymentsResult = await db.query(
      'SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE bill_id = $1',
      [id]
    );

    const totalPaid = parseFloat(totalPaymentsResult.rows[0].total_paid);
    const billAmount = parseFloat(bill.amount);

    // Update bill status based on payment
    let newStatus = 'pending';
    if (totalPaid >= billAmount) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partial';
    }

    await db.query(
      'UPDATE billing SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStatus, id]
    );

    res.status(201).json({
      success: true,
      data: {
        payment: paymentResult.rows[0],
        bill_status: newStatus,
        total_paid: totalPaid,
        remaining_amount: billAmount - totalPaid
      },
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording payment',
      error: error.message
    });
  }
});

// GET /api/billing/:id/payments - Get payments for a bill
router.get('/:id/payments', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database-manager');

    const query = `
      SELECT p.*, b.amount as bill_amount
      FROM payments p
      JOIN billing b ON p.bill_id = b.id
      WHERE p.bill_id = $1
      ORDER BY p.payment_date DESC
    `;

    const result = await db.query(query, [id]);

    const payments = result.rows.map(payment => ({
      id: payment.id,
      amount: parseFloat(payment.amount),
      payment_method: payment.payment_method,
      payment_date: payment.payment_date,
      notes: payment.notes,
      created_at: payment.created_at
    }));

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
});

// DELETE /api/billing/:id - Cancel bill
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database-manager');

    // Check if bill exists
    const billCheck = await db.query('SELECT * FROM billing WHERE id = $1', [id]);
    if (billCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Cancel bill (soft delete by changing status)
    await db.query(
      'UPDATE billing SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancelled', id]
    );

    res.json({
      success: true,
      message: 'Bill cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling bill',
      error: error.message
    });
  }
});

module.exports = router;
