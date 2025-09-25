// Force update profileComplete using MongoDB updateOne with explicit verification
const mongoose = require('mongoose');
const path = require('path');

// Load .env file from backend root directory
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const forceUpdate = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies';
    await mongoose.connect(mongoURI);

    console.log('✅ Connected to MongoDB');
    console.log(`📍 Database: ${mongoose.connection.name}`);

    const db = mongoose.connection.db;

    // Get specific member by ID to verify current state
    const testMemberId = '68cf39feee4523038be8d16c';
    console.log(`\n🔍 Checking member ${testMemberId} BEFORE update:`);

    const beforeUpdate = await db.collection('members').findOne({
      _id: new mongoose.Types.ObjectId(testMemberId)
    });

    console.log(`   profileComplete: ${beforeUpdate?.profileComplete}`);
    console.log(`   username: ${beforeUpdate?.username}`);

    // Force update with explicit ObjectId and verification
    console.log(`\n🔧 FORCE UPDATING profileComplete to true...`);

    const updateResult1 = await db.collection('members').updateOne(
      { _id: new mongoose.Types.ObjectId('68cf39feee4523038be8d16c') },
      { $set: { profileComplete: true } }
    );

    const updateResult2 = await db.collection('members').updateOne(
      { _id: new mongoose.Types.ObjectId('68d1db4ce8ee33294a26024b') },
      { $set: { profileComplete: true } }
    );

    console.log(`✅ Update result 1 - matched: ${updateResult1.matchedCount}, modified: ${updateResult1.modifiedCount}`);
    console.log(`✅ Update result 2 - matched: ${updateResult2.matchedCount}, modified: ${updateResult2.modifiedCount}`);

    // Verify the update immediately
    console.log(`\n🔍 Verifying AFTER update:`);

    const afterUpdate1 = await db.collection('members').findOne({
      _id: new mongoose.Types.ObjectId('68cf39feee4523038be8d16c')
    });

    const afterUpdate2 = await db.collection('members').findOne({
      _id: new mongoose.Types.ObjectId('68d1db4ce8ee33294a26024b')
    });

    console.log(`   testuser1 profileComplete: ${afterUpdate1?.profileComplete}`);
    console.log(`   Silverfox1 profileComplete: ${afterUpdate2?.profileComplete}`);

    // Also try bulk update as backup
    console.log(`\n🔧 BULK UPDATE as backup...`);
    const bulkResult = await db.collection('members').updateMany(
      { username: { $in: ['testuser1', 'Silverfox1'] } },
      { $set: { profileComplete: true } }
    );

    console.log(`✅ Bulk update - matched: ${bulkResult.matchedCount}, modified: ${bulkResult.modifiedCount}`);

    // Final verification
    console.log(`\n🔍 FINAL VERIFICATION:`);
    const allMembers = await db.collection('members').find({}).toArray();

    allMembers.forEach((member, i) => {
      console.log(`   ${i + 1}. ${member.username}: profileComplete = ${member.profileComplete}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Update completed - check MongoDB Compass to verify');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

forceUpdate();