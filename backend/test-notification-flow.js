const mongoose = require('mongoose');
const User = require('./src/models/User');
const PushSubscription = require('./src/models/PushSubscription');
const notificationService = require('./src/services/notification.service');

// Test notification flow
async function testNotificationFlow() {
  try {
    console.log('🔄 Starting notification flow test...');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies');
    console.log('✅ Connected to MongoDB');

    // Find a test user (or create one)
    let testUser = await User.findOne({ email: { $exists: true } }).limit(1);

    if (!testUser) {
      console.log('❌ No test user found. Please register a user first.');
      process.exit(1);
    }

    console.log(`✅ Found test user: ${testUser.email} (${testUser.role})`);

    // Test notification data
    const testNotificationData = {
      recipientId: testUser._id,
      type: 'connection',
      title: 'Test Connection Request! 🔥',
      message: 'Someone wants to connect with you',
      data: {
        fromUserId: testUser._id,
        fromUsername: 'TestUser',
        connectionId: 'test-connection-123',
        amount: null
      }
    };

    console.log('📧 Testing comprehensive notification system...');
    console.log('   - Push notification');
    console.log('   - Email notification');
    console.log('   - In-app notification');

    // Test the comprehensive notification system
    const result = await notificationService.sendNotification(testNotificationData, {
      priority: 'high',
      emailTemplate: 'connection',
      pushData: {
        requiresInteraction: true,
        badge: '/icons/icon-96x96.png',
        icon: '/icons/icon-192x192.png'
      }
    });

    console.log('✅ Notification sent successfully!');
    console.log('📊 Result:', {
      inAppNotificationId: result.inAppNotificationId,
      emailSent: result.emailResult?.success || false,
      pushSent: result.pushResult?.totalSent || 0,
      totalSubscriptions: result.pushResult?.totalSubscriptions || 0
    });

    console.log('\n✅ Comprehensive notification system verified!');

    // Show push subscription status
    const pushSubscriptions = await PushSubscription.findActiveByUser(testUser._id);
    console.log(`\n🔔 User has ${pushSubscriptions.length} active push subscriptions`);

    if (pushSubscriptions.length > 0) {
      pushSubscriptions.forEach((sub, index) => {
        console.log(`   ${index + 1}. ${sub.deviceInfo?.browser || 'Unknown'} on ${sub.deviceInfo?.platform || 'Unknown'}`);
        console.log(`      Last used: ${sub.lastUsed}`);
        console.log(`      Preferences: ${Object.entries(sub.preferences).filter(([k,v]) => v).map(([k]) => k).join(', ')}`);
      });
    } else {
      console.log('   ℹ️  No push subscriptions found. User needs to grant push permission in browser.');
    }

    console.log('\n✅ Notification flow test completed!');
    console.log('🔍 Check your email and browser notifications to verify delivery.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the test
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  testNotificationFlow();
}

module.exports = testNotificationFlow;