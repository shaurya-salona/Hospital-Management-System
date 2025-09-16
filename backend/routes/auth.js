const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');
const { ValidationRules, handleValidationErrors } = require('../middlewares/validation');
const { catchAsync } = require('../middlewares/errorHandler');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

// Public routes
router.post('/login', 
  ValidationRules.auth.login,
  handleValidationErrors,
  catchAsync(authController.login)
);

router.post('/refresh', 
  catchAsync(authController.refreshToken)
);

// Protected routes
router.get('/profile', 
  authenticateToken, 
  catchAsync(authController.getProfile)
);

router.post('/logout', 
  authenticateToken, 
  catchAsync(authController.logout)
);

module.exports = router;
