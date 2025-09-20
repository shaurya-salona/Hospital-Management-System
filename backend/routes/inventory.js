const express = require('express');
const router = express.Router();
const { authenticateToken, staffOnly } = require('../middlewares/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateInventoryItem = [
  body('name').isString().withMessage('Item name is required'),
  body('category').isIn(['medication', 'equipment', 'supplies', 'consumables', 'other']).withMessage('Valid category is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  body('supplier').optional().isString().withMessage('Supplier must be a string'),
  body('expiryDate').optional().isISO8601().withMessage('Valid expiry date is required'),
  body('minimumStock').optional().isInt({ min: 0 }).withMessage('Minimum stock must be a non-negative integer')
];

const validateStockUpdate = [
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('operation').isIn(['add', 'subtract', 'set']).withMessage('Operation must be add, subtract, or set'),
  body('reason').optional().isString().withMessage('Reason must be a string')
];

const validateId = [
  param('id').isUUID().withMessage('Valid inventory item ID is required')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['medication', 'equipment', 'supplies', 'consumables', 'other']).withMessage('Valid category is required'),
  query('lowStock').optional().isBoolean().withMessage('Low stock filter must be boolean')
];

// All routes require authentication and staff access
router.use(authenticateToken);
router.use(staffOnly);

// GET /api/inventory - Get all inventory items with pagination and filters
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, lowStock } = req.query;
    const offset = (page - 1) * limit;
    const db = require('../config/database-manager');

    // Build query with filters
    let query = `
      SELECT * FROM inventory
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      queryParams.push(category);
    }

    if (lowStock === 'true') {
      query += ` AND quantity <= minimum_stock`;
    }

    // Add pagination
    query += ` ORDER BY name ASC`;

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    queryParams.push(parseInt(limit));

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    queryParams.push(offset);

    // Get count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM inventory
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (category) {
      countParamCount++;
      countQuery += ` AND category = $${countParamCount}`;
      countParams.push(category);
    }

    if (lowStock === 'true') {
      countQuery += ` AND quantity <= minimum_stock`;
    }

    const [itemsResult, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query(countQuery, countParams)
    ]);

    const items = itemsResult.rows.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit_price: parseFloat(item.unit_price || 0),
      supplier: item.supplier,
      expiry_date: item.expiry_date,
      minimum_stock: item.minimum_stock,
      is_low_stock: item.quantity <= item.minimum_stock,
      created_at: item.created_at
    }));

    const totalCount = parseInt(countResult.rows[0]?.total || 0);

    res.json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory items',
      error: error.message
    });
  }
});

// GET /api/inventory/:id - Get inventory item by ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database-manager');

    const query = 'SELECT * FROM inventory WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const item = result.rows[0];
    const itemData = {
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit_price: parseFloat(item.unit_price || 0),
      supplier: item.supplier,
      expiry_date: item.expiry_date,
      minimum_stock: item.minimum_stock,
      is_low_stock: item.quantity <= item.minimum_stock,
      created_at: item.created_at
    };

    res.json({
      success: true,
      data: itemData
    });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory item',
      error: error.message
    });
  }
});

// POST /api/inventory - Create new inventory item
router.post('/', validateInventoryItem, async (req, res) => {
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
      name,
      category,
      quantity,
      unitPrice,
      supplier,
      expiryDate,
      minimumStock = 0
    } = req.body;

    const db = require('../config/database-manager');

    // Check if item with same name already exists
    const existingItem = await db.query('SELECT id FROM inventory WHERE name = $1', [name]);
    if (existingItem.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Item with this name already exists'
      });
    }

    // Create inventory item
    const itemQuery = `
      INSERT INTO inventory (
        name, category, quantity, unit_price, supplier, expiry_date, minimum_stock
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const itemValues = [
      name,
      category,
      parseInt(quantity),
      unitPrice ? parseFloat(unitPrice) : null,
      supplier,
      expiryDate,
      parseInt(minimumStock)
    ];

    const itemResult = await db.query(itemQuery, itemValues);
    const newItem = itemResult.rows[0];

    res.status(201).json({
      success: true,
      data: newItem,
      message: 'Inventory item created successfully'
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating inventory item',
      error: error.message
    });
  }
});

// PUT /api/inventory/:id - Update inventory item
router.put('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, unitPrice, supplier, expiryDate, minimumStock } = req.body;
    const db = require('../config/database-manager');

    // Check if item exists
    const itemCheck = await db.query('SELECT * FROM inventory WHERE id = $1', [id]);
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (name) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      values.push(name);
    }
    if (category) {
      paramCount++;
      updates.push(`category = $${paramCount}`);
      values.push(category);
    }
    if (unitPrice !== undefined) {
      paramCount++;
      updates.push(`unit_price = $${paramCount}`);
      values.push(unitPrice ? parseFloat(unitPrice) : null);
    }
    if (supplier !== undefined) {
      paramCount++;
      updates.push(`supplier = $${paramCount}`);
      values.push(supplier);
    }
    if (expiryDate !== undefined) {
      paramCount++;
      updates.push(`expiry_date = $${paramCount}`);
      values.push(expiryDate);
    }
    if (minimumStock !== undefined) {
      paramCount++;
      updates.push(`minimum_stock = $${paramCount}`);
      values.push(parseInt(minimumStock));
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
      UPDATE inventory
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Inventory item updated successfully'
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating inventory item',
      error: error.message
    });
  }
});

// PUT /api/inventory/:id/stock - Update stock quantity
router.put('/:id/stock', validateId, validateStockUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation, reason } = req.body;
    const db = require('../config/database-manager');

    // Check if item exists
    const itemCheck = await db.query('SELECT * FROM inventory WHERE id = $1', [id]);
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const currentItem = itemCheck.rows[0];
    let newQuantity;

    switch (operation) {
      case 'add':
        newQuantity = currentItem.quantity + parseInt(quantity);
        break;
      case 'subtract':
        newQuantity = Math.max(0, currentItem.quantity - parseInt(quantity));
        break;
      case 'set':
        newQuantity = parseInt(quantity);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid operation'
        });
    }

    // Update quantity
    const updateQuery = `
      UPDATE inventory
      SET quantity = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(updateQuery, [newQuantity, id]);

    // Log stock movement
    const logQuery = `
      INSERT INTO stock_movements (inventory_id, operation, quantity, reason, created_by)
      VALUES ($1, $2, $3, $4, $5)
    `;

    await db.query(logQuery, [id, operation, parseInt(quantity), reason, req.user.id]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Stock updated successfully'
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stock',
      error: error.message
    });
  }
});

// GET /api/inventory/:id/movements - Get stock movement history
router.get('/:id/movements', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database-manager');

    const query = `
      SELECT sm.*, u.first_name, u.last_name
      FROM stock_movements sm
      LEFT JOIN users u ON sm.created_by = u.id
      WHERE sm.inventory_id = $1
      ORDER BY sm.created_at DESC
    `;

    const result = await db.query(query, [id]);

    const movements = result.rows.map(movement => ({
      id: movement.id,
      operation: movement.operation,
      quantity: movement.quantity,
      reason: movement.reason,
      created_by: movement.created_by,
      created_by_name: movement.first_name && movement.last_name
        ? `${movement.first_name} ${movement.last_name}`
        : 'System',
      created_at: movement.created_at
    }));

    res.json({
      success: true,
      data: movements
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock movements',
      error: error.message
    });
  }
});

// DELETE /api/inventory/:id - Delete inventory item
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database-manager');

    // Check if item exists
    const itemCheck = await db.query('SELECT * FROM inventory WHERE id = $1', [id]);
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Delete item
    await db.query('DELETE FROM inventory WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting inventory item',
      error: error.message
    });
  }
});

// GET /api/inventory/reports/low-stock - Get low stock report
router.get('/reports/low-stock', async (req, res) => {
  try {
    const db = require('../config/database-manager');

    const query = `
      SELECT * FROM inventory
      WHERE quantity <= minimum_stock
      ORDER BY (quantity - minimum_stock) ASC, name ASC
    `;

    const result = await db.query(query);
    const lowStockItems = result.rows.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      minimum_stock: item.minimum_stock,
      shortage: item.minimum_stock - item.quantity,
      unit_price: parseFloat(item.unit_price || 0)
    }));

    res.json({
      success: true,
      data: lowStockItems,
      count: lowStockItems.length
    });
  } catch (error) {
    console.error('Error fetching low stock report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock report',
      error: error.message
    });
  }
});

module.exports = router;
