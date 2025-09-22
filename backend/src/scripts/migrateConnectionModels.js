const mongoose = require('mongoose');
require('dotenv').config();

// Import both models
const Connections = require('../models/Connections');
const CreatorConnection = require('../models/CreatorConnection');

async function migrateConnectionData() {
  try {
    console.log('🚀 Starting connection model migration...');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all data from simple Connections model
    const simpleConnections = await Connections.find({});
    console.log(`📊 Found ${simpleConnections.length} connections to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const conn of simpleConnections) {
      try {
        // Check if connection already exists in CreatorConnection
        const existingConnection = await CreatorConnection.findOne({
          creator: conn.creator,
          member: conn.member
        });

        if (existingConnection) {
          console.log(`⏭️  Skipping existing connection: ${conn.member} -> ${conn.creator}`);
          skippedCount++;
          continue;
        }

        // Map fields from simple to comprehensive model
        const connectionData = {
          creator: conn.creator,
          member: conn.member,

          // Map status
          status: mapStatus(conn.status),
          connectedAt: conn.connectedAt,
          disconnectedAt: conn.disconnectedAt,

          // Map swipe data
          swipeData: {
            memberSwiped: {
              direction: conn.memberLiked ? 'right' : null,
              swipedAt: conn.createdAt,
              superLike: false, // No super likes in simple model
              sessionTime: 0,
              viewedPhotos: 1,
              readBio: false
            },
            creatorSwiped: {
              direction: conn.creatorLiked ? 'right' : null,
              swipedAt: conn.creatorLiked ? conn.connectedAt : null,
              autoConnected: conn.creatorAccepted || false
            }
          },

          // Map engagement data
          engagement: {
            firstMessageSent: {
              by: null,
              at: null,
              message: null
            },
            totalMessages: {
              fromCreator: Math.floor(conn.messageCount * 0.6), // Estimate
              fromMember: Math.floor(conn.messageCount * 0.4)   // Estimate
            },
            lastMessageAt: conn.lastMessagePreview?.createdAt || null,
            lastActiveAt: conn.lastInteraction,
            contentUnlocked: {
              count: conn.contentUnlocked || 0,
              totalSpent: conn.totalSpent || 0,
              firstUnlockAt: null,
              lastUnlockAt: null
            },
            dmContentPurchased: {
              count: 0,
              totalSpent: 0,
              averagePrice: 0
            },
            tips: {
              count: 0,
              total: conn.tipsAmount || 0,
              largest: 0
            }
          },

          // Map relationship data
          relationship: {
            memberScore: {
              engagementLevel: calculateEngagementLevel(conn),
              spendingLevel: calculateSpendingLevel(conn.totalSpent || 0),
              loyaltyScore: 0,
              lifetime: {
                spent: conn.totalSpent || 0,
                messages: conn.messageCount || 0,
                daysActive: calculateDaysActive(conn)
              }
            },
            creatorScore: {
              responseRate: 0,
              avgResponseTime: 0,
              initiatedChats: 0,
              sentFreeContent: 0
            },
            compatibility: {
              score: 75, // Default score
              factors: {
                orientationConnection: true,
                locationConnection: false,
                ageConnection: true,
                interestOverlap: 0,
                activityAlignment: 0
              }
            },
            health: {
              status: calculateHealthStatus(conn),
              lastInteraction: conn.lastInteraction,
              daysSinceLastInteraction: calculateDaysSince(conn.lastInteraction),
              churnRisk: calculateChurnRisk(conn),
              reEngagementSent: null
            }
          },

          // Map monetization data
          monetization: {
            profileContentUnlocks: [],
            dmPurchases: [],
            subscriptionOffers: [],
            totalRevenue: conn.totalSpent || 0,
            avgTransactionValue: 0,
            lastPurchaseAt: null,
            purchaseFrequency: 'rare',
            projectedLTV: 0
          },

          // Map notifications
          notifications: {
            memberPreferences: {
              newMessage: !conn.isMuted,
              contentPost: true,
              price_drop: true,
              goLive: true
            },
            creatorPreferences: {
              newConnection: true,
              firstMessage: true,
              contentUnlock: true,
              tip: true
            },
            pushTokens: {
              member: null,
              creator: null
            }
          },

          // Set flags
          flags: {
            inappropriate: false,
            reported: false,
            verified: conn.connectionType === 'verified',
            vip: false
          },

          // Set metadata
          metadata: {
            source: 'migration',
            campaign: null,
            referrer: null,
            device: null,
            location: {
              country: null,
              state: null,
              city: null
            }
          }
        };

        // Create new CreatorConnection
        const newConnection = new CreatorConnection(connectionData);
        await newConnection.save();

        console.log(`✅ Migrated connection: ${conn.member} -> ${conn.creator}`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Error migrating connection ${conn._id}:`, error.message);
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Migrated: ${migratedCount} connections`);
    console.log(`⏭️  Skipped: ${skippedCount} existing connections`);
    console.log(`📊 Total processed: ${migratedCount + skippedCount}`);

    // Verify migration
    const totalCreatorConnections = await CreatorConnection.countDocuments();
    console.log(`\n📈 Total CreatorConnections after migration: ${totalCreatorConnections}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Helper functions
function mapStatus(simpleStatus) {
  const statusMap = {
    'pending': 'pending',
    'active': 'connected',
    'rejected': 'disconnected',
    'expired': 'disconnected',
    'blocked': 'blocked'
  };
  return statusMap[simpleStatus] || 'pending';
}

function calculateEngagementLevel(conn) {
  const messages = conn.messageCount || 0;
  const spent = conn.totalSpent || 0;

  if (messages > 50 || spent > 100) return 80;
  if (messages > 20 || spent > 50) return 60;
  if (messages > 5 || spent > 10) return 40;
  return 20;
}

function calculateSpendingLevel(totalSpent) {
  if (totalSpent > 500) return 'whale';
  if (totalSpent > 100) return 'vip';
  if (totalSpent > 50) return 'regular';
  if (totalSpent > 10) return 'casual';
  return 'free';
}

function calculateDaysActive(conn) {
  if (!conn.createdAt || !conn.lastInteraction) return 0;
  const diff = new Date(conn.lastInteraction) - new Date(conn.createdAt);
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function calculateHealthStatus(conn) {
  const daysSince = calculateDaysSince(conn.lastInteraction);

  if (daysSince < 3) return 'thriving';
  if (daysSince < 7) return 'active';
  if (daysSince < 14) return 'cooling';
  if (daysSince < 30) return 'dormant';
  return 'at_risk';
}

function calculateDaysSince(date) {
  if (!date) return 999;
  return Math.floor((Date.now() - new Date(date)) / (1000 * 60 * 60 * 24));
}

function calculateChurnRisk(conn) {
  const daysSince = calculateDaysSince(conn.lastInteraction);
  const messageCount = conn.messageCount || 0;
  const spent = conn.totalSpent || 0;

  let risk = daysSince * 3; // Base risk increases with inactivity

  // Reduce risk based on engagement
  if (messageCount > 20) risk -= 20;
  if (spent > 50) risk -= 30;

  return Math.min(100, Math.max(0, risk));
}

// Run migration
if (require.main === module) {
  migrateConnectionData();
}

module.exports = migrateConnectionData;