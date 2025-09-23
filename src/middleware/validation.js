const { body, param, query, validationResult } = require('express-validator');


const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};


const commonValidations = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email must be less than 100 characters'),
    
  password: body('password')
    .isLength({ min: 5, max: 128 })
    .withMessage('Password must be between 5 and 128 characters'),
    
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, apostrophes, and hyphens'),
    
  teamCode: body('teamCode')
    .optional()
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage('Team code must be between 4 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Team code can only contain uppercase letters and numbers'),
    
  amount: body('amount')
    .isFloat({ min: 0.01, max: 10000 })
    .withMessage('Amount must be between $0.01 and $10,000')
    .toFloat(),
    
  id: param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
    
  role: body('role')
    .optional()
    .isIn(['STUDENT', 'COACH', 'STAFF', 'ADMIN'])
    .withMessage('Invalid role specified'),
    
  teamId: body('teamId')
    .optional()
    .isUUID()
    .withMessage('Invalid team ID format'),
    
  size: body('size')
    .optional()
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
    .withMessage('Invalid size specified'),
    
  quantity: body('quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100')
    .toInt(),
    
  paymentMethod: body('paymentMethod')
    .isIn(['cash', 'card', 'venmo', 'other'])
    .withMessage('Invalid payment method')
};


const validationRules = {
  
  register: [
    commonValidations.name,
    commonValidations.email,
    commonValidations.password,
    commonValidations.role,
    commonValidations.teamId
  ],
  
  registerWithTeam: [
    commonValidations.name,
    commonValidations.email,
    commonValidations.password,
    commonValidations.teamCode
  ],
  
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 1, max: 128 })
      .withMessage('Password must be provided')
  ],
  
  
  sellProduct: [
    commonValidations.id,
    commonValidations.size,
    commonValidations.quantity,
    commonValidations.paymentMethod,
    commonValidations.amount
  ],
  
  
  createDonation: [
    commonValidations.amount,
    commonValidations.teamId
  ],
  
  
  updateUser: [
    commonValidations.id,
    commonValidations.role,
    commonValidations.teamId
  ],
  
  createTeam: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Team name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z0-9\s'-]+$/)
      .withMessage('Team name contains invalid characters'),
    commonValidations.teamId.optional()
  ]
};


const sanitizeInput = (req, res, next) => {
  
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };
  
  
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    }
    return obj;
  };
  
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  
  next();
};

module.exports = {
  validationRules,
  handleValidationErrors,
  sanitizeInput
};
