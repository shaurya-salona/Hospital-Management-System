const express = require('express');
const router = express.Router();
const { authenticateToken, staffOnly } = require('../middlewares/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateInventory = [
  body('name').notEmpty().withMessage('Item name is required'),
  body('category').isIn(['medication', 'equipment', 'supplies']).withMessage('Invalid category'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  body('minStock').optional().isInt({ min: 0 }).withMessage('Minimum stock must be a non-negative integer'),
  body('expiryDate').optional().isISO8601().withMessage('Valid expiry date is required'),
  body('supplier').optional().isString(),
  body('description').optional().isString()
];

const validateId = [
  param('id').isUUID().withMessage('Valid inventory item ID is required')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['medication', 'equipment', 'supplies']).withMessage('Invalid category filter'),
  query('status').optional().isIn(['in-stock', 'low-stock', 'out-of-stock', 'expired']).withMessage('Invalid status filter')
];

// All routes require authentication and staff access
router.use(authenticateToken);
router.use(staffOnly);

// GET /api/inventory - Get all inventory items with pagination and filters
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status } = req.query;
    const offset = (page - 1) * limit;

    // Mock data for now - replace with actual database queries
    const mockInventory = [
      {
        id: '1',
        name: 'Paracetamol 500mg',
        category: 'medication',
        quantity: 100,
        unit_price: 2.50,
        min_stock: 20,
        expiry_date: '2025-12-31',
        supplier: 'MedSupply Co.',
        description: 'Pain relief medication',
        status: 'in-stock',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Blood Pressure Monitor',
        category: 'equipment',
        quantity: 5,
        unit_price: 150.00,
        min_stock: 2,
        expiry_date: null,
        supplier: 'MedEquip Inc.',
        description: 'Digital blood pressure monitoring device',
        status: 'in-stock',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Surgical Gloves',
        category: 'supplies',
        quantity: 8,
        unit_price: 0.50,
        min_stock: 50,
        expiry_date: '2024-06-30',
        supplier: 'MedSupply Co.',
        description: 'Sterile surgical gloves',
        status: 'low-stock',
        created_at: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Insulin Vial',
        category: 'medication',
        quantity: 0,
        unit_price: 25.00,
        min_stock: 10,
        expiry_date: '2024-03-15',
        supplier: 'PharmaCorp',
        description: 'Insulin for diabetes management',
        status: 'out-of-stock',
        created_at: new Date().toISOString()
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
      message: 'Error fetching inventory',
      error: error.message
    });
  }
});

// GET /api/inventory/:id - Get inventory item by ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data - replace with actual database query
    const item = {
      id,
      name: 'Paracetamol 500mg',
      category: 'medication',
      quantity: 100,
      unit_price: 2.50,
      min_stock: 20,
      expiry_date: '2025-12-31',
      supplier: 'MedSupply Co.',
      description: 'Pain relief medication',
      status: 'in-stock',
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory item',
      error: error.message
    });
  }
});

// POST /api/inventory - Create new inventory item
router.post('/', validateInventory, async (req, res) => {
  try {
    const itemData = req.body;
    
    // Mock creation - replace with actual database insert
    const newItem = {
      id: Date.now().toString(),
      ...itemData,
      status: itemData.quantity === 0 ? 'out-of-stock' : 
              itemData.quantity < (itemData.minStock || 0) ? 'low-stock' : 'in-stock',
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: newItem,
      message: 'Inventory item created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating inventory item',
      error: error.message
    });
  }
});

// PUT /api/inventory/:id - Update inventory item
router.put('/:id', validateId, validateInventory, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Mock update - replace with actual database update
    const updatedItem = {
      id,
      ...updateData,
      status: updateData.quantity === 0 ? 'out-of-stock' : 
              updateData.quantity < (updateData.minStock || 0) ? 'low-stock' : 'in-stock',
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: updatedItem,
      message: 'Inventory item updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating inventory item',
      error: error.message
    });
  }
});

// POST /api/inventory/:id/adjust - Adjust inventory quantity
router.post('/:id/adjust', validateId, [
  body('quantity').isInt().withMessage('Quantity must be an integer'),
  body('reason').notEmpty().withMessage('Reason for adjustment is required')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason } = req.body;
    
    // Mock adjustment - replace with actual database update
    const adjustment = {
      id,
      quantity,
      reason,
      adjusted_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: adjustment,
      message: 'Inventory quantity adjusted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adjusting inventory quantity',
      error: error.message
    });
  }
});

// DELETE /api/inventory/:id - Delete inventory item
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock deletion - replace with actual database update (soft delete)
    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting inventory item',
      error: error.message
    });
  }
});

module.exports = router;
