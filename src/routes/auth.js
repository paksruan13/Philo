const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticationToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiting');
const { validationRules, handleValidationErrors } = require('../middleware/validation');

// Apply strict rate limiting to auth endpoints
router.use(authLimiter);

router.post('/register', 
  validationRules.register, 
  handleValidationErrors, 
  authController.register
);

router.post('/login', 
  validationRules.login, 
  handleValidationErrors, 
  authController.login
);

router.post('/change-password', authenticationToken, authController.changePassword);
router.get('/me', authenticationToken, authController.getMe);
router.get('/current', authenticationToken, authController.getCurrentUser);

router.post('/register-team', 
  validationRules.registerWithTeam, 
  handleValidationErrors, 
  authController.registerWithTeam
);

router.post('/join-team', authenticationToken, authController.joinTeam);

module.exports = router;