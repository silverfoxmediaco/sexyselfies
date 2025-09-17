const mongoose = require('mongoose');

const creatorEarningsSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creator',
      required: true,
      unique: true,
      index: true,
    },

    creatorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreatorProfile',
      required: true,
    },

    // REAL-TIME FINANCIAL TRACKING (Backend WOW Factor)
    realTimeMetrics: {
      todayEarnings: {
        amount: {
          type: Number,
          default: 0,
        },
        transactionCount: {
          type: Number,
          default: 0,
        },
        lastUpdated: {
          type: Date,
          default: Date.now,
        },
        hourlyBreakdown: [
          {
            hour: Number,
            amount: Number,
            transactions: Number,
          },
        ],
        comparedToYesterday: {
          percentage: Number,
          difference: Number,
          trend: {
            type: String,
            enum: ['up', 'down', 'stable'],
          },
        },
      },

      activeEarningStreams: [
        {
          type: String,
          amount: Number,
          isLive: Boolean,
          startedAt: Date,
        },
      ],

      liveViewerValue: {
        currentViewers: Number,
        potentialEarnings: Number,
        conversionProbability: Number,
      },
    },

    // COMPREHENSIVE EARNINGS BREAKDOWN (UX/UI WOW Factor)
    earningsBreakdown: {
      bySource: {
        contentSales: {
          amount: { type: Number, default: 0 },
          count: { type: Number, default: 0 },
          percentage: { type: Number, default: 0 },
        },
        tips: {
          amount: { type: Number, default: 0 },
          count: { type: Number, default: 0 },
          percentage: { type: Number, default: 0 },
        },
        messages: {
          amount: { type: Number, default: 0 },
          count: { type: Number, default: 0 },
          percentage: { type: Number, default: 0 },
        },
        subscriptions: {
          amount: { type: Number, default: 0 },
          count: { type: Number, default: 0 },
          percentage: { type: Number, default: 0 },
        },
        bundles: {
          amount: { type: Number, default: 0 },
          count: { type: Number, default: 0 },
          percentage: { type: Number, default: 0 },
        },
        referrals: {
          amount: { type: Number, default: 0 },
          count: { type: Number, default: 0 },
          percentage: { type: Number, default: 0 },
        },
        bonuses: {
          amount: { type: Number, default: 0 },
          count: { type: Number, default: 0 },
          percentage: { type: Number, default: 0 },
        },
      },

      byContentType: [
        {
          type: String, // 'image', 'video', 'gallery', etc.
          amount: Number,
          count: Number,
          averagePrice: Number,
          bestPerformer: {
            contentId: mongoose.Schema.Types.ObjectId,
            earnings: Number,
          },
        },
      ],

      byTimeframe: {
        daily: [
          {
            date: Date,
            amount: Number,
            transactions: Number,
          },
        ],
        weekly: [
          {
            weekStart: Date,
            amount: Number,
            transactions: Number,
            bestDay: {
              date: Date,
              amount: Number,
            },
          },
        ],
        monthly: [
          {
            month: Date,
            amount: Number,
            transactions: Number,
            growth: Number,
            target: Number,
            targetAchieved: Boolean,
          },
        ],
        quarterly: [
          {
            quarter: String,
            year: Number,
            amount: Number,
            growth: Number,
          },
        ],
        yearly: [
          {
            year: Number,
            amount: Number,
            growth: Number,
            taxableAmount: Number,
          },
        ],
      },

      byDemographic: [
        {
          category: String, // 'age', 'location', 'gender', 'device'
          breakdown: [
            {
              value: String,
              amount: Number,
              percentage: Number,
              avgTransaction: Number,
            },
          ],
        },
      ],
    },

    // ADVANCED FINANCIAL ANALYTICS (MERN WOW Factor)
    analytics: {
      lifetimeEarnings: {
        type: Number,
        default: 0,
      },

      averages: {
        dailyAverage: Number,
        weeklyAverage: Number,
        monthlyAverage: Number,
        perTransaction: Number,
        perContent: Number,
        perSubscriber: Number,
        perView: Number,
      },

      records: {
        bestDay: {
          date: Date,
          amount: Number,
        },
        bestWeek: {
          weekStart: Date,
          amount: Number,
        },
        bestMonth: {
          month: Date,
          amount: Number,
        },
        largestTransaction: {
          amount: Number,
          date: Date,
          userId: mongoose.Schema.Types.ObjectId,
          type: String,
        },
        fastestEarning: {
          amount: Number,
          timeToEarn: Number, // minutes
          contentId: mongoose.Schema.Types.ObjectId,
        },
      },

      trends: {
        thirtyDayTrend: {
          type: String,
          enum: ['growing', 'declining', 'stable', 'volatile'],
        },
        growthRate: Number, // percentage
        volatility: Number, // 0-100 score
        seasonality: [
          {
            period: String,
            impact: Number,
            description: String,
          },
        ],
        projectedTrend: {
          direction: String,
          confidence: Number,
        },
      },

      benchmarks: {
        vsIndustryAverage: {
          percentage: Number,
          ranking: String, // 'top 1%', 'top 10%', etc.
        },
        vsSimilarCreators: {
          percentile: Number,
          avgDifference: Number,
        },
        vsPersonalGoals: {
          achieved: Number,
          remaining: Number,
          onTrack: Boolean,
        },
      },

      efficiency: {
        earningsPerHour: Number,
        earningsPerPost: Number,
        conversionRate: Number,
        customerLifetimeValue: Number,
        acquisitionCost: Number,
        profitMargin: Number,
      },
    },

    // PREDICTIVE FINANCIAL MODELING (Backend WOW Factor)
    predictions: {
      nextDay: {
        estimated: Number,
        confidence: Number,
        range: {
          min: Number,
          max: Number,
        },
      },
      nextWeek: {
        estimated: Number,
        confidence: Number,
        breakdown: [
          {
            day: String,
            estimated: Number,
          },
        ],
      },
      nextMonth: {
        estimated: Number,
        confidence: Number,
        factors: [
          {
            factor: String,
            impact: Number,
          },
        ],
      },
      nextQuarter: {
        estimated: Number,
        confidence: Number,
        scenarios: {
          optimistic: Number,
          realistic: Number,
          pessimistic: Number,
        },
      },
      yearEnd: {
        projected: Number,
        taxEstimate: Number,
        saveForTax: Number,
      },

      milestones: [
        {
          amount: Number,
          estimatedDate: Date,
          probability: Number,
          requirements: [String],
        },
      ],

      aiRecommendations: [
        {
          recommendation: String,
          potentialImpact: Number,
          priority: {
            type: String,
            enum: ['critical', 'high', 'medium', 'low'],
          },
          reasoning: String,
          implementation: String,
        },
      ],
    },

    // CUSTOMER VALUE TRACKING (UX WOW Factor)
    customerMetrics: {
      topSpenders: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          totalSpent: Number,
          transactionCount: Number,
          averageTransaction: Number,
          lastPurchase: Date,
          lifetime: Number, // days as customer
          preferredContent: [String],
          spendingTrend: {
            type: String,
            enum: ['increasing', 'stable', 'decreasing'],
          },
          churnRisk: {
            type: String,
            enum: ['low', 'medium', 'high'],
          },
        },
      ],

      segments: [
        {
          name: String, // 'Whales', 'Regular', 'New', 'At Risk'
          criteria: mongoose.Schema.Types.Mixed,
          count: Number,
          totalValue: Number,
          averageValue: Number,
          growth: Number,
          recommendations: [String],
        },
      ],

      cohorts: [
        {
          joinMonth: Date,
          userCount: Number,
          totalRevenue: Number,
          retention: {
            month1: Number,
            month3: Number,
            month6: Number,
            month12: Number,
          },
          ltv: Number,
        },
      ],

      satisfaction: {
        nps: Number, // Net Promoter Score
        repeatPurchaseRate: Number,
        averageRating: Number,
        feedbackScore: Number,
      },
    },

    // GOALS & TARGETS (Gamification)
    goals: {
      daily: {
        target: Number,
        achieved: Number,
        percentage: Number,
        streak: Number,
      },
      weekly: {
        target: Number,
        achieved: Number,
        percentage: Number,
        daysRemaining: Number,
      },
      monthly: {
        target: Number,
        achieved: Number,
        percentage: Number,
        projectedEnd: Number,
        willAchieve: Boolean,
      },
      custom: [
        {
          name: String,
          target: Number,
          deadline: Date,
          achieved: Number,
          percentage: Number,
          onTrack: Boolean,
        },
      ],

      achievements: [
        {
          id: String,
          name: String,
          description: String,
          unlockedAt: Date,
          reward: Number,
        },
      ],
    },

    // PAYOUT MANAGEMENT (MERN WOW Factor)
    payouts: {
      pending: {
        amount: Number,
        processingFee: Number,
        netAmount: Number,
        availableDate: Date,
      },

      history: [
        {
          payoutId: String,
          amount: Number,
          fee: Number,
          netAmount: Number,
          method: String,
          status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
          },
          requestedAt: Date,
          completedAt: Date,
          reference: String,
        },
      ],

      schedule: {
        frequency: {
          type: String,
          enum: ['daily', 'weekly', 'biweekly', 'monthly', 'manual'],
          default: 'weekly',
        },
        nextPayout: Date,
        minimumBalance: {
          type: Number,
          default: 50,
        },
        preferredMethod: {
          type: String,
          enum: ['bank', 'paypal', 'crypto', 'card'],
          default: 'bank',
        },
        instantAvailable: Boolean,
        instantFee: Number,
      },

      tax: {
        withholdingRate: Number,
        totalWithheld: Number,
        ytdEarnings: Number,
        estimatedTax: Number,
        documents: [
          {
            type: String,
            year: Number,
            url: String,
            generatedAt: Date,
          },
        ],
      },
    },

    // FINANCIAL INSIGHTS (AI-Powered)
    insights: {
      opportunities: [
        {
          type: String,
          description: String,
          potentialEarnings: Number,
          effort: {
            type: String,
            enum: ['low', 'medium', 'high'],
          },
          deadline: Date,
        },
      ],

      warnings: [
        {
          type: String,
          severity: {
            type: String,
            enum: ['info', 'warning', 'critical'],
          },
          message: String,
          impact: Number,
          solution: String,
        },
      ],

      optimizations: [
        {
          area: String,
          currentPerformance: Number,
          potential: Number,
          suggestions: [String],
          expectedImprovement: Number,
        },
      ],

      comparisons: {
        lastWeek: {
          difference: Number,
          percentage: Number,
          factors: [String],
        },
        lastMonth: {
          difference: Number,
          percentage: Number,
          factors: [String],
        },
        lastYear: {
          difference: Number,
          percentage: Number,
          factors: [String],
        },
      },
    },

    // REVENUE OPTIMIZATION (Backend Magic)
    optimization: {
      pricingStrategy: {
        current: String,
        recommended: String,
        potentialIncrease: Number,
        testResults: [
          {
            strategy: String,
            period: String,
            performance: Number,
          },
        ],
      },

      contentROI: [
        {
          contentType: String,
          investmentTime: Number, // hours
          earnings: Number,
          roi: Number,
          recommendation: String,
        },
      ],

      scheduleOptimization: {
        bestDays: [
          {
            day: String,
            averageEarnings: Number,
          },
        ],
        bestHours: [
          {
            hour: Number,
            averageEarnings: Number,
          },
        ],
        recommendedSchedule: [
          {
            day: String,
            time: String,
            contentType: String,
          },
        ],
      },

      bundleRecommendations: [
        {
          contents: [mongoose.Schema.Types.ObjectId],
          suggestedPrice: Number,
          estimatedSales: Number,
          reasoning: String,
        },
      ],
    },

    // NOTIFICATIONS & ALERTS
    alerts: {
      milestoneAlerts: [
        {
          milestone: String,
          achieved: Boolean,
          date: Date,
          celebrated: Boolean,
        },
      ],

      unusualActivity: [
        {
          type: String,
          description: String,
          amount: Number,
          date: Date,
          investigated: Boolean,
        },
      ],

      paymentIssues: [
        {
          issue: String,
          date: Date,
          resolved: Boolean,
          impact: Number,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// INDEXES
// Note: creator field already has index: true in field definition above
creatorEarningsSchema.index({ 'realTimeMetrics.todayEarnings.amount': -1 });
creatorEarningsSchema.index({ 'analytics.lifetimeEarnings': -1 });
creatorEarningsSchema.index({ 'goals.monthly.target': 1 });

// METHODS
creatorEarningsSchema.methods.calculateGrowthRate = function (
  timeframe = 'monthly'
) {
  const data = this.earningsBreakdown.byTimeframe[timeframe];
  if (!data || data.length < 2) return 0;

  const recent = data[data.length - 1].amount;
  const previous = data[data.length - 2].amount;

  if (previous === 0) return 100;
  return ((recent - previous) / previous) * 100;
};

creatorEarningsSchema.methods.predictNextPeriod = function (
  timeframe = 'daily'
) {
  const historicalData = this.earningsBreakdown.byTimeframe[timeframe];
  if (!historicalData || historicalData.length < 7) {
    return { estimated: 0, confidence: 0 };
  }

  // Simple moving average with trend
  const recentPeriods = historicalData.slice(-7);
  const average =
    recentPeriods.reduce((sum, p) => sum + p.amount, 0) / recentPeriods.length;

  // Calculate trend
  const firstHalf =
    recentPeriods.slice(0, 3).reduce((sum, p) => sum + p.amount, 0) / 3;
  const secondHalf =
    recentPeriods.slice(-3).reduce((sum, p) => sum + p.amount, 0) / 3;
  const trend = (secondHalf - firstHalf) / firstHalf;

  const estimated = average * (1 + trend);
  const confidence = Math.min(95, 50 + recentPeriods.length * 2);

  return { estimated, confidence };
};

creatorEarningsSchema.methods.identifyTopOpportunities = function () {
  const opportunities = [];

  // Check content performance
  const bestContent = this.earningsBreakdown.byContentType.sort(
    (a, b) => b.averagePrice - a.averagePrice
  )[0];
  if (bestContent) {
    opportunities.push({
      type: 'content',
      description: `Focus on ${bestContent.type} content - it earns ${bestContent.averagePrice} on average`,
      potentialEarnings: bestContent.averagePrice * 10,
      effort: 'medium',
    });
  }

  // Check time optimization
  const bestHour = this.optimization.scheduleOptimization.bestHours[0];
  if (bestHour) {
    opportunities.push({
      type: 'timing',
      description: `Post at ${bestHour.hour}:00 for maximum earnings`,
      potentialEarnings: bestHour.averageEarnings,
      effort: 'low',
    });
  }

  return opportunities;
};

creatorEarningsSchema.methods.calculateTaxEstimate = function () {
  const ytdEarnings = this.payouts.tax.ytdEarnings || 0;
  const estimatedRate = 0.25; // 25% default, should be configurable
  return ytdEarnings * estimatedRate;
};

// VIRTUALS
creatorEarningsSchema.virtual('isGrowthPositive').get(function () {
  return this.analytics.trends.growthRate > 0;
});

creatorEarningsSchema.virtual('dailyGoalProgress').get(function () {
  if (!this.goals.daily.target) return 0;
  return (this.goals.daily.achieved / this.goals.daily.target) * 100;
});

creatorEarningsSchema.virtual('needsAttention').get(function () {
  const warnings = this.insights.warnings.filter(
    w => w.severity === 'critical'
  );
  const declining = this.analytics.trends.thirtyDayTrend === 'declining';
  const belowGoal = this.dailyGoalProgress < 50;

  return warnings.length > 0 || declining || belowGoal;
});

// HOOKS
creatorEarningsSchema.pre('save', async function (next) {
  // Update predictions
  this.predictions.nextDay = this.predictNextPeriod('daily');
  this.predictions.nextWeek = this.predictNextPeriod('weekly');

  // Update opportunities
  this.insights.opportunities = this.identifyTopOpportunities();

  // Update tax estimate
  this.payouts.tax.estimatedTax = this.calculateTaxEstimate();

  // Calculate percentages for breakdown
  const total = this.analytics.lifetimeEarnings || 1;
  for (let source in this.earningsBreakdown.bySource) {
    this.earningsBreakdown.bySource[source].percentage =
      (this.earningsBreakdown.bySource[source].amount / total) * 100;
  }

  next();
});

module.exports = mongoose.model('CreatorEarnings', creatorEarningsSchema);
