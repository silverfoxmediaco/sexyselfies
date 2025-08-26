const mongoose = require('mongoose');

const creatorProfileSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creator',
    required: true,
    unique: true
  },
  
  // BRANDING & PERSONALIZATION (UI/UX WOW Factor)
  branding: {
    primaryColor: {
      type: String,
      default: '#17D2C2' // Sexy Selfies teal
    },
    secondaryColor: {
      type: String,
      default: '#12B7AB'
    },
    accentColor: {
      type: String,
      default: '#47E0D2'
    },
    fontChoice: {
      type: String,
      enum: ['modern', 'elegant', 'playful', 'bold', 'minimal'],
      default: 'modern'
    },
    layoutStyle: {
      type: String,
      enum: ['grid', 'masonry', 'carousel', 'timeline', 'magazine'],
      default: 'grid'
    },
    welcomeMessage: {
      type: String,
      maxlength: 200,
      default: 'Welcome to my exclusive content! 🔥'
    },
    customBio: {
      headline: {
        type: String,
        maxlength: 100
      },
      tagline: {
        type: String,
        maxlength: 150
      },
      aboutMe: {
        type: String,
        maxlength: 1000
      },
      whatToExpect: {
        type: String,
        maxlength: 500
      }
    },
    profileVideo: {
      url: String,
      thumbnail: String,
      duration: Number
    }
  },

  // REAL-TIME ANALYTICS (Backend/UX WOW Factor)
  analytics: {
    realTime: {
      activeViewers: {
        type: Number,
        default: 0
      },
      todayEarnings: {
        type: Number,
        default: 0
      },
      todayViews: {
        type: Number,
        default: 0
      },
      todayNewSubscribers: {
        type: Number,
        default: 0
      },
      liveConversionRate: {
        type: Number,
        default: 0
      }
    },
    
    insights: {
      bestPostingTimes: [{
        dayOfWeek: String,
        hour: Number,
        engagementRate: Number
      }],
      topContentTypes: [{
        type: String,
        earnings: Number,
        engagement: Number
      }],
      audienceDemographics: {
        ageGroups: [{
          range: String,
          percentage: Number
        }],
        locations: [{
          country: String,
          city: String,
          percentage: Number
        }],
        deviceTypes: [{
          type: String,
          percentage: Number
        }],
        discoveryMethods: [{
          source: String, // 'search', 'swipe', 'direct', 'shared'
          percentage: Number
        }]
      },
      contentPerformance: [{
        contentId: mongoose.Schema.Types.ObjectId,
        views: Number,
        purchases: Number,
        revenue: Number,
        roi: Number,
        engagementScore: Number
      }]
    },
    
    predictions: {
      estimatedMonthlyEarnings: Number,
      growthRate: Number,
      nextMilestone: {
        type: String,
        value: Number,
        estimatedDate: Date
      },
      suggestedContentStrategy: [String]
    }
  },

  // GAMIFICATION & ACHIEVEMENTS (UX WOW Factor)
  gamification: {
    creatorLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 100
    },
    experiencePoints: {
      type: Number,
      default: 0
    },
    monthlyRank: {
      type: Number,
      default: null
    },
    globalRank: {
      type: Number,
      default: null
    },
    badges: [{
      id: String,
      name: String,
      description: String,
      icon: String,
      unlockedAt: Date,
      rarity: {
        type: String,
        enum: ['common', 'rare', 'epic', 'legendary']
      }
    }],
    achievements: [{
      id: String,
      name: String,
      description: String,
      progress: Number,
      total: Number,
      completed: Boolean,
      completedAt: Date,
      reward: {
        type: String,
        value: mongoose.Schema.Types.Mixed
      }
    }],
    streaks: {
      dailyLogin: {
        current: Number,
        longest: Number,
        lastLoginDate: Date
      },
      dailyPost: {
        current: Number,
        longest: Number,
        lastPostDate: Date
      },
      weeklyEarnings: {
        current: Number,
        best: Number
      }
    }
  },

  // SMART CONTENT MANAGEMENT (Backend WOW Factor)
  contentStrategy: {
    autoSchedule: {
      enabled: {
        type: Boolean,
        default: false
      },
      schedule: [{
        dayOfWeek: Number,
        time: String,
        contentType: String
      }]
    },
    contentCalendar: [{
      date: Date,
      plannedContent: {
        title: String,
        type: String,
        notes: String,
        status: {
          type: String,
          enum: ['planned', 'creating', 'ready', 'published']
        }
      }
    }],
    aiSuggestions: [{
      suggestion: String,
      reason: String,
      potentialEarnings: Number,
      confidence: Number,
      suggestedAt: Date
    }],
    contentTemplates: [{
      name: String,
      description: String,
      settings: mongoose.Schema.Types.Mixed,
      successRate: Number
    }]
  },

  // ENHANCED FINANCIAL TRACKING (MERN WOW Factor)
  financials: {
    earningsGoals: {
      daily: Number,
      weekly: Number,
      monthly: Number,
      yearly: Number
    },
    revenueStreams: [{
      type: {
        type: String,
        enum: ['content', 'tips', 'messages', 'custom', 'referrals']
      },
      amount: Number,
      percentage: Number,
      trend: {
        type: String,
        enum: ['up', 'down', 'stable']
      }
    }],
    payoutSettings: {
      method: {
        type: String,
        enum: ['bank', 'paypal', 'crypto', 'check'],
        default: 'paypal'
      },
      paypalEmail: {
        type: String,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          'Please provide a valid PayPal email'
        ]
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly'],
        default: 'weekly'
      },
      minimumPayout: {
        type: Number,
        default: 50
      },
      instantPayout: {
        enabled: Boolean,
        fee: Number
      },
      taxInfo: {
        ein: String,
        w9Filed: Boolean,
        taxDocuments: [String]
      }
    },
    earningsHistory: [{
      date: Date,
      amount: Number,
      source: String,
      details: mongoose.Schema.Types.Mixed
    }],
    projections: {
      next7Days: Number,
      next30Days: Number,
      next90Days: Number,
      bestCaseScenario: Number,
      worstCaseScenario: Number
    }
  },

  // SUBSCRIBER RELATIONSHIP MANAGEMENT (UX WOW Factor)
  subscriberInsights: {
    vipMembers: [{
      memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
      },
      totalSpent: Number,
      joinedDate: Date,
      engagementScore: Number,
      lastInteraction: Date,
      preferences: [String],
      customNotes: String
    }],
    churnRisk: [{
      memberId: mongoose.Schema.Types.ObjectId,
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      reason: String,
      lastActive: Date,
      suggestion: String
    }],
    segmentation: [{
      name: String,
      criteria: mongoose.Schema.Types.Mixed,
      memberCount: Number,
      avgValue: Number,
      suggestions: [String]
    }]
  },

  // AUTOMATION & AI FEATURES (Backend WOW Factor)
  automation: {
    welcomeMessage: {
      enabled: Boolean,
      message: String,
      includeContent: Boolean,
      delay: Number // minutes after match
    },
    reEngagement: {
      enabled: Boolean,
      inactiveDays: Number,
      message: String,
      offer: {
        type: String,
        discount: Number
      }
    },
    birthdayGreetings: {
      enabled: Boolean,
      message: String,
      specialOffer: Boolean
    },
    contentDrip: {
      enabled: Boolean,
      schedule: [{
        dayAfterSubscribe: Number,
        contentType: String,
        message: String
      }]
    },
    smartPricing: {
      enabled: Boolean,
      algorithm: {
        type: String,
        enum: ['dynamic', 'tiered', 'seasonal', 'demand-based']
      },
      rules: mongoose.Schema.Types.Mixed
    }
  },

  // NOTIFICATIONS & ALERTS PREFERENCES
  notifications: {
    pushEnabled: {
      type: Boolean,
      default: true
    },
    emailEnabled: {
      type: Boolean,
      default: true
    },
    smsEnabled: {
      type: Boolean,
      default: false
    },
    alerts: {
      newSubscriber: Boolean,
      milestone: Boolean,
      highSpender: Boolean,
      contentPerformance: Boolean,
      earningsUpdate: Boolean,
      systemUpdates: Boolean
    },
    quietHours: {
      enabled: Boolean,
      startTime: String,
      endTime: String,
      timezone: String
    }
  },

  // PERFORMANCE METRICS
  performance: {
    responseTime: {
      average: Number,
      fastest: Number
    },
    contentQuality: {
      score: Number,
      factors: {
        variety: Number,
        consistency: Number,
        engagement: Number,
        originalityScore: Number
      }
    },
    growthMetrics: {
      subscriberGrowth: Number, // percentage
      revenueGrowth: Number, // percentage
      engagementGrowth: Number // percentage
    },
    benchmarks: {
      vsLastMonth: {
        earnings: Number,
        subscribers: Number,
        engagement: Number
      },
      vsSimilarCreators: {
        percentile: Number,
        rank: Number,
        totalCompared: Number
      }
    }
  },

  // COLLABORATION & PARTNERSHIPS
  collaborations: {
    openToCollabs: {
      type: Boolean,
      default: false
    },
    collabTypes: [String],
    pastCollabs: [{
      partnerId: mongoose.Schema.Types.ObjectId,
      type: String,
      date: Date,
      success: Boolean,
      earnings: Number
    }],
    collabRequests: [{
      from: mongoose.Schema.Types.ObjectId,
      message: String,
      status: {
        type: String,
        enum: ['pending', 'accepted', 'declined']
      },
      date: Date
    }]
  },

  // DEMOGRAPHICS & FILTERING DATA
  demographics: {
    age: {
      type: Number,
      min: 18,
      max: 99
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'non-binary', 'trans', 'prefer not to say'],
      lowercase: true
    },
    orientation: {
      type: String,
      enum: ['straight', 'gay', 'lesbian', 'bisexual', 'pansexual', 'prefer not to say'],
      lowercase: true
    },
    bodyType: {
      type: String,
      enum: ['Slim', 'Slender', 'Athletic', 'Average', 'Curvy', 'Plus Size', 'BBW', 'Muscular', 'Dad Bod', 'Mom Bod']
    },
    ethnicity: {
      type: String,
      enum: ['Asian', 'Black', 'Caucasian', 'Hispanic/Latino', 'Middle Eastern', 'Mixed', 'Native American', 'Pacific Islander', 'Other']
    },
    hairColor: {
      type: String,
      enum: ['Black', 'Brown', 'Blonde', 'Red', 'Auburn', 'Gray', 'White', 'Colored', 'Bald']
    },
    height: {
      type: Number, // in inches
      min: 48, // 4'0"
      max: 84  // 7'0"
    },
    categories: [{
      type: String,
      enum: ['lifestyle', 'fitness', 'fashion', 'artistic', 'travel', 'food', 'music', 'gaming', 'education', 'comedy']
    }]
  },

  // BROWSE & DISCOVERY SETTINGS
  browseSettings: {
    showInBrowse: {
      type: Boolean,
      default: true
    },
    browsePreferences: {
      men: {
        type: Boolean,
        default: true
      },
      women: {
        type: Boolean,
        default: true
      },
      couples: {
        type: Boolean,
        default: false
      },
      nonBinary: {
        type: Boolean,
        default: true
      }
    },
    ageRange: {
      min: {
        type: Number,
        default: 18,
        min: 18
      },
      max: {
        type: Number,
        default: 55
      }
    }
  },

  // METADATA
  settings: {
    privacy: {
      hideEarnings: Boolean,
      hideRankings: Boolean,
      hideActiveStatus: Boolean
    },
    experimental: {
      betaFeatures: Boolean,
      aiAssistant: Boolean,
      advancedAnalytics: Boolean
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'America/New_York'
    }
  },

  // SUPPORT & EDUCATION
  education: {
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    tutorialsWatched: [String],
    tipsShown: [String],
    lastEducationPrompt: Date,
    creatorScore: {
      type: Number,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
creatorProfileSchema.index({ 'creator': 1 });
creatorProfileSchema.index({ 'analytics.realTime.todayEarnings': -1 });
creatorProfileSchema.index({ 'gamification.monthlyRank': 1 });
creatorProfileSchema.index({ 'gamification.creatorLevel': -1 });

// Methods
creatorProfileSchema.methods.calculateEngagementScore = function() {
  const views = this.analytics.realTime.todayViews || 0;
  const earnings = this.analytics.realTime.todayEarnings || 0;
  const subscribers = this.analytics.realTime.todayNewSubscribers || 0;
  
  return (views * 0.1) + (earnings * 10) + (subscribers * 50);
};

creatorProfileSchema.methods.updateLevel = function() {
  const xp = this.gamification.experiencePoints;
  const newLevel = Math.floor(Math.sqrt(xp / 100)) + 1;
  this.gamification.creatorLevel = Math.min(newLevel, 100);
};

creatorProfileSchema.methods.checkAchievements = function() {
  // Check and update achievements based on current stats
  // This would be expanded with actual achievement logic
  const achievements = [];
  
  if (this.analytics.realTime.todayEarnings >= 100 && !this.hasAchievement('first_hundred')) {
    achievements.push({
      id: 'first_hundred',
      name: 'Century Club',
      description: 'Earned $100 in a single day'
    });
  }
  
  return achievements;
};

creatorProfileSchema.methods.hasAchievement = function(achievementId) {
  return this.gamification.achievements.some(a => a.id === achievementId && a.completed);
};

module.exports = mongoose.model('CreatorProfile', creatorProfileSchema);