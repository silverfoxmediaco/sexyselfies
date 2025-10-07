# Analytics & Data Sync - Test Credits Purchase System

## Overview
This document details how test credit purchases are tracked and synced across the platform's analytics, creator dashboards, and member profiles.

---

## 🔄 Data Flow on Purchase

When a member purchases content with test credits (from browse or profile modal), the following data updates occur:

### 1. Transaction Record (`Transaction` Model)
**Location**: `backend/src/controllers/payment.controller.js:234-265`

Creates a complete transaction record with:
```javascript
{
  transactionId: "TEST_[timestamp]_[random]",
  memberId: memberId,
  creatorId: content.creator,
  amount: amount,
  type: 'content_unlock',
  contentId: contentId,
  status: 'completed',
  paymentMethod: 'test_credits',
  isTestTransaction: true,  // FLAG FOR FILTERING
  creatorEarnings: amount * 0.8,
  platformFee: 0.2,
  paymentDetails: {
    walletBalanceBefore: member.testCredits + amount,
    walletBalanceAfter: member.testCredits
  },
  unlockDetails: {
    unlockedAt: new Date(),
    viewCount: 0
  },
  analytics: {
    source: 'browse' | 'profile',  // TRACKS PURCHASE ORIGIN
    memberSegment: 'test'
  }
}
```

### 2. Member Balance Update (`Member` Model)
**Location**: `payment.controller.js:230-232`

- Deducts test credits from member's balance
- Updates `member.testCredits` field
- Persisted immediately before transaction creation

### 3. Content Monetization Update (`Content` Model)
**Location**: `payment.controller.js:269-282`

Adds unlock record and updates earnings:
```javascript
content.monetization.unlocks.push({
  member: memberId,
  unlockedAt: new Date(),
  transactionId: transaction._id,
  amount: amount
});
content.monetization.totalEarnings += amount;
```

### 4. Member Library Update (`Member.purchasedContent`)
**Location**: `payment.controller.js:284-291`

Adds to member's purchased content array for Library:
```javascript
member.purchasedContent.push({
  creator: content.creator,
  content: contentId,
  purchaseDate: new Date(),
  amount: amount
});
```

### 5. Creator Earnings Update (`CreatorEarnings` Model)
**Location**: `payment.controller.js:293-315`

Updates creator's earnings with test transaction marker:
```javascript
{
  $inc: {
    availableBalance: amount * 0.8,
    lifetimeEarnings: amount * 0.8,
    testEarnings: amount * 0.8  // SEPARATE TRACKING FOR TEST
  },
  $push: {
    transactions: {
      type: 'content_unlock',
      amount: amount * 0.8,
      transactionId: transaction._id,
      isTest: true,  // MARKED AS TEST
      createdAt: new Date()
    }
  }
}
```

### 6. Analytics Event Tracking (`AnalyticsEvent` Model)
**Location**: `payment.controller.js:317-339`

Creates conversion event for platform analytics:
```javascript
{
  category: 'conversion',
  action: 'content_unlock',
  label: 'test_credits',
  value: amount,
  userId: content.creator,
  userType: 'creator',
  metadata: {
    contentId: contentId,
    contentType: content.type,
    memberId: memberId,
    amount: amount,
    paymentMethod: 'test_credits',
    isTestTransaction: true,
    source: 'browse' | 'profile'  // PURCHASE ORIGIN TRACKING
  }
}
```

### 7. Member Analytics Update (`MemberAnalytics` Model)
**Location**: `payment.controller.js:341-370`

Updates member spending and engagement metrics:
```javascript
{
  $inc: {
    'spending.totalSpent': amount,
    'spending.contentPurchases': 1,
    'engagement.contentUnlocks': 1
  },
  $set: {
    'spending.lastPurchaseDate': new Date()
  },
  $push: {
    'spending.purchaseHistory': {
      date: new Date(),
      amount: amount,
      type: 'content_unlock',
      contentId: contentId,
      creatorId: content.creator,
      isTestTransaction: true  // FLAGGED AS TEST
    }
  }
}
```

---

## 📊 Analytics Tracking - Source Differentiation

### Purchase Source Tracking
The system tracks WHERE purchases originate:

**Option 1 - Browse/Swipe Purchase**
- Source: `'browse'`
- Triggered from: `BrowseCreators.jsx:422`
- Usage: Member taps blurred content in swipe feed

**Option 2 - Profile Modal Purchase**
- Source: `'profile'`
- Triggered from: `CreatorProfileModal.jsx:160-163`
- Usage: Member opens profile, navigates to Content tab, purchases from grid

### Analytics Service Integration
**File**: `backend/src/services/analytics.service.js`

Available analytics functions:
- `trackEvent()` - Tracks any platform event with metadata
- `updateRealTimeMetrics()` - Updates in-memory counters for dashboards
- `measureConversionRates()` - Calculates conversion rates by interaction type
- `revenueAttribution()` - Attributes revenue to sources (discovery, special_offer, message, etc.)
- `salesFunnelAnalysis()` - Analyzes conversion funnel stages
- `updateCreatorSalesMetrics()` - Updates creator-specific sales performance

---

## 🎯 Creator Dashboard Visibility

### What Creators Can See

**Earnings Dashboard**
- ✅ Total earnings (includes test earnings separately)
- ✅ Transaction history with `isTest: true` flag
- ✅ Content unlock counts
- ✅ Member engagement metrics

**Content Analytics**
- ✅ Number of unlocks per content piece
- ✅ Revenue per content (marked if test transaction)
- ✅ Member list who unlocked content
- ✅ Unlock dates and amounts

**Sales Metrics**
- ✅ Conversion tracking
- ✅ Purchase source attribution (browse vs profile)
- ✅ Member segment analysis
- ✅ Revenue by content type

### Filtering Test Data
Creators can filter out test transactions using the `isTestTransaction` flag:
```javascript
// Get only real transactions
const realTransactions = transactions.filter(t => !t.isTestTransaction);

// Get only test transactions
const testTransactions = transactions.filter(t => t.isTestTransaction);
```

---

## 👤 Member Profile Visibility

### What Members Can Access

**Purchase History**
- ✅ All purchased content (test + real)
- ✅ Purchase dates and amounts
- ✅ Associated creators
- ✅ Test transaction flags

**Library**
- ✅ All unlocked content accessible
- ✅ Organized by creator
- ✅ Purchase metadata (date, amount)
- ✅ Content available regardless of test/real purchase

**Spending Analytics**
- ✅ Total spent (includes test credits)
- ✅ Content unlock count
- ✅ Last purchase date
- ✅ Purchase history timeline

---

## 🔍 Test vs Real Transaction Separation

### Key Flags
1. **`Transaction.isTestTransaction`** (boolean)
   - True for test credit purchases
   - False for CCBill/real payments
   - Indexed for fast filtering

2. **`CreatorEarnings.testEarnings`** (number)
   - Separate counter for test earnings
   - Prevents contamination of real payout calculations

3. **`CreatorEarnings.transactions[].isTest`** (boolean)
   - Each transaction marked individually
   - Easy to filter in creator dashboard

4. **`MemberAnalytics.spending.purchaseHistory[].isTestTransaction`** (boolean)
   - Member's purchase history flagged
   - Allows member to see test vs real spending

### Payout Protection
**Important**: Test earnings won't affect real payouts because:
- `testEarnings` tracked separately
- Payout requests filter `isTestTransaction: false`
- Admin dashboard can distinguish test vs real revenue

---

## 🚀 API Endpoints

### Test Credit Purchase
```
POST /api/payments/unlock-content-test
Body: {
  contentId: string,
  source: 'browse' | 'profile'  // Optional, defaults to 'browse'
}
Headers: {
  Authorization: Bearer [memberToken]
}
```

### Analytics Query Examples
```
GET /api/creator/analytics/revenue?period=last30Days&excludeTest=true
GET /api/creator/analytics/conversions?source=profile
GET /api/admin/analytics/revenue-attribution?includeTest=false
```

---

## 📋 Testing Verification

### Checklist for QA
- [ ] Test credit purchase creates transaction with `isTestTransaction: true`
- [ ] Member balance decreases correctly
- [ ] Content appears in member's Library
- [ ] Content shows as unlocked in browse feed
- [ ] Content shows as unlocked in creator profile modal
- [ ] Creator earnings update with `testEarnings` increment
- [ ] Analytics event created with correct source ('browse' or 'profile')
- [ ] MemberAnalytics updates with purchase history
- [ ] Creator dashboard shows transaction with test flag
- [ ] Payout calculations exclude test earnings
- [ ] Real money payouts not affected by test transactions

---

## 🔐 Security & Privacy

### Data Integrity
- Test transactions clearly flagged at all levels
- No mixing of test and real revenue in payout calculations
- Analytics can be filtered to exclude test data
- Member privacy maintained (personal data not exposed in analytics)

### Audit Trail
Every test purchase creates:
1. Transaction record with full metadata
2. Console log with transaction details
3. Analytics event for platform tracking
4. Member purchase history entry
5. Creator earnings transaction entry

All records include timestamps and are immutable once created.

---

## 📝 Notes

- Test credits are for **development/QA only** - not real money
- All test transactions include `isTestTransaction: true` flag
- Test earnings tracked separately in `CreatorEarnings.testEarnings`
- Analytics source tracking enables A/B testing (browse vs profile purchases)
- Real-time metrics update immediately on purchase
- Creator dashboards can filter test data for accurate business metrics
- Member Library includes all content regardless of purchase method

---

**Last Updated**: 2025
**Version**: 1.0
**Status**: Complete ✅
