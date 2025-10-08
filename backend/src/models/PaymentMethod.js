const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  // User who owns this payment method
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // CCBill payment token
  token: {
    type: String,
    required: true,
    unique: true
  },

  // Card details (last 4 digits only - PCI compliant)
  last4: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}$/.test(v);
      },
      message: 'Last 4 digits must be exactly 4 numeric characters'
    }
  },

  // Card type (Visa, MasterCard, Discover, etc.)
  cardType: {
    type: String,
    required: true,
    enum: ['Visa', 'MasterCard', 'Discover', 'American Express', 'Other']
  },

  // Card expiry
  expiryMonth: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },

  expiryYear: {
    type: Number,
    required: true,
    validate: {
      validator: function(v) {
        return v >= new Date().getFullYear();
      },
      message: 'Card has expired'
    }
  },

  // Default payment method flag
  isDefault: {
    type: Boolean,
    default: false,
    index: true
  },

  // Billing address (optional)
  billingAddress: {
    firstName: String,
    lastName: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },

  // Token metadata
  ccbillCustomerId: String,

  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // Last used timestamp
  lastUsedAt: Date,

  // Verification status
  isVerified: {
    type: Boolean,
    default: false
  },

  verifiedAt: Date
}, {
  timestamps: true
});

// Indexes
paymentMethodSchema.index({ user: 1, isDefault: 1 });
paymentMethodSchema.index({ user: 1, isActive: 1 });

// Virtual for masked card number
paymentMethodSchema.virtual('maskedNumber').get(function() {
  return `**** **** **** ${this.last4}`;
});

// Virtual for expiry display
paymentMethodSchema.virtual('expiryDisplay').get(function() {
  const month = String(this.expiryMonth).padStart(2, '0');
  const year = String(this.expiryYear).slice(-2);
  return `${month}/${year}`;
});

// Virtual to check if card is expired
paymentMethodSchema.virtual('isExpired').get(function() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (this.expiryYear < currentYear) return true;
  if (this.expiryYear === currentYear && this.expiryMonth < currentMonth) return true;
  return false;
});

// Method to set as default payment method
paymentMethodSchema.methods.setAsDefault = async function() {
  // Unset all other default payment methods for this user
  await this.model('PaymentMethod').updateMany(
    { user: this.user, _id: { $ne: this._id } },
    { isDefault: false }
  );

  this.isDefault = true;
  return this.save();
};

// Method to deactivate payment method
paymentMethodSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Method to update last used timestamp
paymentMethodSchema.methods.markUsed = function() {
  this.lastUsedAt = new Date();
  return this.save();
};

// Static method to get user's active payment methods
paymentMethodSchema.statics.getUserMethods = function(userId) {
  return this.find({ user: userId, isActive: true })
    .sort({ isDefault: -1, createdAt: -1 });
};

// Static method to get default payment method
paymentMethodSchema.statics.getDefaultMethod = function(userId) {
  return this.findOne({ user: userId, isDefault: true, isActive: true });
};

// Pre-save middleware to ensure only one default per user
paymentMethodSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.model('PaymentMethod').updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Pre-save middleware to check expiry
paymentMethodSchema.pre('save', function(next) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (this.expiryYear < currentYear ||
      (this.expiryYear === currentYear && this.expiryMonth < currentMonth)) {
    this.isActive = false;
  }

  next();
});

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
