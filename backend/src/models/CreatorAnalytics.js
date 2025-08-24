const mongoose = require('mongoose');

const creatorAnalyticsSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creator',
    required: true,
    unique: true,
    index: true
  },
  
  // REAL-TIME METRICS (Updated every minute)
  realTime: {
    activeViewers: {
      count: { type: Number, default: 0 },
      userIds: [mongoose.Schema.Types.ObjectId],
      devices: {
        mobile: { type: Number, default: 0 },
        desktop: { type: Number, default: 0 },
        tablet: { type: Number, default: 0 }
      },
      locations: [{
        country: String,
        count: Number
      }]
    },
    
    activeSessions: [{
      userId: mongoose.Schema.Types.ObjectId,
      startTime: Date,
      duration: Number, // seconds
      device: String,
      location: String,
      pageViews: Number,
      contentViewed: [mongoose.Schema.Types.ObjectId]
    }],
    
    liveEarnings: {
      last5Minutes: { type: Number, default: 0 },
      last15Minutes: { type: Number, default: 0 },
      lastHour: { type: Number, default: 0 },
      today: { type: Number, default: 0 }
    },
    
    trending: {
      isTrending: { type: Boolean, default: false },
      trendingScore: { type: Number, default: 0 },
      trendingCategory: String,
      trendingPosition: Number,
      startedTrendingAt: Date
    }
  },
  
  // TRAFFIC ANALYTICS
  traffic: {
    sources: [{
      source: String, // direct, search, social, referral
      medium: String, // organic, paid, email
      campaign: String,
      visits: { type: Number, default: 0 },
      uniqueVisitors: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      bounceRate: { type: Number, default: 0 },
      avgDuration: { type: Number, default: 0 } // seconds
    }],
    
    referrers: [{
      domain: String,
      path: String,
      visits: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    }],
    
    searchTerms: [{
      term: String,
      count: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    }],
    
    entryPages: [{
      page: String,
      visits: { type: Number, default: 0 },
      bounces: { type: Number, default: 0 }
    }],
    
    exitPages: [{
      page: String,
      exits: { type: Number, default: 0 }
    }]
  },
  
  // CONTENT PERFORMANCE
  contentPerformance: {
    byType: {
      photos: {
        total: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        purchases: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
        avgPrice: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 }
      },
      videos: {
        total: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        purchases: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
        avgPrice: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 },
        avgWatchTime: { type: Number, default: 0 }
      },
      messages: {
        total: { type: Number, default: 0 },
        paid: { type: Number, default: 0 },
        purchased: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
        avgPrice: { type: Number, default: 0 }
      }
    },
    
    topPerformers: [{
      contentId: mongoose.Schema.Types.ObjectId,
      contentType: String,
      title: String,
      views: Number,
      purchases: Number,
      revenue: Number,
      roi: Number,
      rating: Number
    }],
    
    worstPerformers: [{
      contentId: mongoose.Schema.Types.ObjectId,
      contentType: String,
      title: String,
      views: Number,
      purchases: Number,
      revenue: Number,
      issues: [String] // low_quality, poor_timing, wrong_audience
    }],
    
    optimal: {
      postingTimes: [{
        dayOfWeek: Number,
        hour: Number,
        engagementRate: Number,
        purchaseRate: Number,
        avgRevenue: Number
      }],
      
      pricing: {
        photos: { min: Number, optimal: Number, max: Number },
        videos: { min: Number, optimal: Number, max: Number },
        messages: { min: Number, optimal: Number, max: Number }
      },
      
      contentMix: {
        photosPercent: Number,
        videosPercent: Number,
        messagesPercent: Number
      }
    }
  },
  
  // AUDIENCE INSIGHTS
  audience: {
    demographics: {
      age: [{
        range: String, // 18-24, 25-34, etc
        count: Number,
        percentage: Number,
        avgSpend: Number
      }],
      
      gender: [{
        type: String,
        count: Number,
        percentage: Number,
        avgSpend: Number
      }],
      
      orientation: [{
        type: String, // straight, gay, bi, etc
        count: Number,
        percentage: Number,
        avgSpend: Number
      }],
      
      location: [{
        country: String,
        state: String,
        city: String,
        count: Number,
        percentage: Number,
        avgSpend: Number
      }],
      
      language: [{
        code: String,
        count: Number,
        percentage: Number
      }]
    },
    
    behavior: {
      devices: {
        mobile: Number,
        desktop: Number,
        tablet: Number
      },
      
      browsers: [{
        name: String,
        version: String,
        count: Number
      }],
      
      activeHours: [{
        hour: Number,
        dayType: String, // weekday, weekend
        activeUsers: Number,
        purchases: Number
      }],
      
      sessionMetrics: {
        avgDuration: Number, // seconds
        avgPageViews: Number,
        avgContentViewed: Number,
        bounceRate: Number
      },
      
      loyaltySegments: {
        new: { count: Number, percentage: Number },
        casual: { count: Number, percentage: Number },
        regular: { count: Number, percentage: Number },
        vip: { count: Number, percentage: Number },
        whale: { count: Number, percentage: Number }
      }
    },
    
    interests: [{
      category: String,
      score: Number,
      basedOn: String // content_viewed, time_spent, purchases
    }],
    
    cohorts: [{
      name: String, // Jan 2025 signups
      size: Number,
      retentionRate: [Number], // [100, 80, 60, 45...] by period
      avgLifetimeValue: Number,
      avgMonthlySpend: Number
    }]
  },
  
  // FUNNEL ANALYTICS
  funnels: {
    browse: {  // CHANGED FROM: discovery
      impressions: { type: Number, default: 0 },
      profileViews: { type: Number, default: 0 },
      swipedRight: { type: Number, default: 0 },
      connected: { type: Number, default: 0 },  // CHANGED FROM: matched
      messaged: { type: Number, default: 0 },
      purchased: { type: Number, default: 0 },
      
      conversionRates: {
        impressionToView: Number,
        viewToSwipe: Number,
        swipeToConnection: Number,  // CHANGED FROM: swipeToMatch
        connectionToMessage: Number,  // CHANGED FROM: matchToMessage
        messageToPurchase: Number,
        overallConversion: Number
      },
      
      dropoffPoints: [{
        stage: String,
        lostUsers: Number,
        percentage: Number,
        avgTimeToDropoff: Number
      }]
    },
    
    monetization: {
      viewedContent: { type: Number, default: 0 },
      clickedUnlock: { type: Number, default: 0 },
      startedPayment: { type: Number, default: 0 },
      completedPayment: { type: Number, default: 0 },
      
      conversionRates: {
        viewToClick: Number,
        clickToPayment: Number,
        paymentCompletion: Number
      },
      
      abandonmentReasons: [{
        reason: String, // price, payment_method, trust
        count: Number,
        percentage: Number
      }]
    }
  },
  
  // HEATMAPS & INTERACTION TRACKING
  heatmaps: {
    profile: {
      sections: [{
        name: String, // bio, photos, prices
        clicks: Number,
        hoverTime: Number,
        scrollDepth: Number
      }],
      
      elements: [{
        element: String, // subscribe_button, message_button
        clicks: Number,
        conversionRate: Number
      }]
    },
    
    content: {
      viewPatterns: [{
        contentId: mongoose.Schema.Types.ObjectId,
        heatmapData: String, // Base64 encoded heatmap
        hotspots: [{
          x: Number,
          y: Number,
          intensity: Number
        }],
        avgViewDuration: Number,
        scrollDepth: Number,
        replays: Number
      }]
    }
  },
  
  // COMPETITOR ANALYSIS
  competitive: {
    marketPosition: {
      overallRank: Number,
      categoryRank: Number,
      percentile: Number
    },
    
    benchmarks: {
      avgEarnings: {
        platform: Number,
        creator: Number,
        difference: Number,
        percentile: Number
      },
      
      engagement: {
        platform: Number,
        creator: Number,
        difference: Number,
        percentile: Number
      },
      
      contentQuality: {
        platform: Number,
        creator: Number,
        difference: Number,
        percentile: Number
      }
    },
    
    opportunities: [{
      type: String, // untapped_audience, pricing_optimization
      description: String,
      potentialRevenue: Number,
      difficulty: String, // easy, medium, hard
      priority: Number
    }]
  },
  
  // A/B TESTING
  experiments: [{
    id: String,
    name: String,
    type: String, // pricing, content, profile
    status: String, // running, completed, paused
    
    variants: [{
      name: String,
      allocation: Number, // percentage
      visitors: Number,
      conversions: Number,
      revenue: Number,
      conversionRate: Number,
      avgOrderValue: Number
    }],
    
    winner: String,
    confidence: Number,
    startDate: Date,
    endDate: Date,
    
    results: {
      significantDifference: Boolean,
      recommendedAction: String,
      projectedImpact: Number
    }
  }],
  
  // PREDICTIVE ANALYTICS
  predictions: {
    revenue: {
      nextDay: { amount: Number, confidence: Number },
      nextWeek: { amount: Number, confidence: Number },
      nextMonth: { amount: Number, confidence: Number },
      factors: [String] // trending, seasonal, promotional
    },
    
    churn: {
      atRiskFans: Number,
      churnProbability: Number,
      expectedLoss: Number,
      preventionCost: Number,
      recommendedActions: [String]
    },
    
    growth: {
      projectedFans: {
        nextWeek: Number,
        nextMonth: Number,
        next3Months: Number
      },
      growthRate: Number,
      accelerators: [String], // actions to increase growth
      inhibitors: [String] // factors limiting growth
    },
    
    optimal: {
      contentSchedule: [{
        dayOfWeek: Number,
        hour: Number,
        contentType: String,
        expectedRevenue: Number
      }],
      
      pricingStrategy: {
        photos: Number,
        videos: Number,
        messages: Number,
        adjustmentReason: String
      }
    }
  },
  
  // HISTORICAL DATA (Aggregated)
  historical: {
    daily: [{
      date: Date,
      views: Number,
      connections: Number,  // CHANGED FROM: matches
      messages: Number,
      purchases: Number,
      revenue: Number,
      newFans: Number,
      lostFans: Number,
      activeUsers: Number
    }],
    
    weekly: [{
      weekStart: Date,
      metrics: {
        views: Number,
        connections: Number,  // CHANGED FROM: matches
        revenue: Number,
        avgDailyRevenue: Number,
        bestDay: String,
        worstDay: String
      }
    }],
    
    monthly: [{
      month: Date,
      metrics: {
        views: Number,
        connections: Number,  // CHANGED FROM: matches
        revenue: Number,
        growth: Number,
        churn: Number,
        netGrowth: Number,
        topContent: [mongoose.Schema.Types.ObjectId]
      }
    }]
  },
  
  // ALERTS & ANOMALIES
  alerts: [{
    type: String, // spike, drop, unusual_activity
    severity: String, // info, warning, critical
    metric: String,
    value: Number,
    expectedValue: Number,
    deviation: Number,
    detectedAt: Date,
    resolved: Boolean,
    resolvedAt: Date,
    action: String
  }],
  
  // METADATA
  metadata: {
    lastCalculated: Date,
    calculationDuration: Number, // ms
    dataQuality: {
      score: Number,
      issues: [String]
    },
    version: String
  }
}, {
  timestamps: true,
  indexes: [
    { creator: 1 },
    { 'realTime.trending.isTrending': 1 },
    { 'predictions.revenue.nextWeek.amount': -1 },
    { 'competitive.marketPosition.overallRank': 1 },
    { 'alerts.severity': 1, 'alerts.resolved': 1 }
  ]
});

// METHODS

// Update real-time metrics
creatorAnalyticsSchema.methods.updateRealTimeMetrics = function(data) {
  if (data.viewerId) {
    if (!this.realTime.activeViewers.userIds.includes(data.viewerId)) {
      this.realTime.activeViewers.userIds.push(data.viewerId);
      this.realTime.activeViewers.count++;
    }
  }
  
  if (data.earnings) {
    this.realTime.liveEarnings.last5Minutes += data.earnings;
    this.realTime.liveEarnings.today += data.earnings;
  }
  
  // Update trending score
  this.calculateTrendingScore();
};

// Calculate trending score
creatorAnalyticsSchema.methods.calculateTrendingScore = function() {
  const factors = {
    viewers: this.realTime.activeViewers.count * 10,
    earnings: this.realTime.liveEarnings.lastHour * 5,
    engagement: (this.audience.behavior.sessionMetrics.avgDuration / 60) * 3
  };
  
  this.realTime.trending.trendingScore = 
    Object.values(factors).reduce((a, b) => a + b, 0);
  
  this.realTime.trending.isTrending = 
    this.realTime.trending.trendingScore > 100;
};

// Detect anomalies
creatorAnalyticsSchema.methods.detectAnomalies = function() {
  const alerts = [];
  
  // Check for revenue spike
  const todayRevenue = this.realTime.liveEarnings.today;
  const avgDailyRevenue = this.historical.daily
    .slice(-7)
    .reduce((sum, day) => sum + day.revenue, 0) / 7;
  
  if (todayRevenue > avgDailyRevenue * 2) {
    alerts.push({
      type: 'spike',
      severity: 'info',
      metric: 'revenue',
      value: todayRevenue,
      expectedValue: avgDailyRevenue,
      deviation: ((todayRevenue - avgDailyRevenue) / avgDailyRevenue) * 100,
      detectedAt: new Date()
    });
  }
  
  // Check for traffic drop
  const currentViewers = this.realTime.activeViewers.count;
  const avgViewers = this.historical.daily
    .slice(-7)
    .reduce((sum, day) => sum + day.activeUsers, 0) / 7;
  
  if (currentViewers < avgViewers * 0.5) {
    alerts.push({
      type: 'drop',
      severity: 'warning',
      metric: 'traffic',
      value: currentViewers,
      expectedValue: avgViewers,
      deviation: ((avgViewers - currentViewers) / avgViewers) * 100,
      detectedAt: new Date()
    });
  }
  
  this.alerts.push(...alerts);
};

// STATICS

// Get top trending creators
creatorAnalyticsSchema.statics.getTrendingCreators = function(limit = 10) {
  return this.find({ 'realTime.trending.isTrending': true })
    .sort('-realTime.trending.trendingScore')
    .limit(limit)
    .populate('creator', 'username profileImage');
};

// Compare creator to platform average
creatorAnalyticsSchema.statics.getBenchmarks = async function(creatorId) {
  const creatorStats = await this.findOne({ creator: creatorId });
  
  const platformAvg = await this.aggregate([
    {
      $group: {
        _id: null,
        avgRevenue: { $avg: '$realTime.liveEarnings.today' },
        avgViewers: { $avg: '$realTime.activeViewers.count' },
        avgConversion: { $avg: '$funnels.browse.conversionRates.overallConversion' }  // CHANGED FROM: discovery
      }
    }
  ]);
  
  return {
    creator: creatorStats,
    platform: platformAvg[0],
    comparison: {
      revenuePercentile: calculatePercentile(creatorStats, 'revenue'),
      viewersPercentile: calculatePercentile(creatorStats, 'viewers'),
      conversionPercentile: calculatePercentile(creatorStats, 'conversion')
    }
  };
};

// Helper function for percentile calculation
function calculatePercentile(stats, metric) {
  // Implementation would query all creators and calculate actual percentile
  return Math.floor(Math.random() * 100);
}

module.exports = mongoose.model('CreatorAnalytics', creatorAnalyticsSchema);