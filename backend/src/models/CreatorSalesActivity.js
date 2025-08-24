// backend/src/models/CreatorSalesActivity.js
// MongoDB model for tracking creator sales activities, performance, and goals

const mongoose = require('mongoose');

const creatorSalesActivitySchema = new mongoose.Schema({
  // ============================================
  // CORE RELATIONSHIP
  // ============================================
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creator',
    required: true,
    unique: true,
    index: true
  },
  
  // ============================================
  // DAILY ACTIVITY TRACKING
  // ============================================
  dailyActivity: {
    date: {
      type: Date,
      default: () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
      },
      index: true
    },
    
    // Interaction counts
    interactions: {
      profileViews: {
        type: Number,
        default: 0,
        min: 0
      },
      pokes: {
        type: Number,
        default: 0,
        min: 0
      },
      likes: {
        type: Number,
        default: 0,
        min: 0
      },
      messages: {
        type: Number,
        default: 0,
        min: 0
      },
      specialOffers: {
        type: Number,
        default: 0,
        min: 0
      },
      totalInteractions: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    
    // Response metrics
    responses: {
      received: {
        type: Number,
        default: 0,
        min: 0
      },
      positive: {
        type: Number,
        default: 0,
        min: 0
      },
      negative: {
        type: Number,
        default: 0,
        min: 0
      },
      responseRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      }
    },
    
    // Conversion metrics
    conversions: {
      leads: {
        type: Number,
        default: 0,
        min: 0
      },
      sales: {
        type: Number,
        default: 0,
        min: 0
      },
      revenue: {
        type: Number,
        default: 0,
        min: 0
      },
      conversionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      }
    },
    
    // Time tracking
    timeSpent: {
      prospecting: {
        type: Number, // minutes
        default: 0,
        min: 0
      },
      messaging: {
        type: Number,
        default: 0,
        min: 0
      },
      offerCreation: {
        type: Number,
        default: 0,
        min: 0
      },
      followUp: {
        type: Number,
        default: 0,
        min: 0
      },
      total: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    
    // Member segments engaged
    segmentsEngaged: {
      whales: {
        type: Number,
        default: 0,
        min: 0
      },
      vips: {
        type: Number,
        default: 0,
        min: 0
      },
      regular: {
        type: Number,
        default: 0,
        min: 0
      },
      new: {
        type: Number,
        default: 0,
        min: 0
      },
      returning: {
        type: Number,
        default: 0,
        min: 0
      },
      atRisk: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  
  // ============================================
  // WEEKLY AGGREGATES
  // ============================================
  weeklyStats: {
    weekNumber: {
      type: Number,
      min: 1,
      max: 53
    },
    year: Number,
    startDate: Date,
    endDate: Date,
    
    totals: {
      interactions: {
        type: Number,
        default: 0,
        min: 0
      },
      responses: {
        type: Number,
        default: 0,
        min: 0
      },
      conversions: {
        type: Number,
        default: 0,
        min: 0
      },
      revenue: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    
    averages: {
      dailyInteractions: Number,
      responseRate: Number,
      conversionRate: Number,
      revenuePerDay: Number,
      revenuePerSale: Number
    },
    
    // Best performing day
    bestDay: {
      date: Date,
      revenue: Number,
      conversions: Number
    },
    
    // Growth metrics
    growth: {
      revenueGrowth: Number, // % vs previous week
      conversionGrowth: Number,
      interactionGrowth: Number
    }
  },
  
  // ============================================
  // MONTHLY PERFORMANCE
  // ============================================
  monthlyStats: {
    month: {
      type: Number,
      min: 1,
      max: 12
    },
    year: Number,
    
    totals: {
      interactions: {
        type: Number,
        default: 0,
        min: 0
      },
      uniqueMembersEngaged: {
        type: Number,
        default: 0,
        min: 0
      },
      conversions: {
        type: Number,
        default: 0,
        min: 0
      },
      revenue: {
        type: Number,
        default: 0,
        min: 0
      },
      offersCreated: {
        type: Number,
        default: 0,
        min: 0
      },
      offerRedemptions: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    
    // Member lifecycle
    memberLifecycle: {
      newMembers: {
        type: Number,
        default: 0,
        min: 0
      },
      returningMembers: {
        type: Number,
        default: 0,
        min: 0
      },
      lostMembers: {
        type: Number,
        default: 0,
        min: 0
      },
      winBackMembers: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    
    // Top performers
    topPerformers: {
      bestOffer: {
        offerId: mongoose.Schema.Types.ObjectId,
        name: String,
        conversionRate: Number,
        revenue: Number
      },
      bestMessage: {
        template: String,
        responseRate: Number
      },
      bestTimeslot: {
        dayOfWeek: Number,
        hour: Number,
        conversionRate: Number
      },
      mostValuableMember: {
        memberId: mongoose.Schema.Types.ObjectId,
        revenue: Number,
        purchases: Number
      }
    }
  },
  
  // ============================================
  // GOALS & TARGETS
  // ============================================
  goals: {
    daily: {
      interactions: {
        target: {
          type: Number,
          default: 50,
          min: 0
        },
        achieved: {
          type: Number,
          default: 0,
          min: 0
        },
        percentage: {
          type: Number,
          default: 0,
          min: 0,
          max: 100
        }
      },
      conversions: {
        target: {
          type: Number,
          default: 5,
          min: 0
        },
        achieved: {
          type: Number,
          default: 0,
          min: 0
        },
        percentage: {
          type: Number,
          default: 0,
          min: 0,
          max: 100
        }
      },
      revenue: {
        target: {
          type: Number,
          default: 200,
          min: 0
        },
        achieved: {
          type: Number,
          default: 0,
          min: 0
        },
        percentage: {
          type: Number,
          default: 0,
          min: 0,
          max: 100
        }
      }
    },
    
    weekly: {
      interactions: {
        target: {
          type: Number,
          default: 300,
          min: 0
        },
        achieved: {
          type: Number,
          default: 0,
          min: 0
        }
      },
      conversions: {
        target: {
          type: Number,
          default: 30,
          min: 0
        },
        achieved: {
          type: Number,
          default: 0,
          min: 0
        }
      },
      revenue: {
        target: {
          type: Number,
          default: 1500,
          min: 0
        },
        achieved: {
          type: Number,
          default: 0,
          min: 0
        }
      }
    },
    
    monthly: {
      revenue: {
        target: {
          type: Number,
          default: 6000,
          min: 0
        },
        achieved: {
          type: Number,
          default: 0,
          min: 0
        }
      },
      newMembers: {
        target: {
          type: Number,
          default: 100,
          min: 0
        },
        achieved: {
          type: Number,
          default: 0,
          min: 0
        }
      }
    },
    
    // Custom goals
    custom: [{
      name: String,
      description: String,
      metric: String,
      target: Number,
      achieved: Number,
      deadline: Date,
      completed: {
        type: Boolean,
        default: false
      }
    }]
  },
  
  // ============================================
  // SALES FUNNEL METRICS
  // ============================================
  funnel: {
    stages: {
      awareness: {
        count: {
          type: Number,
          default: 0,
          min: 0
        }, // Profile views
        description: {
          type: String,
          default: 'Members who viewed profile'
        }
      },
      interest: {
        count: {
          type: Number,
          default: 0,
          min: 0
        }, // Responded to outreach
        description: {
          type: String,
          default: 'Members who responded'
        }
      },
      consideration: {
        count: {
          type: Number,
          default: 0,
          min: 0
        }, // Viewed offers
        description: {
          type: String,
          default: 'Members who viewed offers'
        }
      },
      intent: {
        count: {
          type: Number,
          default: 0,
          min: 0
        }, // Added to cart
        description: {
          type: String,
          default: 'Members who showed purchase intent'
        }
      },
      purchase: {
        count: {
          type: Number,
          default: 0,
          min: 0
        }, // Completed purchase
        description: {
          type: String,
          default: 'Members who purchased'
        }
      },
      loyalty: {
        count: {
          type: Number,
          default: 0,
          min: 0
        }, // Repeat purchase
        description: {
          type: String,
          default: 'Members who purchased again'
        }
      }
    },
    
    // Conversion rates between stages
    conversionRates: {
      awareToInterest: Number,
      interestToConsideration: Number,
      considerationToIntent: Number,
      intentToPurchase: Number,
      purchaseToLoyalty: Number,
      overallConversion: Number
    },
    
    // Drop-off analysis
    dropOffPoints: [{
      stage: String,
      count: Number,
      percentage: Number,
      commonReasons: [String]
    }]
  },
  
  // ============================================
  // ACTIVITY PATTERNS
  // ============================================
  patterns: {
    // Best performing times
    optimalTimes: {
      messaging: [{
        dayOfWeek: Number, // 0-6
        hour: Number, // 0-23
        responseRate: Number
      }],
      offers: [{
        dayOfWeek: Number,
        hour: Number,
        conversionRate: Number
      }]
    },
    
    // Successful strategies
    winningStrategies: [{
      strategy: String,
      description: String,
      successRate: Number,
      usageCount: Number,
      totalRevenue: Number,
      examples: [String]
    }],
    
    // Message templates performance
    messageTemplates: [{
      templateId: String,
      category: String,
      useCount: Number,
      responseRate: Number,
      conversionRate: Number,
      lastUsed: Date
    }],
    
    // Offer types performance
    offerPerformance: [{
      offerType: String,
      useCount: Number,
      avgDiscount: Number,
      conversionRate: Number,
      avgRevenue: Number
    }]
  },
  
  // ============================================
  // LEADERBOARD & RANKINGS
  // ============================================
  rankings: {
    // Global rankings
    global: {
      revenue: {
        rank: Number,
        percentile: Number,
        total: Number
      },
      conversions: {
        rank: Number,
        percentile: Number,
        total: Number
      },
      responseRate: {
        rank: Number,
        percentile: Number,
        rate: Number
      }
    },
    
    // Category rankings
    category: {
      name: String,
      revenue: {
        rank: Number,
        total: Number
      },
      conversions: {
        rank: Number,
        total: Number
      }
    },
    
    // Achievements
    achievements: [{
      type: String,
      name: String,
      description: String,
      unlockedAt: Date,
      reward: mongoose.Schema.Types.Mixed
    }],
    
    // Streaks
    streaks: {
      currentDaily: {
        type: Number,
        default: 0,
        min: 0
      },
      longestDaily: {
        type: Number,
        default: 0,
        min: 0
      },
      currentWeekly: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  
  // ============================================
  // COACHING & RECOMMENDATIONS
  // ============================================
  coaching: {
    // Performance score
    performanceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    
    // Areas for improvement
    improvements: [{
      area: String,
      currentScore: Number,
      targetScore: Number,
      suggestions: [String],
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }],
    
    // Recommended actions
    recommendations: [{
      type: {
        type: String,
        enum: ['strategy', 'timing', 'messaging', 'targeting', 'offer']
      },
      title: String,
      description: String,
      expectedImpact: String,
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
      },
      completed: {
        type: Boolean,
        default: false
      }
    }],
    
    // Tips based on performance
    tips: [{
      category: String,
      tip: String,
      relevanceScore: Number,
      shown: {
        type: Boolean,
        default: false
      },
      helpful: Boolean
    }]
  },
  
  // ============================================
  // LIMITS & QUOTAS
  // ============================================
  limits: {
    daily: {
      messages: {
        limit: {
          type: Number,
          default: 100
        },
        used: {
          type: Number,
          default: 0,
          min: 0
        },
        resetAt: Date
      },
      pokes: {
        limit: {
          type: Number,
          default: 50
        },
        used: {
          type: Number,
          default: 0,
          min: 0
        }
      },
      offers: {
        limit: {
          type: Number,
          default: 10
        },
        used: {
          type: Number,
          default: 0,
          min: 0
        }
      }
    },
    
    // Rate limiting
    rateLimits: {
      messagesPerHour: {
        limit: {
          type: Number,
          default: 20
        },
        windowStart: Date,
        count: {
          type: Number,
          default: 0
        }
      }
    },
    
    // Subscription tier limits
    tierLimits: {
      tier: {
        type: String,
        enum: ['basic', 'pro', 'premium', 'enterprise'],
        default: 'basic'
      },
      features: {
        bulkMessaging: {
          type: Boolean,
          default: false
        },
        advancedAnalytics: {
          type: Boolean,
          default: false
        },
        automatedCampaigns: {
          type: Boolean,
          default: false
        },
        apiAccess: {
          type: Boolean,
          default: false
        }
      }
    }
  },
  
  // ============================================
  // METADATA
  // ============================================
  metadata: {
    lastActivityAt: {
      type: Date,
      default: Date.now
    },
    lastSaleAt: Date,
    totalDaysActive: {
      type: Number,
      default: 0,
      min: 0
    },
    accountAge: {
      type: Number, // days
      default: 0,
      min: 0
    },
    lastCalculatedAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  collection: 'creator_sales_activities'
});

// ============================================
// INDEXES
// ============================================

// Compound indexes for queries
creatorSalesActivitySchema.index({ creator: 1, 'dailyActivity.date': -1 });
creatorSalesActivitySchema.index({ creator: 1, 'monthlyStats.year': -1, 'monthlyStats.month': -1 });
creatorSalesActivitySchema.index({ 'rankings.global.revenue.rank': 1 });
creatorSalesActivitySchema.index({ 'coaching.performanceScore': -1 });

// ============================================
// METHODS
// ============================================

// Record interaction
creatorSalesActivitySchema.methods.recordInteraction = async function(type, memberId, memberSegment) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Update daily activity
  if (this.dailyActivity.date.getTime() !== today.getTime()) {
    // Reset for new day
    this.dailyActivity = {
      date: today,
      interactions: {},
      responses: {},
      conversions: {},
      timeSpent: {},
      segmentsEngaged: {}
    };
  }
  
  // Increment interaction count
  this.dailyActivity.interactions[type] = (this.dailyActivity.interactions[type] || 0) + 1;
  this.dailyActivity.interactions.totalInteractions += 1;
  
  // Track segment engagement
  if (memberSegment) {
    this.dailyActivity.segmentsEngaged[memberSegment] = 
      (this.dailyActivity.segmentsEngaged[memberSegment] || 0) + 1;
  }
  
  // Update limits
  if (type === 'messages') {
    this.limits.daily.messages.used += 1;
    this.limits.rateLimits.messagesPerHour.count += 1;
  } else if (type === 'pokes') {
    this.limits.daily.pokes.used += 1;
  } else if (type === 'specialOffers') {
    this.limits.daily.offers.used += 1;
  }
  
  // Update funnel
  this.funnel.stages.awareness.count += 1;
  
  this.metadata.lastActivityAt = new Date();
  
  return this.save();
};

// Record conversion
creatorSalesActivitySchema.methods.recordConversion = async function(revenue, memberId) {
  // Update daily conversions
  this.dailyActivity.conversions.sales += 1;
  this.dailyActivity.conversions.revenue += revenue;
  this.dailyActivity.conversions.conversionRate = 
    (this.dailyActivity.conversions.sales / this.dailyActivity.interactions.totalInteractions) * 100;
  
  // Update goals
  this.goals.daily.conversions.achieved += 1;
  this.goals.daily.revenue.achieved += revenue;
  this.goals.weekly.conversions.achieved += 1;
  this.goals.weekly.revenue.achieved += revenue;
  this.goals.monthly.revenue.achieved += revenue;
  
  // Update funnel
  this.funnel.stages.purchase.count += 1;
  
  // Update metadata
  this.metadata.lastSaleAt = new Date();
  
  // Calculate goal percentages
  this.goals.daily.conversions.percentage = 
    (this.goals.daily.conversions.achieved / this.goals.daily.conversions.target) * 100;
  this.goals.daily.revenue.percentage = 
    (this.goals.daily.revenue.achieved / this.goals.daily.revenue.target) * 100;
  
  return this.save();
};

// Calculate performance score
creatorSalesActivitySchema.methods.calculatePerformanceScore = function() {
  let score = 0;
  
  // Goal achievement (40%)
  const goalScore = (
    this.goals.daily.revenue.percentage * 0.2 +
    this.goals.daily.conversions.percentage * 0.2
  );
  score += Math.min(40, goalScore);
  
  // Conversion rate (30%)
  const conversionScore = Math.min(30, this.dailyActivity.conversions.conversionRate * 3);
  score += conversionScore;
  
  // Response rate (20%)
  const responseScore = Math.min(20, this.dailyActivity.responses.responseRate * 0.2);
  score += responseScore;
  
  // Activity level (10%)
  const activityScore = Math.min(10, (this.dailyActivity.interactions.totalInteractions / 50) * 10);
  score += activityScore;
  
  this.coaching.performanceScore = Math.round(score);
  
  return this.coaching.performanceScore;
};

// Update funnel conversion rates
creatorSalesActivitySchema.methods.updateFunnelRates = function() {
  const stages = this.funnel.stages;
  
  if (stages.awareness.count > 0) {
    this.funnel.conversionRates.awareToInterest = 
      (stages.interest.count / stages.awareness.count) * 100;
  }
  
  if (stages.interest.count > 0) {
    this.funnel.conversionRates.interestToConsideration = 
      (stages.consideration.count / stages.interest.count) * 100;
  }
  
  if (stages.consideration.count > 0) {
    this.funnel.conversionRates.considerationToIntent = 
      (stages.intent.count / stages.consideration.count) * 100;
  }
  
  if (stages.intent.count > 0) {
    this.funnel.conversionRates.intentToPurchase = 
      (stages.purchase.count / stages.intent.count) * 100;
  }
  
  if (stages.purchase.count > 0) {
    this.funnel.conversionRates.purchaseToLoyalty = 
      (stages.loyalty.count / stages.purchase.count) * 100;
  }
  
  if (stages.awareness.count > 0) {
    this.funnel.conversionRates.overallConversion = 
      (stages.purchase.count / stages.awareness.count) * 100;
  }
};

// Add achievement
creatorSalesActivitySchema.methods.unlockAchievement = function(type, name, description) {
  const achievement = {
    type,
    name,
    description,
    unlockedAt: new Date()
  };
  
  // Check if already unlocked
  const exists = this.rankings.achievements.find(a => a.name === name);
  if (!exists) {
    this.rankings.achievements.push(achievement);
  }
  
  return achievement;
};

// Check and unlock achievements
creatorSalesActivitySchema.methods.checkAchievements = function() {
  const achievements = [];
  
  // First sale
  if (this.dailyActivity.conversions.sales === 1 && 
      !this.rankings.achievements.find(a => a.name === 'First Sale')) {
    achievements.push(this.unlockAchievement('milestone', 'First Sale', 'Made your first sale!'));
  }
  
  // Daily goal
  if (this.goals.daily.revenue.percentage >= 100 && 
      !this.rankings.achievements.find(a => a.name === 'Daily Champion')) {
    achievements.push(this.unlockAchievement('goal', 'Daily Champion', 'Hit your daily revenue goal!'));
  }
  
  // Whale hunter
  if (this.dailyActivity.segmentsEngaged.whales >= 5 && 
      !this.rankings.achievements.find(a => a.name === 'Whale Hunter')) {
    achievements.push(this.unlockAchievement('engagement', 'Whale Hunter', 'Engaged with 5 whale members!'));
  }
  
  // Conversion master
  if (this.dailyActivity.conversions.conversionRate >= 20 && 
      !this.rankings.achievements.find(a => a.name === 'Conversion Master')) {
    achievements.push(this.unlockAchievement('performance', 'Conversion Master', '20% conversion rate!'));
  }
  
  // Streak achievements
  if (this.rankings.streaks.currentDaily >= 7 && 
      !this.rankings.achievements.find(a => a.name === 'Week Warrior')) {
    achievements.push(this.unlockAchievement('streak', 'Week Warrior', '7 day activity streak!'));
  }
  
  return achievements;
};

// ============================================
// STATICS
// ============================================

// Get top performers
creatorSalesActivitySchema.statics.getTopPerformers = async function(limit = 10, timeframe = 'daily') {
  const sortField = timeframe === 'daily' 
    ? 'dailyActivity.conversions.revenue'
    : timeframe === 'weekly'
    ? 'weeklyStats.totals.revenue'
    : 'monthlyStats.totals.revenue';
  
  return this.find({})
    .populate('creator', 'username profileImage')
    .sort(`-${sortField}`)
    .limit(limit);
};

// Get creator's rank
creatorSalesActivitySchema.statics.getCreatorRank = async function(creatorId, metric = 'revenue') {
  const sortField = metric === 'revenue'
    ? 'monthlyStats.totals.revenue'
    : metric === 'conversions'
    ? 'monthlyStats.totals.conversions'
    : 'dailyActivity.responses.responseRate';
  
  const allCreators = await this.find({})
    .sort(`-${sortField}`)
    .select('creator');
  
  const rank = allCreators.findIndex(c => c.creator.toString() === creatorId.toString()) + 1;
  const total = allCreators.length;
  const percentile = ((total - rank) / total) * 100;
  
  return { rank, total, percentile };
};

// Get coaching recommendations
creatorSalesActivitySchema.statics.generateRecommendations = async function(creatorId) {
  const activity = await this.findOne({ creator: creatorId });
  if (!activity) return [];
  
  const recommendations = [];
  
  // Low conversion rate
  if (activity.dailyActivity.conversions.conversionRate < 5) {
    recommendations.push({
      type: 'strategy',
      title: 'Improve Your Conversion Rate',
      description: 'Your conversion rate is below 5%. Try more personalized messages and better timing.',
      expectedImpact: 'Could double your revenue',
      difficulty: 'medium'
    });
  }
  
  // Not engaging whales
  if (activity.dailyActivity.segmentsEngaged.whales === 0) {
    recommendations.push({
      type: 'targeting',
      title: 'Target High-Value Members',
      description: 'You haven\'t engaged any whale members today. They convert 3x better!',
      expectedImpact: 'Increase average sale by 300%',
      difficulty: 'easy'
    });
  }
  
  // Poor response rate
  if (activity.dailyActivity.responses.responseRate < 10) {
    recommendations.push({
      type: 'messaging',
      title: 'Craft Better Opening Messages',
      description: 'Your response rate is low. Try asking questions and being more personal.',
      expectedImpact: 'Triple your response rate',
      difficulty: 'easy'
    });
  }
  
  // Not using offers
  if (activity.dailyActivity.interactions.specialOffers === 0) {
    recommendations.push({
      type: 'offer',
      title: 'Create Special Offers',
      description: 'Special offers convert 5x better than regular messages. Try one today!',
      expectedImpact: '5x conversion rate',
      difficulty: 'medium'
    });
  }
  
  return recommendations;
};

// Reset daily limits
creatorSalesActivitySchema.statics.resetDailyLimits = async function() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  return this.updateMany(
    {},
    {
      $set: {
        'limits.daily.messages.used': 0,
        'limits.daily.messages.resetAt': now,
        'limits.daily.pokes.used': 0,
        'limits.daily.offers.used': 0,
        'dailyActivity.date': now,
        'dailyActivity.interactions': {},
        'dailyActivity.responses': {},
        'dailyActivity.conversions': {},
        'dailyActivity.timeSpent': {},
        'dailyActivity.segmentsEngaged': {}
      }
    }
  );
};

// ============================================
// HOOKS
// ============================================

// Before save - calculate scores
creatorSalesActivitySchema.pre('save', function(next) {
  // Calculate performance score
  this.calculatePerformanceScore();
  
  // Update funnel rates
  this.updateFunnelRates();
  
  // Check achievements
  this.checkAchievements();
  
  // Update metadata
  this.metadata.lastCalculatedAt = new Date();
  
  // Update streaks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (this.metadata.lastActivityAt && 
      this.metadata.lastActivityAt.toDateString() === today.toDateString()) {
    this.rankings.streaks.currentDaily += 1;
    if (this.rankings.streaks.currentDaily > this.rankings.streaks.longestDaily) {
      this.rankings.streaks.longestDaily = this.rankings.streaks.currentDaily;
    }
  }
  
  next();
});

// Create model
const CreatorSalesActivity = mongoose.model('CreatorSalesActivity', creatorSalesActivitySchema);

module.exports = CreatorSalesActivity;