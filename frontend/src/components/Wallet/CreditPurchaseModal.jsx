import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CreditCard,
  Zap,
  Star,
  ShieldCheck,
  Gift,
  Sparkles,
  Lock,
  Check
} from 'lucide-react';
import paymentService from '../../services/payment.service';
import './CreditPurchaseModal.css';

const CreditPurchaseModal = ({
  isOpen = true,
  onClose,
  onSuccess,
  onPurchase,
  currentCredits = 0,
  pendingPurchase = null
}) => {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('ccbill');
  const [step, setStep] = useState('packages'); // 'packages', 'payment', 'processing'

  useEffect(() => {
    fetchCreditPackages();
  }, []);

  const fetchCreditPackages = async () => {
    try {
      const response = await paymentService.getCreditPackages();
      if (response.data?.packages) {
        setPackages(response.data.packages);
        // Auto-select the popular package
        const popularPackage = response.data.packages.find(pkg => pkg.popular);
        if (popularPackage) {
          setSelectedPackage(popularPackage);
        }
      }
    } catch (error) {
      console.error('Error fetching credit packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    try {
      setPurchasing(true);
      setStep('processing');

      // Use the payment service directly for credit purchases
      const response = await paymentService.purchaseCredits(selectedPackage);

      if (response.success) {
        // Call onSuccess for insufficient credits flow, or onPurchase for backward compatibility
        if (onSuccess) {
          onSuccess(response);
        } else if (onPurchase) {
          onPurchase(selectedPackage);
        }
      }

    } catch (error) {
      console.error('Purchase error:', error);
      setPurchasing(false);
      setStep('packages');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateSavings = (pkg) => {
    const baseValue = pkg.base_credits * 0.01; // $0.01 per credit base price
    const actualPricePerCredit = pkg.price / (pkg.base_credits + (pkg.bonus_credits || 0));
    const savings = ((baseValue - actualPricePerCredit) / baseValue) * 100;
    return Math.round(savings);
  };

  const getPackageIcon = (pkg) => {
    if (pkg.popular) return <Star className="CreditPurchaseModal-package-icon popular" />;
    if (pkg.bonus_credits > 0) return <Gift className="CreditPurchaseModal-package-icon bonus" />;
    return <Zap className="CreditPurchaseModal-package-icon" />;
  };

  const getBadge = (pkg) => {
    if (pkg.popular) return { text: 'Most Popular', class: 'popular' };
    if (calculateSavings(pkg) >= 30) return { text: 'Best Value', class: 'best-value' };
    if (pkg.bonus_credits > 0) return { text: `+${pkg.bonus_credits} Bonus`, class: 'bonus' };
    return null;
  };

  return (
    <AnimatePresence>
      <motion.div
        className="CreditPurchaseModal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="CreditPurchaseModal"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="CreditPurchaseModal-header">
            <div className="CreditPurchaseModal-title">
              <Sparkles size={24} />
              <h2>{pendingPurchase ? 'Add Credits to Continue' : 'Add Credits'}</h2>
              {pendingPurchase && (
                <p className="CreditPurchaseModal-context">
                  You need credits to unlock "{pendingPurchase.title}" ({pendingPurchase.price} credits)
                </p>
              )}
            </div>
            <button
              className="CreditPurchaseModal-close-btn"
              onClick={onClose}
              disabled={purchasing}
            >
              <X size={20} />
            </button>
          </div>

          {step === 'packages' && (
            <motion.div
              className="CreditPurchaseModal-content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Current Balance */}
              <div className="CreditPurchaseModal-current-balance">
                <span className="CreditPurchaseModal-balance-label">Current Balance</span>
                <span className="CreditPurchaseModal-balance-value">
                  {currentCredits.toLocaleString()} credits
                </span>
              </div>

              {/* Packages Grid */}
              <div className="CreditPurchaseModal-packages">
                {loading ? (
                  <div className="CreditPurchaseModal-loading">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="CreditPurchaseModal-package-skeleton" />
                    ))}
                  </div>
                ) : (
                  packages.map((pkg) => {
                    const totalCredits = pkg.base_credits + (pkg.bonus_credits || 0);
                    const badge = getBadge(pkg);
                    const savings = calculateSavings(pkg);
                    const isSelected = selectedPackage?.id === pkg.id;

                    return (
                      <motion.div
                        key={pkg.id}
                        className={`CreditPurchaseModal-package ${isSelected ? 'selected' : ''} ${pkg.popular ? 'popular' : ''}`}
                        onClick={() => handlePackageSelect(pkg)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {badge && (
                          <div className={`CreditPurchaseModal-package-badge ${badge.class}`}>
                            {badge.text}
                          </div>
                        )}

                        <div className="CreditPurchaseModal-package-icon-container">
                          {getPackageIcon(pkg)}
                        </div>

                        <div className="CreditPurchaseModal-package-credits">
                          <span className="CreditPurchaseModal-package-amount">
                            {totalCredits.toLocaleString()}
                          </span>
                          <span className="CreditPurchaseModal-package-unit">credits</span>
                        </div>

                        <div className="CreditPurchaseModal-package-price">
                          {formatCurrency(pkg.price)}
                        </div>

                        {pkg.bonus_credits > 0 && (
                          <div className="CreditPurchaseModal-package-bonus">
                            <Gift size={14} />
                            +{pkg.bonus_credits} bonus credits
                          </div>
                        )}

                        {savings > 0 && (
                          <div className="CreditPurchaseModal-package-savings">
                            Save {savings}%
                          </div>
                        )}

                        <div className="CreditPurchaseModal-package-per-credit">
                          {formatCurrency(pkg.price / totalCredits)} per credit
                        </div>

                        {isSelected && (
                          <motion.div
                            className="CreditPurchaseModal-package-selected"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <Check size={16} />
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Security Info */}
              <div className="CreditPurchaseModal-security">
                <ShieldCheck size={16} />
                <span>Secure payment powered by CCBill</span>
              </div>

              {/* Purchase Button */}
              <button
                className="CreditPurchaseModal-purchase-btn"
                disabled={!selectedPackage || loading}
                onClick={handlePurchase}
              >
                <Lock size={18} />
                Purchase {selectedPackage?.base_credits + (selectedPackage?.bonus_credits || 0)} Credits
                {selectedPackage && (
                  <span className="CreditPurchaseModal-purchase-price">
                    {formatCurrency(selectedPackage.price)}
                  </span>
                )}
              </button>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              className="CreditPurchaseModal-processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="CreditPurchaseModal-processing-icon">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles size={48} />
                </motion.div>
              </div>
              <h3>Processing Payment</h3>
              <p>You'll be redirected to complete your purchase...</p>
              <div className="CreditPurchaseModal-processing-dots">
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                  className="dot"
                />
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="dot"
                />
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  className="dot"
                />
              </div>
            </motion.div>
          )}

          {/* Footer */}
          {step === 'packages' && (
            <div className="CreditPurchaseModal-footer">
              <div className="CreditPurchaseModal-footer-info">
                <p>Credits never expire and can be used for content, tips, and messaging</p>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreditPurchaseModal;