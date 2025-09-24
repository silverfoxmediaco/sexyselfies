// Script to fix member records with missing required fields
const mongoose = require('mongoose');
const path = require('path');

// Load .env file from backend root directory
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const fixMembers = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies';
    await mongoose.connect(mongoURI);

    console.log('✅ Connected to MongoDB');
    console.log(`📍 Database: ${mongoose.connection.name}`);

    const db = mongoose.connection.db;

    // Get all members
    const members = await db.collection('members').find({}).toArray();
    console.log(`\n📊 Found ${members.length} members to fix`);

    let fixed = 0;

    for (let member of members) {
      console.log(`\n🔧 Fixing member: ${member.username} (${member._id})`);

      const updates = {};

      // Fix missing role
      if (!member.role) {
        updates.role = 'member';
        console.log('   ✅ Added role: member');
      }

      // Fix missing isActive
      if (member.isActive === undefined) {
        updates.isActive = true;
        console.log('   ✅ Added isActive: true');
      }

      // Fix missing privacy object
      if (!member.privacy) {
        updates.privacy = {
          discoverable: true,
          allowBulkMessages: true,
          allowSpecialOffers: true,
          blockedCreators: []
        };
        console.log('   ✅ Added privacy settings');
      }

      // Fix missing spending object
      if (!member.spending) {
        updates.spending = {
          tier: 'new',
          last30Days: 0,
          lifetime: 0,
          totalPurchases: 0,
          averagePurchase: 0
        };
        console.log('   ✅ Added spending defaults');
      }

      // Fix missing joinDate
      if (!member.joinDate) {
        updates.joinDate = member.createdAt || new Date();
        console.log('   ✅ Added joinDate');
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        await db.collection('members').updateOne(
          { _id: member._id },
          { $set: updates }
        );
        fixed++;
        console.log('   💾 Member updated successfully');
      } else {
        console.log('   ℹ️  Member already has all required fields');
      }
    }

    console.log(`\n🎉 Fixed ${fixed} members!`);

    // Test the query again
    console.log('\n🔍 TESTING QUERY AFTER FIXES:');
    const testCreatorId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

    const memberQuery = {
      role: 'member',
      isActive: true,
      'privacy.blockedCreators': { $ne: testCreatorId },
    };

    const queryResults = await db.collection('members').find(memberQuery).toArray();
    console.log(`✅ Query now finds: ${queryResults.length} members`);

    queryResults.forEach((member, i) => {
      console.log(`   ${i + 1}. ${member.username} - Role: ${member.role}, Active: ${member.isActive}, Spending Tier: ${member.spending.tier}`);
    });

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixMembers();