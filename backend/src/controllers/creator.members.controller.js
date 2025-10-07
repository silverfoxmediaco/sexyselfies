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

// Get individual member profile for creator
const getMemberProfile = async (req, res) => {
  try {
    const { memberId } = req.params;
    const creatorUserId = req.user.id;

    console.log(`🔍 Creator viewing member profile: ${memberId}`);

    // Verify creator exists
    const creator = await Creator.findOne({ user: creatorUserId });
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
      });
    }

    // Find the member
    const member = await Member.findById(memberId)
      .populate('user', 'email lastLogin createdAt isActive');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    // Check if member is active
    if (!member.user?.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This member account is inactive',
      });
    }

    // Transform member data for detailed profile view
    const memberProfile = {
      id: member._id,
      username: member.username || `Member_${member._id.toString().slice(-4)}`,
      displayName: member.displayName || member.username,
      profileImage: member.profileImage || '/placeholders/default-avatar.png',
      bio: member.bio || 'No bio yet',

      // User info
      isOnline: member.isOnline || false,
      lastActive: member.lastActive || member.user?.lastLogin || new Date(),
      joinDate: member.user?.createdAt || new Date(),

      // Demographics
      age: member.age,
      gender: member.gender,
      orientation: member.orientation,
      bodyType: member.bodyType,
      location: member.location,

      // Spending stats
      stats: {
        totalSpent: member.purchasedContent?.reduce((sum, item) => sum + (item.price || 0), 0) || 0,
        last30DaySpend: 0, // Would need to calculate from purchases within last 30 days
        averagePurchase: member.purchasedContent?.length > 0
          ? (member.purchasedContent.reduce((sum, item) => sum + (item.price || 0), 0) / member.purchasedContent.length)
          : 0,
        contentPurchases: member.purchasedContent?.length || 0,
        messagesExchanged: 0, // Would need to query messages
        tipsGiven: 0, // Would need to query tips
      },

      // Activity info
      activity: {
        lastPurchase: member.purchasedContent && member.purchasedContent.length > 0
          ? member.purchasedContent[member.purchasedContent.length - 1].purchaseDate
          : null,
        purchaseFrequency: member.purchasedContent?.length > 10 ? 'active' : 'occasional',
        engagementLevel: member.purchasedContent?.length > 0 ? 'engaged' : 'new',
      },

      // Preferences
      preferences: member.preferences || {},

      // Badges
      badges: [],
    };

    // Add badges based on activity
    if (member.purchasedContent?.length === 0) memberProfile.badges.push('newcomer');
    if (member.purchasedContent?.length > 10) memberProfile.badges.push('regular');
    if (member.purchasedContent?.length > 50) memberProfile.badges.push('vip');

    console.log(`✅ Successfully retrieved profile for member: ${member.username}`);

    res.json({
      success: true,
      data: memberProfile,
    });

  } catch (error) {
    console.error('❌ Error in getMemberProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve member profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  discoverMembers,
  getMemberProfile,
};