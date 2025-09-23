// Test script for the Browse Members API endpoint
const mongoose = require('mongoose');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const testMembersAPI = async () => {
  try {
    console.log('🔍 Testing Browse Members API logic...');

    // Check if we have members in the database
    const allMembers = await Member.find({}).populate('user', 'email isActive');
    console.log(`📊 Total members in database: ${allMembers.length}`);

    // Check completed profiles
    const completedProfiles = await Member.find({ profileComplete: true }).populate('user', 'email isActive');
    console.log(`✅ Members with completed profiles: ${completedProfiles.length}`);

    // Check active members
    const activeMembers = completedProfiles.filter(member => member.user?.isActive === true);
    console.log(`🟢 Active members with completed profiles: ${activeMembers.length}`);

    // Show member details
    activeMembers.forEach((member, index) => {
      console.log(`\n👤 Member ${index + 1}:`);
      console.log(`   ID: ${member._id}`);
      console.log(`   Username: ${member.username || 'No username'}`);
      console.log(`   Display Name: ${member.displayName || 'No display name'}`);
      console.log(`   Profile Complete: ${member.profileComplete}`);
      console.log(`   User Active: ${member.user?.isActive}`);
      console.log(`   Gender: ${member.gender || 'Not specified'}`);
      console.log(`   Email: ${member.user?.email || 'No email'}`);
    });

    // Test the transformation logic
    console.log('\n🔄 Testing data transformation...');
    const transformedMembers = activeMembers.map(member => {
      const user = member.user;
      return {
        id: member._id,
        username: member.username || `Member_${member._id.toString().slice(-4)}`,
        displayName: member.displayName || member.username,
        isOnline: false,
        lastActive: member.lastActive || user?.lastLogin || new Date(),
        joinDate: user?.createdAt || new Date(),
        spendingTier: 'new',
        stats: {
          totalSpent: 0,
          last30DaySpend: 0,
          averagePurchase: 0,
          contentPurchases: member.purchasedContent?.length || 0,
          messagesExchanged: 0,
          tipsGiven: 0,
        },
        activity: {
          lastPurchase: member.purchasedContent && member.purchasedContent.length > 0
            ? member.purchasedContent[member.purchasedContent.length - 1].purchaseDate
            : null,
          purchaseFrequency: 'inactive',
          engagementLevel: 'new',
          hasSubscribed: false,
          subscriptionTier: null,
        },
        gender: member.gender,
        orientation: member.orientation,
        bodyType: member.bodyType,
        location: member.location,
        bio: member.bio,
        badges: ['newcomer'],
      };
    });

    console.log(`\n🎯 Transformed ${transformedMembers.length} members for frontend`);
    console.log('\n📤 Sample response format:');
    console.log(JSON.stringify({
      success: true,
      members: transformedMembers.slice(0, 2), // Show first 2 as sample
      total: transformedMembers.length,
      message: `Found ${transformedMembers.length} members`,
    }, null, 2));

  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
};

const runTest = async () => {
  await connectDB();
  await testMembersAPI();

  console.log('\n🔄 Disconnecting from MongoDB...');
  await mongoose.disconnect();
  console.log('✅ Test completed successfully');
  process.exit(0);
};

if (require.main === module) {
  runTest().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testMembersAPI };