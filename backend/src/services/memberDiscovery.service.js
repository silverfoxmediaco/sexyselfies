const Member = require('../models/Member');
const MemberProfile = require('../models/MemberProfile');

class MemberDiscoveryService {

  // Find all compatible members for a creator
  async findCompatibleMembers(creatorUserId, options = {}) {
    try {
      console.log('🔍 MemberDiscoveryService: Finding compatible members');

      const {
        limit = 50,
        sortBy = 'lastActive',
        includeInactive = false
      } = options;

      // Base query - members with complete profiles
      const query = { profileComplete: true };

      console.log('📋 Query criteria:', JSON.stringify(query));

      // Get members with populated user data
      const members = await Member.find(query)
        .populate('user', 'email lastLogin createdAt isActive emailVerified')
        .sort(this.getSortOption(sortBy))
        .limit(limit);

      console.log(`📊 Found ${members.length} members from database`);

      // Filter based on user activity if needed
      const filteredMembers = includeInactive
        ? members
        : members.filter(member => {
            const isActive = member.user?.isActive === true;
            const isVerified = member.user?.emailVerified === true;

            console.log(`👤 ${member.username}: active=${isActive}, verified=${isVerified}`);
            return isActive && isVerified;
          });

      console.log(`✅ ${filteredMembers.length} members passed filters`);

      return filteredMembers;

    } catch (error) {
      console.error('❌ Error in findCompatibleMembers:', error);
      throw error;
    }
  }

  // Transform member data for frontend consumption
  transformMemberForFrontend(member, memberProfile = null) {
    const user = member.user;

    // Base member data
    const transformedMember = {
      id: member._id,
      username: member.username || `Member_${member._id.toString().slice(-4)}`,
      displayName: member.displayName || member.username,
      isOnline: false, // Would need real-time tracking
      lastActive: member.lastActive || user?.lastLogin || new Date(),
      joinDate: user?.createdAt || new Date(),

      // Member profile information
      gender: member.gender,
      orientation: member.orientation,
      bodyType: member.bodyType,
      location: member.location,
      bio: member.bio,
      age: member.age,
    };

    // Add profile data if available
    if (memberProfile) {
      transformedMember.spendingTier = memberProfile.spending?.tier || 'new';
      transformedMember.stats = {
        totalSpent: memberProfile.spending?.totalSpent || 0,
        last30DaySpend: memberProfile.spending?.last30DaySpend || 0,
        averagePurchase: memberProfile.spending?.averagePurchase || 0,
        contentPurchases: memberProfile.activity?.contentPurchases || 0,
        messagesExchanged: memberProfile.activity?.messagesExchanged || 0,
        tipsGiven: memberProfile.activity?.tipsGiven || 0,
      };
      transformedMember.activity = {
        lastPurchase: memberProfile.spending?.lastPurchaseDate,
        purchaseFrequency: memberProfile.spending?.purchaseFrequency || 'inactive',
        engagementLevel: memberProfile.activity?.engagementLevel || 'new',
        hasSubscribed: memberProfile.subscription?.hasSubscribed || false,
        subscriptionTier: memberProfile.subscription?.subscriptionTier,
      };
      transformedMember.badges = memberProfile.badges || ['newcomer'];
    } else {
      // Default data for members without profiles
      transformedMember.spendingTier = 'new';
      transformedMember.stats = {
        totalSpent: 0,
        last30DaySpend: 0,
        averagePurchase: 0,
        contentPurchases: member.purchasedContent?.length || 0,
        messagesExchanged: 0,
        tipsGiven: 0,
      };
      transformedMember.activity = {
        lastPurchase: this.getLastPurchaseDate(member),
        purchaseFrequency: 'inactive',
        engagementLevel: 'new',
        hasSubscribed: false,
        subscriptionTier: null,
      };
      transformedMember.badges = ['newcomer'];
    }

    return transformedMember;
  }

  // Get member profiles for a list of member IDs
  async getMemberProfiles(memberIds) {
    try {
      if (!memberIds || memberIds.length === 0) {
        return [];
      }

      console.log(`🔍 Fetching profiles for ${memberIds.length} members`);

      const profiles = await MemberProfile.find({
        member: { $in: memberIds }
      }).populate('member');

      console.log(`📊 Found ${profiles.length} member profiles`);

      return profiles;
    } catch (error) {
      console.error('❌ Error fetching member profiles:', error);
      return []; // Return empty array on error to allow fallback
    }
  }

  // Get sort option for MongoDB query
  getSortOption(sortBy) {
    switch (sortBy) {
      case 'lastActive':
        return { lastActive: -1 };
      case 'joinDate':
        return { createdAt: -1 };
      case 'username':
        return { username: 1 };
      default:
        return { lastActive: -1 };
    }
  }

  // Get last purchase date from member data
  getLastPurchaseDate(member) {
    if (member.purchasedContent && member.purchasedContent.length > 0) {
      const purchases = member.purchasedContent.sort((a, b) =>
        new Date(b.purchaseDate) - new Date(a.purchaseDate)
      );
      return purchases[0].purchaseDate;
    }
    return null;
  }

  // Apply filters to member list
  applyFilters(members, filters = {}) {
    let filtered = [...members];

    // Gender filter
    if (filters.gender && filters.gender !== 'all') {
      filtered = filtered.filter(member => member.gender === filters.gender);
    }

    // Orientation filter
    if (filters.orientation && filters.orientation !== 'all') {
      filtered = filtered.filter(member => member.orientation === filters.orientation);
    }

    // Body type filter
    if (filters.bodyType && filters.bodyType !== 'all') {
      filtered = filtered.filter(member => member.bodyType === filters.bodyType);
    }

    // Location filter
    if (filters.country && filters.country !== 'all') {
      filtered = filtered.filter(member => member.location?.country === filters.country);
    }

    // Age range filter
    if (filters.minAge || filters.maxAge) {
      filtered = filtered.filter(member => {
        if (!member.age) return true; // Include if age not specified

        const meetsMin = !filters.minAge || member.age >= filters.minAge;
        const meetsMax = !filters.maxAge || member.age <= filters.maxAge;

        return meetsMin && meetsMax;
      });
    }

    console.log(`🔧 Applied filters: ${members.length} -> ${filtered.length} members`);

    return filtered;
  }
}

module.exports = new MemberDiscoveryService();