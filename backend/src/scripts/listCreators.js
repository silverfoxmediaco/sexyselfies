#!/usr/bin/env node

/**
 * List All Creators Script
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

const listCreators = async () => {
  try {
    console.log('📋 All creators in database:\n');

    const creators = await Creator.find({}, 'username displayName profileImage isVerified createdAt').sort({ createdAt: -1 });

    if (creators.length === 0) {
      console.log('❌ No creators found in database');
      return;
    }

    console.log(`📊 Found ${creators.length} creators:\n`);

    creators.forEach((creator, index) => {
      console.log(`${index + 1}. ID: ${creator._id}`);
      console.log(`   Username: "${creator.username || 'NO USERNAME'}"`);
      console.log(`   Display Name: "${creator.displayName || 'NO DISPLAY NAME'}"`);
      console.log(`   Verified: ${creator.isVerified ? '✅' : '❌'}`);
      console.log(`   Created: ${creator.createdAt}`);
      console.log(`   Profile URL: /creator/${creator.username || creator._id}`);
      console.log('');
    });

    // Show working URLs
    console.log('🔗 Working creator profile URLs:');
    creators
      .filter(c => c.username && c.username.trim() !== '')
      .forEach(creator => {
        console.log(`   https://sexyselfies-frontend.onrender.com/creator/${creator.username}`);
      });

  } catch (error) {
    console.error('❌ Error listing creators:', error);
  }
};

// Run the script
const main = async () => {
  await connectDB();
  await listCreators();
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

module.exports = { listCreators };