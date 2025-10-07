// backend/src/controllers/admin.testCredits.controller.js
// Admin endpoints for managing test credits for QA/development testing

const Member = require('../models/Member');
const Transaction = require('../models/Transaction');

/**
 * @desc    Grant test credits to a member
 * @route   POST /api/admin/test-credits/grant
 * @access  Admin
 */
exports.grantTestCredits = async (req, res) => {
  try {
    const { memberId, amount, note } = req.body;

    // Validation
    if (!memberId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Member ID and amount are required',
      });
    }

    if (amount <= 0 || amount > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be between $0.01 and $10,000',
      });
    }

    // Find member
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    // Add test credits
    member.testCredits += amount;
    await member.save();

    // Log the grant in metadata (optional - for audit trail)
    console.log(
      `✅ Admin ${req.admin.email} granted $${amount} test credits to member ${member.username}. New balance: $${member.testCredits}`
    );

    res.status(200).json({
      success: true,
      message: `Granted $${amount.toFixed(2)} test credits to ${member.username}`,
      data: {
        memberId: member._id,
        username: member.username,
        testCredits: member.testCredits,
        amountGranted: amount,
        grantedBy: req.admin.email,
        note,
      },
    });
  } catch (error) {
    console.error('Error granting test credits:', error);
    res.status(500).json({
      success: false,
      message: 'Error granting test credits',
      error: error.message,
    });
  }
};

/**
 * @desc    Deduct test credits from a member
 * @route   POST /api/admin/test-credits/deduct
 * @access  Admin
 */
exports.deductTestCredits = async (req, res) => {
  try {
    const { memberId, amount, reason } = req.body;

    if (!memberId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Member ID and amount are required',
      });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    if (member.testCredits < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient test credits. Member has $${member.testCredits.toFixed(2)}`,
      });
    }

    // Deduct test credits
    member.testCredits -= amount;
    await member.save();

    console.log(
      `✅ Admin ${req.admin.email} deducted $${amount} test credits from member ${member.username}. Remaining: $${member.testCredits}`
    );

    res.status(200).json({
      success: true,
      message: `Deducted $${amount.toFixed(2)} test credits from ${member.username}`,
      data: {
        memberId: member._id,
        username: member.username,
        testCredits: member.testCredits,
        amountDeducted: amount,
        deductedBy: req.admin.email,
        reason,
      },
    });
  } catch (error) {
    console.error('Error deducting test credits:', error);
    res.status(500).json({
      success: false,
      message: 'Error deducting test credits',
      error: error.message,
    });
  }
};

/**
 * @desc    Set test credits for a member (override)
 * @route   POST /api/admin/test-credits/set
 * @access  Admin
 */
exports.setTestCredits = async (req, res) => {
  try {
    const { memberId, amount } = req.body;

    if (!memberId || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Member ID and amount are required',
      });
    }

    if (amount < 0 || amount > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be between $0 and $10,000',
      });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    const oldBalance = member.testCredits;
    member.testCredits = amount;
    await member.save();

    console.log(
      `✅ Admin ${req.admin.email} set test credits for member ${member.username} from $${oldBalance} to $${amount}`
    );

    res.status(200).json({
      success: true,
      message: `Set test credits for ${member.username} to $${amount.toFixed(2)}`,
      data: {
        memberId: member._id,
        username: member.username,
        testCredits: member.testCredits,
        previousBalance: oldBalance,
        setBy: req.admin.email,
      },
    });
  } catch (error) {
    console.error('Error setting test credits:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting test credits',
      error: error.message,
    });
  }
};

/**
 * @desc    Get test credit balance for a member
 * @route   GET /api/admin/test-credits/balance/:memberId
 * @access  Admin
 */
exports.getTestCreditBalance = async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await Member.findById(memberId).select(
      'username testCredits credits email'
    );
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        memberId: member._id,
        username: member.username,
        testCredits: member.testCredits,
        realCredits: member.credits,
      },
    });
  } catch (error) {
    console.error('Error getting test credit balance:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting test credit balance',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all members with test credits
 * @route   GET /api/admin/test-credits/members
 * @access  Admin
 */
exports.getMembersWithTestCredits = async (req, res) => {
  try {
    const members = await Member.find({ testCredits: { $gt: 0 } })
      .select('username testCredits credits email lastActive')
      .sort('-testCredits')
      .limit(100);

    const totalTestCredits = members.reduce(
      (sum, m) => sum + m.testCredits,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        members,
        count: members.length,
        totalTestCredits: totalTestCredits.toFixed(2),
      },
    });
  } catch (error) {
    console.error('Error getting members with test credits:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting members with test credits',
      error: error.message,
    });
  }
};

/**
 * @desc    Reset test credits for all members
 * @route   POST /api/admin/test-credits/reset-all
 * @access  Admin
 */
exports.resetAllTestCredits = async (req, res) => {
  try {
    const result = await Member.updateMany(
      { testCredits: { $gt: 0 } },
      { $set: { testCredits: 0 } }
    );

    console.log(
      `✅ Admin ${req.admin.email} reset test credits for ${result.modifiedCount} members`
    );

    res.status(200).json({
      success: true,
      message: `Reset test credits for ${result.modifiedCount} members`,
      data: {
        membersReset: result.modifiedCount,
        resetBy: req.admin.email,
      },
    });
  } catch (error) {
    console.error('Error resetting test credits:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting test credits',
      error: error.message,
    });
  }
};

/**
 * @desc    Get test transaction history
 * @route   GET /api/admin/test-credits/transactions
 * @access  Admin
 */
exports.getTestTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 50, memberId } = req.query;

    const query = { isTestTransaction: true };
    if (memberId) {
      query.memberId = memberId;
    }

    const transactions = await Transaction.find(query)
      .populate('memberId', 'username email')
      .populate('creatorId', 'stageName')
      .populate('contentId', 'title type')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Transaction.countDocuments(query);

    // Calculate test transaction stats
    const stats = await Transaction.aggregate([
      { $match: { isTestTransaction: true } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
        stats: stats[0] || { totalAmount: 0, count: 0, avgAmount: 0 },
      },
    });
  } catch (error) {
    console.error('Error getting test transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting test transactions',
      error: error.message,
    });
  }
};

/**
 * @desc    Bulk grant test credits to multiple members
 * @route   POST /api/admin/test-credits/bulk-grant
 * @access  Admin
 */
exports.bulkGrantTestCredits = async (req, res) => {
  try {
    const { memberIds, amount, note } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Member IDs array is required',
      });
    }

    if (!amount || amount <= 0 || amount > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be between $0.01 and $10,000',
      });
    }

    // Update all members
    const result = await Member.updateMany(
      { _id: { $in: memberIds } },
      { $inc: { testCredits: amount } }
    );

    console.log(
      `✅ Admin ${req.admin.email} bulk granted $${amount} test credits to ${result.modifiedCount} members`
    );

    res.status(200).json({
      success: true,
      message: `Granted $${amount.toFixed(2)} test credits to ${result.modifiedCount} members`,
      data: {
        membersUpdated: result.modifiedCount,
        amountPerMember: amount,
        totalGranted: (amount * result.modifiedCount).toFixed(2),
        grantedBy: req.admin.email,
        note,
      },
    });
  } catch (error) {
    console.error('Error bulk granting test credits:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk granting test credits',
      error: error.message,
    });
  }
};
