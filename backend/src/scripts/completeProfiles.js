// Script to mark member profiles as complete
const mongoose = require('mongoose');
const path = require('path');

// Load .env file from backend root directory
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const completeProfiles = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies';
    await mongoose.connect(mongoURI);

    console.log('✅ Connected to MongoDB');
    console.log(`📍 Database: ${mongoose.connection.name}`);

    const db = mongoose.connection.db;

    // Get all members
    const members = await db.collection('members').find({}).toArray();
    console.log(`\n📊 Found ${members.length} members`);

    let updated = 0;

    for (let member of members) {
      console.log(`\n🔧 Checking member: ${member.username} (${member._id})`);
      console.log(`   ProfileComplete: ${member.profileComplete}`);
      console.log(`   Username: ${member.username ? '✅' : '❌'}`);
      console.log(`   Gender: ${member.gender ? '✅' : '❌'}`);

      const updates = {};

      // Mark profile as complete if it has basic required fields
      if (member.profileComplete !== true) {
        // Check if member has minimum required info
        const hasBasicInfo = member.username && member.gender;

        if (hasBasicInfo) {
          updates.profileComplete = true;
          console.log('   ✅ Marking profile as complete (has username + gender)');
        } else {
          // Add missing basic requirements
          if (!member.gender) {
            updates.gender = 'male'; // Default for testing - in real app user would set this
            console.log('   ✅ Added default gender');
          }
          updates.profileComplete = true;
          console.log('   ✅ Marking profile as complete with defaults');
        }
      } else {
        console.log('   ℹ️  Profile already complete');
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        await db.collection('members').updateOne(
          { _id: member._id },
          { $set: updates }
        );
        updated++;
        console.log('   💾 Member profile updated');
      }
    }

    console.log(`\n🎉 Updated ${updated} member profiles!`);

    // Test the controller query
    console.log('\n🔍 TESTING CONTROLLER QUERY:');
    const testCreatorId = new mongoose.Types.ObjectId('68d0813059e40fde324d692c'); // Use actual creator ID from logs

    const memberQuery = {
      profileComplete: true,
      role: 'member',
      isActive: true,
    };

    console.log('Query:', JSON.stringify(memberQuery, null, 2));

    const queryResults = await db.collection('members').find(memberQuery).toArray();
    console.log(`✅ Query now finds: ${queryResults.length} members with complete profiles`);

    queryResults.forEach((member, i) => {
      console.log(`   ${i + 1}. ${member.username} - ProfileComplete: ${member.profileComplete}, Role: ${member.role}, Active: ${member.isActive}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done! Members should now appear in BrowseMembers page.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

completeProfiles();