const Member = require('../models/Member');
const Creator = require('../models/Creator');

// Discover members for creator browsing
const discoverMembers = async (req, res) => {
  try {
    console.log('🎯 Creator discovering members - API called');

    // Get the requesting creator's information
    const creatorUserId = req.user.id;
    console.log(`👤 Creator user ID: ${creatorUserId}`);

    const creator = await Creator.findOne({ user: creatorUserId }).populate('user', 'email');

    if (!creator) {
      console.log('❌ Creator profile not found');
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
      });
    }

    console.log(`✅ Creator found: ${creator.username || creator.displayName}`);

    // Get all active members with complete profiles
    console.log('🔍 Searching for members...');
    const members = await Member.find({
      profileComplete: true
    })
    .populate('user', 'email lastLogin createdAt isActive')
    .sort({ lastActive: -1 })
    .limit(50);

    console.log(`📊 Found ${members.length} members with complete profiles`);

    // Filter for active members only
    const activeMembers = members.filter(member => {
      const isActive = member.user?.isActive === true;
      console.log(`👤 Member ${member.username}: profileComplete=${member.profileComplete}, userActive=${isActive}`);
      return isActive;
    });

    console.log(`✅ ${activeMembers.length} active members found`);

    if (activeMembers.length === 0) {
      console.log('📭 No active members found - returning empty result');
      return res.json({
        success: true,
        members: [],
        total: 0,
        message: 'No active members found',
      });
    }

    // Transform members to frontend format
    const transformedMembers = activeMembers.map(member => {
      const user = member.user;
      console.log(`🔄 Transforming member: ${member.username}`);

      return {
        id: member._id,
        username: member.username || `Member_${member._id.toString().slice(-4)}`,
        displayName: member.displayName || member.username,
        isOnline: false, // Would need real-time tracking
        lastActive: member.lastActive || user?.lastLogin || new Date(),
        joinDate: user?.createdAt || new Date(),

        // Default spending data for members without profiles
        spendingTier: 'new',
        stats: {
          totalSpent: 0,
          last30DaySpend: 0,
          averagePurchase: 0,
          contentPurchases: member.purchasedContent?.length || 0,
          messagesExchanged: 0,
          tipsGiven: 0,
        },

        // Default activity data
        activity: {
          lastPurchase: member.purchasedContent && member.purchasedContent.length > 0
            ? member.purchasedContent[member.purchasedContent.length - 1].purchaseDate
            : null,
          purchaseFrequency: 'inactive',
          engagementLevel: 'new',
          hasSubscribed: false,
          subscriptionTier: null,
        },

        // Member info
        gender: member.gender,
        orientation: member.orientation,
        bodyType: member.bodyType,
        location: member.location,
        bio: member.bio,

        // Default badges for new members
        badges: ['newcomer'],
      };
    });

    console.log(`🎉 Successfully transformed ${transformedMembers.length} members`);
    console.log('📤 Sending response to frontend');

    // Return successful response
    res.json({
      success: true,
      members: transformedMembers,
      total: transformedMembers.length,
      message: `Found ${transformedMembers.length} members`,
    });

  } catch (error) {
    console.error('❌ Error in discoverMembers:', error);
    console.error('Stack trace:', error.stack);

    res.status(500).json({
      success: false,
      message: 'Failed to discover members',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  discoverMembers,
};