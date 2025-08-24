const { body, validationResult, param, query } = require('express-validator');

// ==========================================
// VALIDATION MIDDLEWARE
// ==========================================

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
    .isString()
    .isLength({ max: 200 })
    .withMessage('Message must be under 200 characters'),
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
// USER VALIDATIONS
// ==========================================

exports.validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('username')
    .optional()
    .isAlphanumeric()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 alphanumeric characters'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Valid date of birth required')
    .custom((value) => {
      const age = new Date().getFullYear() - new Date(value).getFullYear();
      if (age < 18) throw new Error('Must be 18 or older');
      return true;
    }),
  body('agreeToTerms')
    .isBoolean()
    .equals('true')
    .withMessage('Must agree to terms and conditions'),
  handleValidationErrors
];

exports.validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .notEmpty()
    .withMessage('Password required'),
  handleValidationErrors
];

// ==========================================
// PROFILE VALIDATIONS
// ==========================================

exports.validateProfileUpdate = [
  body('displayName')
    .optional()
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be 2-50 characters'),
  body('bio')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Bio must be under 500 characters'),
  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object'),
  body('location.city')
    .optional()
    .isString()
    .withMessage('City must be a string'),
  body('location.state')
    .optional()
    .isString()
    .withMessage('State must be a string'),
  body('location.country')
    .optional()
    .isString()
    .withMessage('Country must be a string'),
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
    .isArray()
    .withMessage('Categories must be an array'),
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
    .notEmpty()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be 3-100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be under 500 characters'),
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
  handleValidationErrors
];

// ==========================================
// MESSAGE VALIDATIONS
// ==========================================

exports.validateMessage = [
  body('content')
    .notEmpty()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be 1-1000 characters'),
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
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be 2-100 characters'),
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
    .notEmpty()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be 10-500 characters'),
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
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be 10-500 characters'),
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