#!/usr/bin/env node

/**
 * Check Specific Creator Script
 *
 * Check the details of the creator with ID 68d2b6758e72aae35ab19ca2
 */

const mongoose = require('mongoose');
const Creator = require('../models/Creator');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

const checkCreator = async () => {
  try {
    const creatorId = '68d2b6748e72aae35ab19ca0';
    console.log(`🔍 Looking for creator with ID: ${creatorId}\n`);

    // Check if it's a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(creatorId)) {
      console.log('❌ Invalid ObjectId format');
      return;
    }

    const creator = await Creator.findById(creatorId).populate('user', 'email lastLogin');

    if (!creator) {
      console.log('❌ Creator not found');
      return;
    }

    console.log('✅ Creator found!');
    console.log('📋 Creator details:');
    console.log(`   ID: ${creator._id}`);
    console.log(`   Username: "${creator.username}"`);
    console.log(`   Display Name: "${creator.displayName}"`);
    console.log(`   Bio: "${creator.bio || 'No bio'}"`);
    console.log(`   Profile Image: "${creator.profileImage || 'No profile image'}"`);
    console.log(`   Is Verified: ${creator.isVerified}`);
    console.log(`   Created: ${creator.createdAt}`);

    if (creator.user) {
      console.log(`   User Email: ${creator.user.email}`);
      console.log(`   Last Login: ${creator.user.lastLogin}`);
    }

    console.log('\n🔗 Expected URL should be:');
    if (creator.username && creator.username.trim() !== '') {
      console.log(`   /creator/${creator.username}`);
    } else {
      console.log(`   ⚠️  No username available, would use ID: /creator/${creator._id}`);
    }

    // Check all creators to see their usernames
    console.log('\n📊 All creators in database:');
    const allCreators = await Creator.find({}, 'username displayName').limit(10);

    allCreators.forEach((c, index) => {
      console.log(`   ${index + 1}. ID: ${c._id.toString().slice(-8)}... Username: "${c.username}" Display: "${c.displayName}"`);
    });

  } catch (error) {
    console.error('❌ Error checking creator:', error);
  }
};

// Run the script
const main = async () => {
  await connectDB();
  await checkCreator();
  await mongoose.connection.close();
  console.log('\n👋 Database connection closed. Script completed!');
  process.exit(0);
};

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { checkCreator };