const { body, validationResult, param, query } = require('express-validator');
const validator = require('validator');

// ==========================================
// VALIDATION MIDDLEWARE
// ==========================================

// XSS sanitization function
const sanitizeInput = (value) => {
  if (!value) return value;
  // Remove any HTML tags and scripts
  return validator.escape(value.trim());
};

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// ==========================================
// AUTHENTICATION VALIDATIONS
// ==========================================

// Member Registration - matches your actual fields
exports.validateMemberRegistration = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required')
    .isLength({ max: 255 })
    .withMessage('Email too long'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscore, and hyphen')
    .customSanitizer(sanitizeInput),
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Display name must be under 50 characters')
    .customSanitizer(sanitizeInput),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Invalid phone number'),
  body('birthDate')
    .isISO8601()
    .withMessage('Valid date required')
    .custom((value) => {
      const birth = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 18) throw new Error('Must be at least 18 years old');
      if (age > 120) throw new Error('Invalid birth date');
      return true;
    }),
  body('agreeToTerms')
    .isBoolean()
    .custom(value => value === true)
    .withMessage('Must agree to terms and conditions'),
  handleValidationErrors
];

// Creator Registration - matches your actual fields
exports.validateCreatorRegistration = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required')
    .isLength({ max: 255 })
    .withMessage('Email too long'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscore, and hyphen')
    .customSanitizer(sanitizeInput),
  body('displayName')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Display name must be 3-50 characters')
    .customSanitizer(sanitizeInput),
  body('birthDate')
    .isISO8601()
    .withMessage('Valid date required')
    .custom((value) => {
      const birth = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 18) throw new Error('Must be at least 18 years old');
      if (age > 120) throw new Error('Invalid birth date');
      return true;
    }),
  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .customSanitizer(sanitizeInput),
  body('agreeToTerms')
    .isBoolean()
    .custom(value => value === true)
    .withMessage('Must agree to terms and conditions'),
  body('agreeToContentPolicy')
    .isBoolean()
    .custom(value => value === true)
    .withMessage('Must agree to content policy'),
  body('over18Confirmation')
    .isBoolean()
    .custom(value => value === true)
    .withMessage('Must confirm age requirement'),
  body('taxInfoConsent')
    .optional()
    .isBoolean(),
  handleValidationErrors
];

// Login validation
exports.validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .notEmpty()
    .withMessage('Password required')
    .isLength({ max: 128 })
    .withMessage('Invalid password'),
  handleValidationErrors
];

// ==========================================
// PAYMENT VALIDATIONS
// ==========================================

exports.validatePayment = [
  body('amount')
    .optional()
    .isFloat({ min: 0.50, max: 10000 })
    .withMessage('Amount must be between $0.50 and $10,000'),
  body('currency')
    .optional()
    .isIn(['usd', 'eur', 'gbp', 'cad', 'aud'])
    .withMessage('Invalid currency'),
  body('paymentMethodId')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Valid payment method ID required'),
  body('contentId')
    .optional()
    .isMongoId()
    .withMessage('Valid content ID required'),
  body('creatorId')
    .optional()
    .isMongoId()
    .withMessage('Valid creator ID required'),
  body('memberId')
    .optional()
    .isMongoId()
    .withMessage('Valid member ID required'),
  handleValidationErrors
];

exports.validateTip = [
  body('amount')
    .isFloat({ min: 1, max: 500 })
    .withMessage('Tip amount must be between $1 and $500'),
  body('creatorId')
    .isMongoId()
    .withMessage('Valid creator ID required'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Message must be under 200 characters')
    .customSanitizer(sanitizeInput),
  handleValidationErrors
];

exports.validateCredits = [
  body('packageId')
    .optional()
    .isMongoId()
    .withMessage('Valid package ID required'),
  body('credits')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Credits must be between 1 and 10,000'),
  handleValidationErrors
];

// ==========================================
// PROFILE VALIDATIONS
// ==========================================

exports.validateProfileUpdate = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be 2-50 characters')
    .customSanitizer(sanitizeInput),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be under 500 characters')
    .customSanitizer(sanitizeInput),
  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object'),
  body('location.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .customSanitizer(sanitizeInput),
  body('location.state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .customSanitizer(sanitizeInput),
  body('location.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .customSanitizer(sanitizeInput),
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object'),
  handleValidationErrors
];

exports.validateCreator = [
  body('contentPrice')
    .optional()
    .isFloat({ min: 0.99, max: 999.99 })
    .withMessage('Content price must be between $0.99 and $999.99'),
  body('messagePrice')
    .optional()
    .isFloat({ min: 0.99, max: 99.99 })
    .withMessage('Message price must be between $0.99 and $99.99'),
  body('categories')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 categories allowed'),
  body('categories.*')
    .optional()
    .isIn(['lingerie', 'bikini', 'artistic', 'fitness', 'cosplay', 'alternative', 'glamour'])
    .withMessage('Invalid category'),
  handleValidationErrors
];

// ==========================================
// CONTENT VALIDATIONS
// ==========================================

exports.validateContent = [
  body('title')
    .trim()
    .notEmpty()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be 3-100 characters')
    .customSanitizer(sanitizeInput),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be under 500 characters')
    .customSanitizer(sanitizeInput),
  body('price')
    .optional()
    .isFloat({ min: 0, max: 999.99 })
    .withMessage('Price must be between $0 and $999.99'),
  body('contentType')
    .isIn(['photo', 'video', 'audio', 'bundle'])
    .withMessage('Invalid content type'),
  body('visibility')
    .optional()
    .isIn(['public', 'subscribers', 'premium'])
    .withMessage('Invalid visibility setting'),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .customSanitizer(sanitizeInput),
  handleValidationErrors
];

// ==========================================
// MESSAGE VALIDATIONS
// ==========================================

exports.validateMessage = [
  body('content')
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be 1-1000 characters')
    .customSanitizer(sanitizeInput),
  body('recipientId')
    .isMongoId()
    .withMessage('Valid recipient ID required'),
  body('attachments')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 attachments allowed'),
  handleValidationErrors
];

// ==========================================
// SEARCH/FILTER VALIDATIONS
// ==========================================

exports.validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be 2-100 characters')
    .customSanitizer(sanitizeInput),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'popular', 'price_low', 'price_high'])
    .withMessage('Invalid sort option'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be positive'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be positive'),
  handleValidationErrors
];

exports.validateFilters = [
  body('orientation')
    .optional()
    .isIn(['straight', 'gay', 'lesbian', 'bisexual', 'all'])
    .withMessage('Invalid orientation'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'non-binary', 'trans', 'all'])
    .withMessage('Invalid gender'),
  body('ageRange')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('Age range must be [min, max]'),
  body('ageRange.*')
    .optional()
    .isInt({ min: 18, max: 100 })
    .withMessage('Age must be between 18 and 100'),
  body('distance')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Distance must be between 1 and 500 miles'),
  body('bodyType')
    .optional()
    .isIn(['slim', 'athletic', 'average', 'curvy', 'bbw', 'all'])
    .withMessage('Invalid body type'),
  body('ethnicity')
    .optional()
    .isIn(['white', 'black', 'asian', 'hispanic', 'middle-eastern', 'mixed', 'other', 'all'])
    .withMessage('Invalid ethnicity'),
  handleValidationErrors
];

// ==========================================
// ADMIN VALIDATIONS
// ==========================================

exports.validateAdminAction = [
  body('reason')
    .trim()
    .notEmpty()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be 10-500 characters')
    .customSanitizer(sanitizeInput),
  body('duration')
    .optional()
    .isIn(['1h', '24h', '3d', '7d', '30d', 'permanent'])
    .withMessage('Invalid duration'),
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  handleValidationErrors
];

exports.validateReport = [
  body('targetId')
    .isMongoId()
    .withMessage('Valid target ID required'),
  body('targetType')
    .isIn(['user', 'content', 'message', 'comment'])
    .withMessage('Invalid target type'),
  body('reason')
    .isIn(['spam', 'harassment', 'inappropriate', 'scam', 'underage', 'copyright', 'other'])
    .withMessage('Invalid report reason'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be 10-500 characters')
    .customSanitizer(sanitizeInput),
  handleValidationErrors
];

// ==========================================
// ID VALIDATION HELPERS
// ==========================================

exports.validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
  handleValidationErrors
];

exports.validateMultipleIds = (fieldName) => [
  body(fieldName)
    .isArray()
    .withMessage(`${fieldName} must be an array`),
  body(`${fieldName}.*`)
    .isMongoId()
    .withMessage(`Invalid ID in ${fieldName}`),
  handleValidationErrors
];

// ==========================================
// CUSTOM VALIDATORS
// ==========================================

exports.validatePhoneNumber = [
  body('phoneNumber')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Invalid phone number'),
  handleValidationErrors
];

exports.validateCoordinates = [
  body('coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be [longitude, latitude]'),
  body('coordinates.0')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  body('coordinates.1')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  handleValidationErrors
];

exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// ==========================================
// WEBHOOK VALIDATIONS
// ==========================================

exports.validateWebhook = (req, res, next) => {
  // Webhook signature validation would go here
  // This is provider-specific (Stripe, PayPal, etc.)
  next();
};

module.exports = exports;