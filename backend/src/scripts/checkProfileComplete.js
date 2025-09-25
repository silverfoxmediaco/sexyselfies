// Script to specifically check profileComplete field
const mongoose = require('mongoose');
const path = require('path');

// Load .env file from backend root directory
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const checkProfileComplete = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies';
    await mongoose.connect(mongoURI);

    console.log('✅ Connected to MongoDB');
    console.log(`📍 Database: ${mongoose.connection.name}`);

    const db = mongoose.connection.db;

    // Get all members with specific focus on profileComplete
    const members = await db.collection('members').find({}).toArray();
    console.log(`\n📊 Found ${members.length} members`);

    members.forEach((member, i) => {
      console.log(`\n${i + 1}. Member ${member.username}:`);
      console.log(`   _id: ${member._id}`);
      console.log(`   profileComplete: ${member.profileComplete} (type: ${typeof member.profileComplete})`);
      console.log(`   username: ${member.username}`);
      console.log(`   gender: ${member.gender}`);
      console.log(`   role: ${member.role}`);
      console.log(`   isActive: ${member.isActive}`);
    });

    // Force set profileComplete to true
    console.log('\n🔧 FORCE UPDATING profileComplete to true...');

    const result = await db.collection('members').updateMany(
      {},
      { $set: { profileComplete: true } }
    );

    console.log(`✅ Updated ${result.modifiedCount} members`);

    // Verify the update
    console.log('\n🔍 VERIFICATION:');
    const updatedMembers = await db.collection('members').find({}).toArray();

    updatedMembers.forEach((member, i) => {
      console.log(`   ${i + 1}. ${member.username}: profileComplete = ${member.profileComplete}`);
    });

    // Test the exact controller query
    console.log('\n🔍 TESTING CONTROLLER QUERY WITH PROFILECOMPLETE:');
    const controllerQuery = {
      profileComplete: true,
      role: 'member',
      isActive: true,
    };

    const queryResults = await db.collection('members').find(controllerQuery).toArray();
    console.log(`✅ Controller query finds: ${queryResults.length} members`);

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkProfileComplete();