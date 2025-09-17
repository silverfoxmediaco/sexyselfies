import api from './api.config';

/**
 * Payment Service
 * Handles all payment-related API calls including CCBill integration,
 * credits, subscriptions, and transaction management
 */
class PaymentService {
  // ==========================================
  // PAYMENT PROCESSING
  // ==========================================

  /**
   * Initialize payment session (CCBill)
   */
  async initializePayment(data) {
    try {
      const response = await api.post('/payment/initialize', {
        payment_type: data.payment_type, // 'subscription', 'credits', 'tip', 'content', 'message'
        amount: data.amount,
        currency: data.currency || 'USD',
        item_id: data.item_id,
        item_type: data.item_type,
        creator_id: data.creator_id,
        return_url:
          data.return_url || `${window.location.origin}/payment/success`,
        cancel_url:
          data.cancel_url || `${window.location.origin}/payment/cancel`,
        webhook_url: data.webhook_url,
        device_fingerprint: await this.getDeviceFingerprint(),
      });

      // Store payment session for tracking
      if (response.data?.session_id) {
        sessionStorage.setItem('payment_session', response.data.session_id);
      }

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Process payment with CCBill
   */
  async processPayment(data) {
    try {
      const response = await api.post('/payment/process', {
        session_id:
          data.session_id || sessionStorage.getItem('payment_session'),
        payment_method: data.payment_method, // 'credit_card', 'crypto', 'paypal'
        card_details: data.card_details
          ? {
              number: data.card_details.number,
              exp_month: data.card_details.exp_month,
              exp_year: data.card_details.exp_year,
              cvv: data.card_details.cvv,
              holder_name: data.card_details.holder_name,
            }
          : undefined,
        billing_info: {
          first_name: data.billing_info.first_name,
          last_name: data.billing_info.last_name,
          email: data.billing_info.email,
          phone: data.billing_info.phone,
          address: data.billing_info.address,
          city: data.billing_info.city,
          state: data.billing_info.state,
          zip: data.billing_info.zip,
          country: data.billing_info.country,
        },
        save_payment_method: data.save_payment_method || false,
        device_fingerprint: await this.getDeviceFingerprint(),
      });

      // Clear session after successful payment
      if (response.success) {
        sessionStorage.removeItem('payment_session');
      }

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify payment completion
   */
  async verifyPayment(transactionId) {
    try {
      const response = await api.get(`/payment/verify/${transactionId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle payment callback from CCBill
   */
  async handlePaymentCallback(params) {
    try {
      const response = await api.post('/payment/callback', {
        ...params,
        session_id: sessionStorage.getItem('payment_session'),
      });

      if (response.success) {
        sessionStorage.removeItem('payment_session');
      }

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // CREDIT SYSTEM
  // ==========================================

  /**
   * Get credit packages
   */
  async getCreditPackages() {
    try {
      const response = await api.get('/payment/credits/packages');

      // Add bonus calculations for UI display
      if (response.data?.packages) {
        response.data.packages = response.data.packages.map(pkg => ({
          ...pkg,
          bonus_percentage: pkg.bonus_credits
            ? Math.round((pkg.bonus_credits / pkg.base_credits) * 100)
            : 0,
          per_credit_cost: (
            pkg.price /
            (pkg.base_credits + (pkg.bonus_credits || 0))
          ).toFixed(3),
        }));
      }

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Purchase credits
   */
  async purchaseCredits(packageId, paymentMethod = 'card') {
    try {
      const response = await api.post('/payment/credits/purchase', {
        package_id: packageId,
        payment_method: paymentMethod,
        return_url: `${window.location.origin}/member/credits/success`,
        cancel_url: `${window.location.origin}/member/credits`,
      });

      // Redirect to CCBill if URL provided
      if (response.data?.redirect_url) {
        window.location.href = response.data.redirect_url;
      }

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get credit balance
   */
  async getCreditBalance() {
    try {
      const response = await api.get('/payment/credits/balance');

      // Store in localStorage for offline access
      if (response.data?.balance !== undefined) {
        localStorage.setItem('credit_balance', response.data.balance);
        localStorage.setItem(
          'credit_balance_updated',
          new Date().toISOString()
        );
      }

      return response;
    } catch (error) {
      // Return cached balance if offline
      if (error.code === 'OFFLINE') {
        const cachedBalance = localStorage.getItem('credit_balance');
        if (cachedBalance) {
          return {
            data: {
              balance: parseInt(cachedBalance),
              cached: true,
              updated_at: localStorage.getItem('credit_balance_updated'),
            },
          };
        }
      }
      throw this.handleError(error);
    }
  }

  /**
   * Get credit transaction history
   */
  async getCreditHistory(params = {}) {
    try {
      const response = await api.get('/payment/credits/history', {
        params: {
          type: params.type, // 'earned', 'spent', 'purchased', 'refunded'
          start_date: params.start_date,
          end_date: params.end_date,
          page: params.page || 1,
          limit: params.limit || 20,
        },
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Transfer credits (for tips)
   */
  async transferCredits(recipientId, amount, message = '') {
    try {
      const response = await api.post('/payment/credits/transfer', {
        recipient_id: recipientId,
        recipient_type: 'creator', // 'creator' or 'member'
        amount,
        message,
        type: 'tip', // 'tip', 'gift', 'payment'
      });

      // Update local balance
      if (response.data?.new_balance !== undefined) {
        localStorage.setItem('credit_balance', response.data.new_balance);
        localStorage.setItem(
          'credit_balance_updated',
          new Date().toISOString()
        );
      }

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // SUBSCRIPTIONS
  // ==========================================

  /**
   * Create subscription
   */
  async createSubscription(creatorId, data) {
    try {
      const response = await api.post('/payment/subscription/create', {
        creator_id: creatorId,
        tier: data.tier || 'basic', // 'basic', 'vip', 'premium'
        duration: data.duration || 30, // days
        auto_renew: data.auto_renew !== false,
        payment_method: data.payment_method || 'credits',
        promo_code: data.promo_code,
      });

      // Handle CCBill redirect for card payments
      if (response.data?.redirect_url && data.payment_method === 'card') {
        window.location.href = response.data.redirect_url;
      }

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, reason) {
    try {
      const response = await api.post(
        `/payment/subscription/${subscriptionId}/cancel`,
        {
          reason,
          cancel_immediately: false, // Let it run until end of period
        }
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(subscriptionId) {
    try {
      const response = await api.post(
        `/payment/subscription/${subscriptionId}/reactivate`
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId, data) {
    try {
      const response = await api.put(
        `/payment/subscription/${subscriptionId}`,
        {
          tier: data.tier,
          auto_renew: data.auto_renew,
          payment_method: data.payment_method,
        }
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get active subscriptions
   */
  async getActiveSubscriptions() {
    try {
      const response = await api.get('/payment/subscriptions/active');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get subscription history
   */
  async getSubscriptionHistory(params = {}) {
    try {
      const response = await api.get('/payment/subscriptions/history', {
        params: {
          status: params.status, // 'active', 'cancelled', 'expired'
          page: params.page || 1,
          limit: params.limit || 20,
        },
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // TRANSACTIONS
  // ==========================================

  /**
   * Get transaction history
   */
  async getTransactionHistory(params = {}) {
    try {
      const response = await api.get('/payment/transactions', {
        params: {
          type: params.type, // 'all', 'purchase', 'subscription', 'tip', 'refund'
          status: params.status, // 'pending', 'completed', 'failed', 'refunded'
          start_date: params.start_date,
          end_date: params.end_date,
          min_amount: params.min_amount,
          max_amount: params.max_amount,
          sort: params.sort || 'recent', // 'recent', 'oldest', 'amount_high', 'amount_low'
          page: params.page || 1,
          limit: params.limit || 20,
        },
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(transactionId) {
    try {
      const response = await api.get(`/payment/transactions/${transactionId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Request refund
   */
  async requestRefund(transactionId, reason, details) {
    try {
      const response = await api.post(
        `/payment/transactions/${transactionId}/refund`,
        {
          reason, // 'not_received', 'not_as_described', 'unauthorized', 'other'
          details,
          amount: null, // null for full refund, or specify partial amount
        }
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Download invoice
   */
  async downloadInvoice(transactionId) {
    try {
      const response = await api.get(
        `/payment/transactions/${transactionId}/invoice`,
        {
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${transactionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      return { success: true };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // PAYMENT METHODS
  // ==========================================

  /**
   * Get saved payment methods
   */
  async getPaymentMethods() {
    try {
      const response = await api.get('/payment/methods');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(data) {
    try {
      const response = await api.post('/payment/methods', {
        type: data.type, // 'card', 'paypal', 'crypto'
        card_details: data.card_details,
        billing_address: data.billing_address,
        set_as_default: data.set_as_default || false,
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(methodId, data) {
    try {
      const response = await api.put(`/payment/methods/${methodId}`, data);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(methodId) {
    try {
      const response = await api.delete(`/payment/methods/${methodId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(methodId) {
    try {
      const response = await api.put(`/payment/methods/${methodId}/default`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // CREATOR PAYOUTS
  // ==========================================

  /**
   * Get payout balance (for creators)
   */
  async getPayoutBalance() {
    try {
      const response = await api.get('/payment/payouts/balance');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Request payout (for creators)
   */
  async requestPayout(data) {
    try {
      const response = await api.post('/payment/payouts/request', {
        amount: data.amount,
        method: data.method, // 'bank', 'paypal', 'crypto'
        account_details: data.account_details,
        notes: data.notes,
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get payout history (for creators)
   */
  async getPayoutHistory(params = {}) {
    try {
      const response = await api.get('/payment/payouts/history', {
        params: {
          status: params.status, // 'pending', 'processing', 'completed', 'failed'
          start_date: params.start_date,
          end_date: params.end_date,
          page: params.page || 1,
          limit: params.limit || 20,
        },
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get payout settings (for creators)
   */
  async getPayoutSettings() {
    try {
      const response = await api.get('/payment/payouts/settings');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update payout settings (for creators)
   */
  async updatePayoutSettings(data) {
    try {
      const response = await api.put('/payment/payouts/settings', {
        minimum_payout: data.minimum_payout,
        auto_payout: data.auto_payout,
        payout_day: data.payout_day,
        tax_info: data.tax_info,
        preferred_method: data.preferred_method,
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // PROMO CODES & DISCOUNTS
  // ==========================================

  /**
   * Validate promo code
   */
  async validatePromoCode(code, itemType, itemId) {
    try {
      const response = await api.post('/payment/promo/validate', {
        code,
        item_type: itemType, // 'subscription', 'credits', 'content'
        item_id: itemId,
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Apply promo code
   */
  async applyPromoCode(code, sessionId) {
    try {
      const response = await api.post('/payment/promo/apply', {
        code,
        session_id: sessionId || sessionStorage.getItem('payment_session'),
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // SPENDING LIMITS & CONTROLS
  // ==========================================

  /**
   * Get spending limits
   */
  async getSpendingLimits() {
    try {
      const response = await api.get('/payment/limits');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Set spending limits
   */
  async setSpendingLimits(data) {
    try {
      const response = await api.put('/payment/limits', {
        daily_limit: data.daily_limit,
        weekly_limit: data.weekly_limit,
        monthly_limit: data.monthly_limit,
        per_transaction_limit: data.per_transaction_limit,
        require_pin: data.require_pin,
        pin_code: data.pin_code,
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify spending PIN
   */
  async verifySpendingPin(pin) {
    try {
      const response = await api.post('/payment/limits/verify-pin', { pin });

      // Store verification for session
      if (response.data?.verified) {
        sessionStorage.setItem('spending_pin_verified', 'true');
        sessionStorage.setItem('pin_verified_at', new Date().toISOString());
      }

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // ANALYTICS & REPORTS
  // ==========================================

  /**
   * Get spending analytics
   */
  async getSpendingAnalytics(params = {}) {
    try {
      const response = await api.get('/payment/analytics/spending', {
        params: {
          period: params.period || '30d',
          group_by: params.group_by || 'day',
          category: params.category,
        },
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get earnings analytics (for creators)
   */
  async getEarningsAnalytics(params = {}) {
    try {
      const response = await api.get('/payment/analytics/earnings', {
        params: {
          period: params.period || '30d',
          group_by: params.group_by || 'day',
          source: params.source, // 'subscriptions', 'tips', 'messages', 'content'
        },
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Export transaction report
   */
  async exportTransactionReport(params = {}) {
    try {
      const response = await api.get('/payment/reports/export', {
        params: {
          format: params.format || 'csv', // 'csv', 'pdf', 'excel'
          start_date: params.start_date,
          end_date: params.end_date,
          type: params.type,
        },
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `transactions_${new Date().toISOString()}.${params.format || 'csv'}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      return { success: true };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Get device fingerprint for fraud prevention
   */
  async getDeviceFingerprint() {
    try {
      // Collect device information
      const fingerprint = {
        user_agent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        color_depth: window.screen.colorDepth,
        pixel_ratio: window.devicePixelRatio,
        touch_support: 'ontouchstart' in window,
        webgl_vendor: this.getWebGLVendor(),
        local_time: new Date().toString(),
        session_storage: typeof sessionStorage !== 'undefined',
        local_storage: typeof localStorage !== 'undefined',
        indexed_db: 'indexedDB' in window,
        cpu_cores: navigator.hardwareConcurrency || 0,
      };

      // Generate hash
      const fingerprintString = JSON.stringify(fingerprint);
      const hash = await this.generateHash(fingerprintString);

      return {
        hash,
        data: fingerprint,
      };
    } catch (error) {
      console.error('Fingerprint generation error:', error);
      return null;
    }
  }

  /**
   * Get WebGL vendor for fingerprinting
   */
  getWebGLVendor() {
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          return gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        }
      }
    } catch (e) {
      // WebGL not available
    }
    return null;
  }

  /**
   * Generate hash for fingerprinting
   */
  async generateHash(str) {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return hashHex;
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  /**
   * Handle service errors
   */
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          return {
            error: true,
            message: data.message || 'Invalid payment request',
            errors: data.errors || {},
          };
        case 401:
          return {
            error: true,
            message: 'Authentication required',
            code: 'UNAUTHORIZED',
          };
        case 402:
          return {
            error: true,
            message: 'Payment required',
            code: 'PAYMENT_REQUIRED',
          };
        case 403:
          return {
            error: true,
            message: 'Payment not allowed',
            code: 'FORBIDDEN',
          };
        case 422:
          return {
            error: true,
            message: 'Invalid payment data',
            errors: data.errors || {},
          };
        case 429:
          return {
            error: true,
            message: 'Too many payment attempts. Please try again later.',
            code: 'RATE_LIMITED',
          };
        default:
          return {
            error: true,
            message: data.message || 'Payment processing error',
          };
      }
    }

    if (!navigator.onLine) {
      return {
        error: true,
        message: 'No internet connection. Payment cannot be processed offline.',
        code: 'OFFLINE',
      };
    }

    return {
      error: true,
      message: error.message || 'Payment processing failed',
    };
  }
}

// Create and export singleton instance
const paymentService = new PaymentService();
export default paymentService;
