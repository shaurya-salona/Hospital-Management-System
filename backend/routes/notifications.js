const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateNotification = [
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['info', 'success', 'warning', 'error']).withMessage('Invalid notification type'),
  body('userId').optional().isUUID().withMessage('Valid user ID is required'),
  body('role').optional().isIn(['admin', 'doctor', 'receptionist', 'nurse', 'pharmacist']).withMessage('Invalid role')
];

const validateId = [
  param('id').isUUID().withMessage('Valid notification ID is required')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['info', 'success', 'warning', 'error']).withMessage('Invalid type filter'),
  query('isRead').optional().isBoolean().withMessage('isRead must be a boolean')
];

// All routes require authentication
router.use(authenticateToken);

// GET /api/notifications - Get user's notifications
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, isRead } = req.query;
    const userId = req.user.id; // From JWT token

    // Mock data for now - replace with actual database queries
    const mockNotifications = [
      {
        id: '1',
        user_id: userId,
        message: 'New appointment scheduled for tomorrow',
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        user_id: userId,
        message: 'Patient check-in completed',
        type: 'success',
        is_read: true,
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        user_id: userId,
        message: 'Low stock alert: Paracetamol',
        type: 'warning',
        is_read: false,
        created_at: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: mockNotifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockNotifications.length,
        pages: Math.ceil(mockNotifications.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// GET /api/notifications/:id - Get notification by ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data - replace with actual database query
    const notification = {
      id,
      user_id: req.user.id,
      message: 'New appointment scheduled for tomorrow',
      type: 'info',
      is_read: false,
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notification',
      error: error.message
    });
  }
});

// POST /api/notifications - Create new notification
router.post('/', validateNotification, async (req, res) => {
  try {
    const notificationData = req.body;
    
    // Mock creation - replace with actual database insert
    const newNotification = {
      id: Date.now().toString(),
      ...notificationData,
      is_read: false,
      created_at: new Date().toISOString()
    };

    // Emit WebSocket notification if userId or role is specified
    if (global.io) {
      if (notificationData.userId) {
        global.io.to(`user-${notificationData.userId}`).emit('notification', {
          message: notificationData.message,
          type: notificationData.type
        });
      } else if (notificationData.role) {
        global.io.to(`role-${notificationData.role}`).emit('notification', {
          message: notificationData.message,
          type: notificationData.type
        });
      }
    }

    res.status(201).json({
      success: true,
      data: newNotification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock update - replace with actual database update
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Mock update - replace with actual database update
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock deletion - replace with actual database delete
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
});

module.exports = router;
