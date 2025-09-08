// backend/src/utils/memberSegmentation.js
// Utilities for advanced member segmentation and targeting

const MemberAnalytics = require('../models/MemberAnalytics');
const MemberInteraction = require('../models/MemberInteraction');
const Transaction = require('../models/Transaction');

// ============================================
// SPENDING-BASED SEGMENTATION
// ============================================

/**
 * Segment members by spending patterns
 * @param {Object} options - Segmentation options
 * @returns {Object} Segmented member groups
 */
exports.segmentBySpending = async (options = {}) => {
  try {
    const {
      creatorId = null,
      period = 'last30Days',
      includeInactive = false,
      groupBy = 'tier' // tier, range, velocity, lifetime
    } = options;
    
    // Build base query
    let query = {
      'privacy.discoverable': true
    };
    
    // Add creator-specific filtering if provided
    if (creatorId) {
      query['privacy.blockedCreators'] = { $ne: creatorId };
    }
    
    // Exclude inactive members if requested
    if (!includeInactive) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      query['activity.lastActive'] = { $gte: thirtyDaysAgo };
    }
    
    // Get all members matching criteria
    const members = await MemberAnalytics.find(query)
      .populate('member', 'username avatar joinDate');
    
    // Segment based on groupBy parameter
    let segments = {};
    
    switch (groupBy) {
      case 'tier':
        segments = segmentByTier(members, period);
        break;
        
      case 'range':
        segments = segmentBySpendingRange(members, period);
        break;
        
      case 'velocity':
        segments = segmentByVelocity(members);
        break;
        
      case 'lifetime':
        segments = segmentByLifetimeValue(members);
        break;
        
      default:
        segments = segmentByTier(members, period);
    }
    
    // Add statistics to each segment
    const enhancedSegments = {};
    
    for (const [segmentName, memberList] of Object.entries(segments)) {
      enhancedSegments[segmentName] = {
        members: memberList,
        count: memberList.length,
        statistics: calculateSegmentStatistics(memberList, period),
        characteristics: getSegmentCharacteristics(segmentName, memberList),
        recommendations: getSegmentRecommendations(segmentName, memberList)
      };
    }
    
    return {
      segmentation: 'spending',
      groupBy,
      period,
      segments: enhancedSegments,
      summary: generateSpendingSummary(enhancedSegments)
    };
    
  } catch (error) {
    console.error('Segment by spending error:', error);
    throw error;
  }
};

/**
 * Segment members by activity patterns
 * @param {Object} options - Segmentation options
 * @returns {Object} Segmented member groups
 */
exports.segmentByActivity = async (options = {}) => {
  try {
    const {
      creatorId = null,
      activityType = 'engagement', // engagement, frequency, recency, pattern
      timeframe = 30 // days to look back
    } = options;
    
    // Build base query
    let query = {
      'privacy.discoverable': true
    };
    
    if (creatorId) {
      query['privacy.blockedCreators'] = { $ne: creatorId };
    }
    
    // Get members with activity data
    const members = await MemberAnalytics.find(query)
      .populate('member', 'username avatar lastActive');
    
    // Segment based on activity type
    let segments = {};
    
    switch (activityType) {
      case 'engagement':
        segments = segmentByEngagementLevel(members, creatorId);
        break;
        
      case 'frequency':
        segments = segmentByActivityFrequency(members, timeframe);
        break;
        
      case 'recency':
        segments = segmentByLastActiveTime(members);
        break;
        
      case 'pattern':
        segments = segmentByActivityPattern(members);
        break;
        
      default:
        segments = segmentByEngagementLevel(members, creatorId);
    }
    
    // Enhance segments with analytics
    const enhancedSegments = {};
    
    for (const [segmentName, memberList] of Object.entries(segments)) {
      enhancedSegments[segmentName] = {
        members: memberList,
        count: memberList.length,
        statistics: calculateActivityStatistics(memberList, timeframe),
        behavior: analyzeSegmentBehavior(memberList),
        engagement: await calculateEngagementMetrics(memberList, creatorId),
        recommendations: getActivityRecommendations(segmentName, memberList)
      };
    }
    
    return {
      segmentation: 'activity',
      activityType,
      timeframe,
      segments: enhancedSegments,
      summary: generateActivitySummary(enhancedSegments)
    };
    
  } catch (error) {
    console.error('Segment by activity error:', error);
    throw error;
  }
};

/**
 * Segment members by content and category preferences
 * @param {Object} options - Segmentation options
 * @returns {Object} Segmented member groups
 */
exports.segmentByPreferences = async (options = {}) => {
  try {
    const {
      creatorId = null,
      preferenceType = 'categories', // categories, contentTypes, priceRange, combined
      matchCreatorContent = false
    } = options;
    
    // Build base query
    let query = {
      'privacy.discoverable': true
    };
    
    if (creatorId) {
      query['privacy.blockedCreators'] = { $ne: creatorId };
    }
    
    // Get members with preference data
    const members = await MemberAnalytics.find(query)
      .populate('member', 'username avatar');
    
    // Get creator's content categories if matching
    let creatorCategories = [];
    if (matchCreatorContent && creatorId) {
      const Creator = require('../models/Creator');
      const creator = await Creator.findById(creatorId);
      creatorCategories = []; // Categories removed from schema
    }
    
    // Segment based on preference type
    let segments = {};
    
    switch (preferenceType) {
      case 'categories':
        segments = segmentByCategories(members, creatorCategories);
        break;
        
      case 'contentTypes':
        segments = segmentByContentTypes(members);
        break;
        
      case 'priceRange':
        segments = segmentByPricePreference(members);
        break;
        
      case 'combined':
        segments = segmentByCombinedPreferences(members, creatorCategories);
        break;
        
      default:
        segments = segmentByCategories(members, creatorCategories);
    }
    
    // Enhance segments with preference analytics
    const enhancedSegments = {};
    
    for (const [segmentName, memberList] of Object.entries(segments)) {
      enhancedSegments[segmentName] = {
        members: memberList,
        count: memberList.length,
        preferences: analyzeSegmentPreferences(memberList),
        purchasing: calculatePurchasingPatterns(memberList),
        compatibility: matchCreatorContent ? 
          calculateCreatorCompatibility(memberList, creatorCategories) : null,
        recommendations: getPreferenceRecommendations(segmentName, memberList)
      };
    }
    
    return {
      segmentation: 'preferences',
      preferenceType,
      matchCreatorContent,
      segments: enhancedSegments,
      summary: generatePreferenceSummary(enhancedSegments)
    };
    
  } catch (error) {
    console.error('Segment by preferences error:', error);
    throw error;
  }
};

/**
 * Create custom segments based on multiple criteria
 * @param {Object} criteria - Custom segmentation criteria
 * @returns {Object} Custom segmented groups
 */
exports.createCustomSegments = async (criteria = {}) => {
  try {
    const {
      creatorId = null,
      segments = []
    } = criteria;
    
    // Default custom segments if none provided
    const defaultSegments = [
      {
        name: 'High-Value Engaged',
        conditions: {
          spendingTier: ['whale', 'vip'],
          activityLevel: ['very-active', 'active'],
          churnRisk: ['low', 'minimal']
        }
      },
      {
        name: 'Rising Stars',
        conditions: {
          spendingVelocity: 'increasing',
          joinedWithin: 90, // days
          minimumPurchases: 2
        }
      },
      {
        name: 'At-Risk VIPs',
        conditions: {
          spendingTier: ['whale', 'vip'],
          churnRisk: ['medium', 'high'],
          lastActiveWithin: 30
        }
      },
      {
        name: 'Dormant Potential',
        conditions: {
          lifetimeSpend: { $gte: 100 },
          lastActiveWithin: { $gte: 30, $lte: 90 },
          previousEngagement: true
        }
      },
      {
        name: 'New High-Potential',
        conditions: {
          joinedWithin: 30,
          firstPurchaseWithin: 7,
          spendingVelocity: ['stable', 'increasing']
        }
      },
      {
        name: 'Loyal Regulars',
        conditions: {
          purchaseConsistency: { $gte: 0.7 },
          accountAge: { $gte: 180 },
          monthlyActive: true
        }
      },
      {
        name: 'Window Shoppers',
        conditions: {
          profileViews: { $gte: 5 },
          purchases: 0,
          activityLevel: ['moderate', 'active']
        }
      },
      {
        name: 'Quick Converters',
        conditions: {
          timeToFirstPurchase: { $lte: 48 }, // hours
          conversionRate: { $gte: 0.5 }
        }
      }
    ];
    
    const segmentsToProcess = segments.length > 0 ? segments : defaultSegments;
    const customSegments = {};
    
    // Process each custom segment
    for (const segment of segmentsToProcess) {
      const query = buildCustomQuery(segment.conditions, creatorId);
      
      const members = await MemberAnalytics.find(query)
        .populate('member', 'username avatar joinDate lastActive');
      
      // Apply additional filtering for complex conditions
      const filteredMembers = await applyComplexFilters(members, segment.conditions);
      
      customSegments[segment.name] = {
        definition: segment,
        members: filteredMembers,
        count: filteredMembers.length,
        statistics: await calculateCustomSegmentStats(filteredMembers, segment),
        value: calculateSegmentValue(filteredMembers),
        opportunity: assessSegmentOpportunity(filteredMembers, segment.name),
        strategies: generateSegmentStrategies(segment.name, filteredMembers),
        priority: determineSegmentPriority(segment.name, filteredMembers)
      };
    }
    
    // Identify members in multiple segments (cross-segment analysis)
    const crossSegmentAnalysis = analyzeCrossSegments(customSegments);
    
    return {
      segmentation: 'custom',
      criteria,
      segments: customSegments,
      crossSegmentAnalysis,
      summary: generateCustomSummary(customSegments),
      recommendations: generateOverallRecommendations(customSegments)
    };
    
  } catch (error) {
    console.error('Create custom segments error:', error);
    throw error;
  }
};

// ============================================
// SEGMENTATION HELPER FUNCTIONS
// ============================================

/**
 * Segment by spending tier
 */
function segmentByTier(members, period) {
  const segments = {
    whales: [],
    vips: [],
    regulars: [],
    casuals: [],
    new: []
  };
  
  members.forEach(member => {
    const tier = member.spending.tier;
    switch (tier) {
      case 'whale':
        segments.whales.push(member);
        break;
      case 'vip':
        segments.vips.push(member);
        break;
      case 'regular':
        segments.regulars.push(member);
        break;
      case 'casual':
        segments.casuals.push(member);
        break;
      default:
        segments.new.push(member);
    }
  });
  
  return segments;
}

/**
 * Segment by spending range
 */
function segmentBySpendingRange(members, period) {
  const segments = {
    'premium_spenders': [], // $500+
    'high_spenders': [],    // $200-499
    'medium_spenders': [],  // $50-199
    'low_spenders': [],     // $10-49
    'minimal_spenders': [], // $1-9
    'non_spenders': []      // $0
  };
  
  const spendingField = period === 'lifetime' ? 'lifetime' : 'last30Days';
  
  members.forEach(member => {
    const amount = member.spending[spendingField];
    
    if (amount >= 500) {
      segments.premium_spenders.push(member);
    } else if (amount >= 200) {
      segments.high_spenders.push(member);
    } else if (amount >= 50) {
      segments.medium_spenders.push(member);
    } else if (amount >= 10) {
      segments.low_spenders.push(member);
    } else if (amount > 0) {
      segments.minimal_spenders.push(member);
    } else {
      segments.non_spenders.push(member);
    }
  });
  
  return segments;
}

/**
 * Segment by spending velocity
 */
function segmentByVelocity(members) {
  const segments = {
    rapid_growth: [],      // >50% increase
    steady_growth: [],     // 10-50% increase
    stable: [],           // -10% to +10%
    declining: [],        // -10% to -50%
    rapid_decline: []     // >50% decrease
  };
  
  members.forEach(member => {
    const velocity = member.spending.velocity;
    const change = velocity.percentageChange || 0;
    
    if (change > 50) {
      segments.rapid_growth.push(member);
    } else if (change > 10) {
      segments.steady_growth.push(member);
    } else if (change >= -10) {
      segments.stable.push(member);
    } else if (change >= -50) {
      segments.declining.push(member);
    } else {
      segments.rapid_decline.push(member);
    }
  });
  
  return segments;
}

/**
 * Segment by lifetime value
 */
function segmentByLifetimeValue(members) {
  const segments = {
    platinum: [],    // $5000+
    gold: [],       // $1000-4999
    silver: [],     // $250-999
    bronze: [],     // $50-249
    entry: []       // <$50
  };
  
  members.forEach(member => {
    const ltv = member.spending.lifetime;
    
    if (ltv >= 5000) {
      segments.platinum.push(member);
    } else if (ltv >= 1000) {
      segments.gold.push(member);
    } else if (ltv >= 250) {
      segments.silver.push(member);
    } else if (ltv >= 50) {
      segments.bronze.push(member);
    } else {
      segments.entry.push(member);
    }
  });
  
  return segments;
}

/**
 * Segment by engagement level
 */
function segmentByEngagementLevel(members, creatorId) {
  const segments = {
    highly_engaged: [],
    engaged: [],
    moderate: [],
    low_engagement: [],
    not_engaged: []
  };
  
  members.forEach(member => {
    const responseRate = member.engagement.messageResponseRate || 0;
    const conversionRate = member.engagement.conversionRate || 0;
    const engagementScore = (responseRate * 0.6) + (conversionRate * 4); // Weighted score
    
    if (engagementScore >= 80) {
      segments.highly_engaged.push(member);
    } else if (engagementScore >= 50) {
      segments.engaged.push(member);
    } else if (engagementScore >= 25) {
      segments.moderate.push(member);
    } else if (engagementScore > 0) {
      segments.low_engagement.push(member);
    } else {
      segments.not_engaged.push(member);
    }
  });
  
  return segments;
}

/**
 * Segment by activity frequency
 */
function segmentByActivityFrequency(members, timeframe) {
  const segments = {
    daily_active: [],
    weekly_active: [],
    monthly_active: [],
    occasionally_active: [],
    inactive: []
  };
  
  const now = new Date();
  
  members.forEach(member => {
    const lastActive = new Date(member.activity.lastActive);
    const daysSinceActive = (now - lastActive) / (1000 * 60 * 60 * 24);
    
    if (daysSinceActive <= 1) {
      segments.daily_active.push(member);
    } else if (daysSinceActive <= 7) {
      segments.weekly_active.push(member);
    } else if (daysSinceActive <= 30) {
      segments.monthly_active.push(member);
    } else if (daysSinceActive <= 90) {
      segments.occasionally_active.push(member);
    } else {
      segments.inactive.push(member);
    }
  });
  
  return segments;
}

/**
 * Segment by last active time
 */
function segmentByLastActiveTime(members) {
  const segments = {
    online_now: [],
    today: [],
    this_week: [],
    this_month: [],
    dormant: []
  };
  
  const now = new Date();
  
  members.forEach(member => {
    const lastActive = new Date(member.activity.lastActive);
    const hoursSinceActive = (now - lastActive) / (1000 * 60 * 60);
    
    if (hoursSinceActive <= 0.25) { // 15 minutes
      segments.online_now.push(member);
    } else if (hoursSinceActive <= 24) {
      segments.today.push(member);
    } else if (hoursSinceActive <= 168) { // 7 days
      segments.this_week.push(member);
    } else if (hoursSinceActive <= 720) { // 30 days
      segments.this_month.push(member);
    } else {
      segments.dormant.push(member);
    }
  });
  
  return segments;
}

/**
 * Segment by activity pattern
 */
function segmentByActivityPattern(members) {
  const segments = {
    morning_users: [],    // 6am-12pm
    afternoon_users: [],  // 12pm-5pm
    evening_users: [],    // 5pm-10pm
    night_users: [],      // 10pm-2am
    irregular: []         // No clear pattern
  };
  
  members.forEach(member => {
    // Analyze hourly activity if available
    if (member.activity.hourlyActivity && member.activity.hourlyActivity.length > 0) {
      const peakHour = getPeakActivityHour(member.activity.hourlyActivity);
      
      if (peakHour >= 6 && peakHour < 12) {
        segments.morning_users.push(member);
      } else if (peakHour >= 12 && peakHour < 17) {
        segments.afternoon_users.push(member);
      } else if (peakHour >= 17 && peakHour < 22) {
        segments.evening_users.push(member);
      } else if (peakHour >= 22 || peakHour < 2) {
        segments.night_users.push(member);
      } else {
        segments.irregular.push(member);
      }
    } else {
      segments.irregular.push(member);
    }
  });
  
  return segments;
}

/**
 * Segment by categories
 */
function segmentByCategories(members, creatorCategories = []) {
  const segments = {};
  
  // Initialize segments for each category
  const allCategories = new Set();
  
  members.forEach(member => {
    member.preferences.topCategories.forEach(cat => {
      allCategories.add(cat.category);
    });
  });
  
  // Create segment for each category
  allCategories.forEach(category => {
    segments[category] = [];
  });
  
  // Add "matched" segment if creator categories provided
  if (creatorCategories.length > 0) {
    segments['matched_preferences'] = [];
    segments['unmatched_preferences'] = [];
  }
  
  // Assign members to segments
  members.forEach(member => {
    const memberCategories = member.preferences.topCategories.map(c => c.category);
    
    // Add to category segments
    memberCategories.forEach(category => {
      if (segments[category]) {
        segments[category].push(member);
      }
    });
    
    // Check creator match
    if (creatorCategories.length > 0) {
      const hasMatch = memberCategories.some(cat => 
        creatorCategories.includes(cat)
      );
      
      if (hasMatch) {
        segments['matched_preferences'].push(member);
      } else {
        segments['unmatched_preferences'].push(member);
      }
    }
  });
  
  return segments;
}

/**
 * Segment by content types
 */
function segmentByContentTypes(members) {
  const segments = {
    photos: [],
    videos: [],
    live_streams: [],
    messages: [],
    audio: [],
    mixed_content: []
  };
  
  members.forEach(member => {
    const contentTypes = member.preferences.contentTypes.map(c => c.type);
    
    if (contentTypes.length > 2) {
      segments.mixed_content.push(member);
    } else {
      contentTypes.forEach(type => {
        if (segments[type]) {
          segments[type].push(member);
        }
      });
    }
  });
  
  return segments;
}

/**
 * Segment by price preference
 */
function segmentByPricePreference(members) {
  const segments = {
    premium_buyers: [],    // Avg purchase >$50
    standard_buyers: [],   // Avg purchase $20-50
    value_buyers: [],      // Avg purchase $10-20
    budget_buyers: [],     // Avg purchase <$10
    free_only: []         // No purchases
  };
  
  members.forEach(member => {
    const avgPurchase = member.spending.averagePurchase || 0;
    
    if (avgPurchase >= 50) {
      segments.premium_buyers.push(member);
    } else if (avgPurchase >= 20) {
      segments.standard_buyers.push(member);
    } else if (avgPurchase >= 10) {
      segments.value_buyers.push(member);
    } else if (avgPurchase > 0) {
      segments.budget_buyers.push(member);
    } else {
      segments.free_only.push(member);
    }
  });
  
  return segments;
}

/**
 * Segment by combined preferences
 */
function segmentByCombinedPreferences(members, creatorCategories) {
  const segments = {
    perfect_match: [],     // Category + price + content type match
    good_match: [],       // 2 out of 3 match
    partial_match: [],    // 1 out of 3 match
    no_match: []         // No matches
  };
  
  members.forEach(member => {
    let matchScore = 0;
    
    // Check category match
    if (creatorCategories.length > 0) {
      const memberCategories = member.preferences.topCategories.map(c => c.category);
      if (memberCategories.some(cat => creatorCategories.includes(cat))) {
        matchScore++;
      }
    }
    
    // Check price range match (assuming creator avg price)
    // This would need actual creator pricing data
    matchScore++; // Placeholder
    
    // Check content type match
    // This would need actual creator content types
    matchScore++; // Placeholder
    
    if (matchScore === 3) {
      segments.perfect_match.push(member);
    } else if (matchScore === 2) {
      segments.good_match.push(member);
    } else if (matchScore === 1) {
      segments.partial_match.push(member);
    } else {
      segments.no_match.push(member);
    }
  });
  
  return segments;
}

// ============================================
// STATISTICS AND ANALYSIS FUNCTIONS
// ============================================

/**
 * Calculate segment statistics
 */
function calculateSegmentStatistics(members, period) {
  if (members.length === 0) {
    return {
      avgSpending: 0,
      totalSpending: 0,
      avgLifetimeValue: 0,
      avgPurchases: 0
    };
  }
  
  const spendingField = period === 'lifetime' ? 'lifetime' : 'last30Days';
  
  const totalSpending = members.reduce((sum, m) => 
    sum + m.spending[spendingField], 0
  );
  
  const totalLifetime = members.reduce((sum, m) => 
    sum + m.spending.lifetime, 0
  );
  
  const totalPurchases = members.reduce((sum, m) => 
    sum + m.metadata.totalPurchases, 0
  );
  
  return {
    avgSpending: totalSpending / members.length,
    totalSpending,
    avgLifetimeValue: totalLifetime / members.length,
    avgPurchases: totalPurchases / members.length,
    medianSpending: calculateMedian(members.map(m => m.spending[spendingField]))
  };
}

/**
 * Calculate activity statistics
 */
function calculateActivityStatistics(members, timeframe) {
  if (members.length === 0) {
    return {
      avgDaysSinceActive: 0,
      activeRate: 0,
      avgSessionsPerMonth: 0
    };
  }
  
  const now = new Date();
  const totalDaysSinceActive = members.reduce((sum, m) => {
    const lastActive = new Date(m.activity.lastActive);
    return sum + ((now - lastActive) / (1000 * 60 * 60 * 24));
  }, 0);
  
  const activeWithinTimeframe = members.filter(m => {
    const lastActive = new Date(m.activity.lastActive);
    const daysSince = (now - lastActive) / (1000 * 60 * 60 * 24);
    return daysSince <= timeframe;
  }).length;
  
  const totalSessions = members.reduce((sum, m) => 
    sum + (m.activity.sessionsThisMonth || 0), 0
  );
  
  return {
    avgDaysSinceActive: totalDaysSinceActive / members.length,
    activeRate: (activeWithinTimeframe / members.length) * 100,
    avgSessionsPerMonth: totalSessions / members.length
  };
}

/**
 * Build custom query from conditions
 */
function buildCustomQuery(conditions, creatorId) {
  let query = {
    'privacy.discoverable': true
  };
  
  if (creatorId) {
    query['privacy.blockedCreators'] = { $ne: creatorId };
  }
  
  // Process each condition
  if (conditions.spendingTier) {
    query['spending.tier'] = Array.isArray(conditions.spendingTier) ? 
      { $in: conditions.spendingTier } : conditions.spendingTier;
  }
  
  if (conditions.activityLevel) {
    query['activity.level'] = Array.isArray(conditions.activityLevel) ? 
      { $in: conditions.activityLevel } : conditions.activityLevel;
  }
  
  if (conditions.churnRisk) {
    query['scoring.churnRisk.level'] = Array.isArray(conditions.churnRisk) ? 
      { $in: conditions.churnRisk } : conditions.churnRisk;
  }
  
  if (conditions.spendingVelocity) {
    query['spending.velocity.trend'] = conditions.spendingVelocity;
  }
  
  if (conditions.lastActiveWithin) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - conditions.lastActiveWithin);
    query['activity.lastActive'] = { $gte: cutoffDate };
  }
  
  if (conditions.joinedWithin) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - conditions.joinedWithin);
    query['metadata.joinDate'] = { $gte: cutoffDate };
  }
  
  if (conditions.minimumPurchases) {
    query['metadata.totalPurchases'] = { $gte: conditions.minimumPurchases };
  }
  
  if (conditions.lifetimeSpend) {
    if (typeof conditions.lifetimeSpend === 'object') {
      query['spending.lifetime'] = conditions.lifetimeSpend;
    } else {
      query['spending.lifetime'] = { $gte: conditions.lifetimeSpend };
    }
  }
  
  return query;
}

/**
 * Apply complex filters that can't be done in MongoDB query
 */
async function applyComplexFilters(members, conditions) {
  let filtered = [...members];
  
  // Filter by purchase consistency
  if (conditions.purchaseConsistency) {
    filtered = filtered.filter(m => 
      m.metadata.purchaseConsistency >= conditions.purchaseConsistency
    );
  }
  
  // Filter by account age
  if (conditions.accountAge) {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - conditions.accountAge);
    filtered = filtered.filter(m => 
      new Date(m.metadata.joinDate) <= minDate
    );
  }
  
  // Filter by monthly active
  if (conditions.monthlyActive) {
    filtered = filtered.filter(m => 
      m.activity.level === 'active' || m.activity.level === 'very-active'
    );
  }
  
  // Filter by time to first purchase
  if (conditions.timeToFirstPurchase) {
    // This would require additional data
    // Placeholder implementation
  }
  
  // Filter by conversion rate
  if (conditions.conversionRate) {
    filtered = filtered.filter(m => 
      m.engagement.conversionRate >= conditions.conversionRate
    );
  }
  
  return filtered;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate median value
 */
function calculateMedian(values) {
  if (values.length === 0) return 0;
  
  const sorted = values.sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
}

/**
 * Get peak activity hour
 */
function getPeakActivityHour(hourlyActivity) {
  if (!hourlyActivity || hourlyActivity.length === 0) return 0;
  
  let maxActivity = 0;
  let peakHour = 0;
  
  hourlyActivity.forEach((activity, hour) => {
    if (activity > maxActivity) {
      maxActivity = activity;
      peakHour = hour;
    }
  });
  
  return peakHour;
}

/**
 * Get segment characteristics
 */
function getSegmentCharacteristics(segmentName, members) {
  const characteristics = [];
  
  if (segmentName.includes('whale') || segmentName.includes('premium')) {
    characteristics.push('High spending power');
    characteristics.push('VIP treatment expected');
  }
  
  if (segmentName.includes('active')) {
    characteristics.push('Highly engaged');
    characteristics.push('Frequent platform use');
  }
  
  if (segmentName.includes('new')) {
    characteristics.push('Recently joined');
    characteristics.push('Exploring platform');
  }
  
  if (segmentName.includes('declining')) {
    characteristics.push('Decreasing engagement');
    characteristics.push('Risk of churn');
  }
  
  return characteristics;
}

/**
 * Get segment recommendations
 */
function getSegmentRecommendations(segmentName, members) {
  const recommendations = [];
  
  if (segmentName === 'whales' || segmentName === 'premium_spenders') {
    recommendations.push('Provide VIP treatment and exclusive perks');
    recommendations.push('Offer personalized content bundles');
    recommendations.push('Assign dedicated support');
  } else if (segmentName === 'rising_stars' || segmentName === 'rapid_growth') {
    recommendations.push('Nurture with special attention');
    recommendations.push('Offer loyalty rewards');
    recommendations.push('Encourage continued engagement');
  } else if (segmentName === 'at_risk' || segmentName === 'declining') {
    recommendations.push('Launch re-engagement campaign');
    recommendations.push('Send win-back offers');
    recommendations.push('Investigate dissatisfaction reasons');
  } else if (segmentName === 'dormant' || segmentName === 'inactive') {
    recommendations.push('Send reactivation incentives');
    recommendations.push('Highlight new content/features');
    recommendations.push('Offer comeback discount');
  } else {
    recommendations.push('Maintain regular engagement');
    recommendations.push('Provide value-driven content');
    recommendations.push('Monitor for changes');
  }
  
  return recommendations;
}

/**
 * Generate summary statistics
 */
function generateSpendingSummary(segments) {
  const totalMembers = Object.values(segments).reduce((sum, segment) => 
    sum + segment.count, 0
  );
  
  const totalValue = Object.values(segments).reduce((sum, segment) => 
    sum + segment.statistics.totalSpending, 0
  );
  
  return {
    totalMembers,
    totalSegments: Object.keys(segments).length,
    totalValue,
    largestSegment: Object.entries(segments)
      .sort((a, b) => b[1].count - a[1].count)[0]?.[0],
    highestValueSegment: Object.entries(segments)
      .sort((a, b) => b[1].statistics.totalSpending - a[1].statistics.totalSpending)[0]?.[0]
  };
}

/**
 * Additional summary generators
 */
function generateActivitySummary(segments) {
  return generateSpendingSummary(segments);
}

function generatePreferenceSummary(segments) {
  return generateSpendingSummary(segments);
}

function generateCustomSummary(segments) {
  return generateSpendingSummary(segments);
}

/**
 * Analyze segment behavior
 */
function analyzeSegmentBehavior(members) {
  return {
    avgResponseRate: members.reduce((sum, m) => 
      sum + m.engagement.messageResponseRate, 0) / members.length,
    avgConversionRate: members.reduce((sum, m) => 
      sum + m.engagement.conversionRate, 0) / members.length
  };
}

/**
 * Calculate engagement metrics
 */
async function calculateEngagementMetrics(members, creatorId) {
  // This would calculate actual engagement with the specific creator
  return {
    totalInteractions: 0, // Placeholder
    avgResponseTime: 0,
    conversionRate: 0
  };
}

/**
 * Get activity recommendations
 */
function getActivityRecommendations(segmentName, members) {
  return getSegmentRecommendations(segmentName, members);
}

/**
 * Analyze segment preferences
 */
function analyzeSegmentPreferences(members) {
  const categories = {};
  const contentTypes = {};
  
  members.forEach(member => {
    member.preferences.topCategories.forEach(cat => {
      categories[cat.category] = (categories[cat.category] || 0) + 1;
    });
    
    member.preferences.contentTypes.forEach(type => {
      contentTypes[type.type] = (contentTypes[type.type] || 0) + 1;
    });
  });
  
  return {
    topCategories: Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
    topContentTypes: Object.entries(contentTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
  };
}

/**
 * Calculate purchasing patterns
 */
function calculatePurchasingPatterns(members) {
  return {
    avgPurchaseFrequency: members.reduce((sum, m) => 
      sum + m.metadata.totalPurchases, 0) / members.length,
    avgPurchaseValue: members.reduce((sum, m) => 
      sum + m.spending.averagePurchase, 0) / members.length
  };
}

/**
 * Calculate creator compatibility
 */
function calculateCreatorCompatibility(members, creatorCategories) {
  if (creatorCategories.length === 0) return null;
  
  let matchCount = 0;
  
  members.forEach(member => {
    const memberCategories = member.preferences.topCategories.map(c => c.category);
    if (memberCategories.some(cat => creatorCategories.includes(cat))) {
      matchCount++;
    }
  });
  
  return {
    matchRate: (matchCount / members.length) * 100,
    matchedMembers: matchCount
  };
}

/**
 * Get preference recommendations
 */
function getPreferenceRecommendations(segmentName, members) {
  return getSegmentRecommendations(segmentName, members);
}

/**
 * Calculate custom segment statistics
 */
async function calculateCustomSegmentStats(members, segment) {
  return calculateSegmentStatistics(members, 'last30Days');
}

/**
 * Calculate segment value
 */
function calculateSegmentValue(members) {
  const totalSpending = members.reduce((sum, m) => 
    sum + m.spending.last30Days, 0
  );
  
  const totalLifetime = members.reduce((sum, m) => 
    sum + m.spending.lifetime, 0
  );
  
  return {
    monthlyValue: totalSpending,
    lifetimeValue: totalLifetime,
    avgMemberValue: totalSpending / members.length
  };
}

/**
 * Assess segment opportunity
 */
function assessSegmentOpportunity(members, segmentName) {
  const growthPotential = members.filter(m => 
    m.spending.velocity.trend === 'increasing'
  ).length / members.length;
  
  const engagementPotential = members.reduce((sum, m) => 
    sum + m.engagement.messageResponseRate, 0) / members.length / 100;
  
  return {
    opportunityScore: (growthPotential + engagementPotential) / 2 * 100,
    growthPotential: growthPotential * 100,
    engagementPotential: engagementPotential * 100
  };
}

/**
 * Generate segment strategies
 */
function generateSegmentStrategies(segmentName, members) {
  return getSegmentRecommendations(segmentName, members);
}

/**
 * Determine segment priority
 */
function determineSegmentPriority(segmentName, members) {
  if (segmentName.includes('High-Value') || segmentName.includes('VIP')) {
    return 'critical';
  }
  
  if (segmentName.includes('Risk') || segmentName.includes('Declining')) {
    return 'high';
  }
  
  if (segmentName.includes('Rising') || segmentName.includes('Potential')) {
    return 'medium';
  }
  
  return 'normal';
}

/**
 * Analyze cross segments
 */
function analyzeCrossSegments(segments) {
  const memberSegmentMap = {};
  
  // Map each member to their segments
  Object.entries(segments).forEach(([segmentName, segmentData]) => {
    segmentData.members.forEach(member => {
      const memberId = member.member._id.toString();
      if (!memberSegmentMap[memberId]) {
        memberSegmentMap[memberId] = [];
      }
      memberSegmentMap[memberId].push(segmentName);
    });
  });
  
  // Find members in multiple segments
  const multiSegmentMembers = Object.entries(memberSegmentMap)
    .filter(([id, segments]) => segments.length > 1)
    .map(([id, segments]) => ({
      memberId: id,
      segments,
      segmentCount: segments.length
    }));
  
  return {
    multiSegmentMembers,
    avgSegmentsPerMember: Object.values(memberSegmentMap)
      .reduce((sum, segments) => sum + segments.length, 0) / 
      Object.keys(memberSegmentMap).length
  };
}

/**
 * Generate overall recommendations
 */
function generateOverallRecommendations(segments) {
  const recommendations = [];
  
  // Prioritize high-value segments
  const highValueSegments = Object.entries(segments)
    .filter(([name, data]) => data.priority === 'critical' || data.priority === 'high')
    .sort((a, b) => b[1].value.monthlyValue - a[1].value.monthlyValue);
  
  if (highValueSegments.length > 0) {
    recommendations.push({
      priority: 'immediate',
      segment: highValueSegments[0][0],
      action: 'Focus immediate attention on this high-value segment',
      expectedImpact: 'high'
    });
  }
  
  // Identify growth opportunities
  const growthSegments = Object.entries(segments)
    .filter(([name, data]) => data.opportunity.opportunityScore > 70)
    .sort((a, b) => b[1].opportunity.opportunityScore - a[1].opportunity.opportunityScore);
  
  if (growthSegments.length > 0) {
    recommendations.push({
      priority: 'high',
      segment: growthSegments[0][0],
      action: 'Capitalize on growth opportunity in this segment',
      expectedImpact: 'medium-high'
    });
  }
  
  return recommendations;
}

module.exports = exports;