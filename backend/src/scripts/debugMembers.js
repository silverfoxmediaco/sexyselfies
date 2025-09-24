// Debug script to check member records and analytics
const mongoose = require('mongoose');
const path = require('path');

// Load .env file from backend root directory
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const debugMembers = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies';
    await mongoose.connect(mongoURI);

    console.log('✅ Connected to MongoDB');
    console.log(`📍 Database: ${mongoose.connection.name}`);

    const db = mongoose.connection.db;

    // Check members collection
    console.log('\n📊 MEMBERS COLLECTION:');
    const members = await db.collection('members').find({}).toArray();
    console.log(`Found ${members.length} members`);

    members.forEach((member, i) => {
      console.log(`\n${i + 1}. Member ${member._id}:`);
      console.log(`   Username: ${member.username}`);
      console.log(`   Role: ${member.role}`);
      console.log(`   IsActive: ${member.isActive}`);
      console.log(`   Privacy object exists: ${!!member.privacy}`);
      if (member.privacy) {
        console.log(`   Privacy.discoverable: ${member.privacy.discoverable}`);
        console.log(`   Privacy.blockedCreators: ${JSON.stringify(member.privacy.blockedCreators || [])}`);
      }
      console.log(`   Spending object exists: ${!!member.spending}`);
      if (member.spending) {
        console.log(`   Spending.tier: ${member.spending.tier}`);
        console.log(`   Spending.last30Days: ${member.spending.last30Days}`);
      }
      console.log(`   LastActive: ${member.lastActive}`);
      console.log(`   JoinDate: ${member.joinDate}`);
    });

    // Check if MemberAnalytics collection exists
    console.log('\n📊 MEMBER ANALYTICS COLLECTION:');
    try {
      const analytics = await db.collection('memberanalytics').find({}).toArray();
      console.log(`Found ${analytics.length} analytics records`);

      analytics.forEach((analytic, i) => {
        console.log(`\n${i + 1}. Analytics for member ${analytic.member}:`);
        console.log(`   Spending tier: ${analytic.spending?.tier}`);
        console.log(`   Activity level: ${analytic.activity?.level}`);
        console.log(`   Privacy discoverable: ${analytic.privacy?.discoverable}`);
      });
    } catch (error) {
      console.log('❌ MemberAnalytics collection might not exist:', error.message);
    }

    // Test the exact query from the controller
    console.log('\n🔍 TESTING CONTROLLER QUERY:');
    const testCreatorId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'); // dummy creator ID

    const memberQuery = {
      role: 'member',
      isActive: true,
      // Exclude blocked creators
      'privacy.blockedCreators': { $ne: testCreatorId },
    };

    console.log('Query:', JSON.stringify(memberQuery, null, 2));

    const queryResults = await db.collection('members').find(memberQuery).toArray();
    console.log(`Query results: ${queryResults.length} members found`);

    queryResults.forEach((member, i) => {
      console.log(`   ${i + 1}. ${member.username} (${member._id})`);
    });

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

debugMembers();