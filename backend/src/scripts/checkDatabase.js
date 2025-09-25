#!/usr/bin/env node

/**
 * Database Diagnostic Script
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
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection String: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies'}`);
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

const checkDatabase = async () => {
  try {
    console.log('\n🔍 Database Diagnostic Report\n');

    // Check all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Collections in database:`);
    collections.forEach((collection, index) => {
      console.log(`   ${index + 1}. ${collection.name}`);
    });

    // Check creators collection specifically
    console.log(`\n👥 Creators collection:`);
    const creatorCount = await Creator.countDocuments();
    console.log(`   Total creators: ${creatorCount}`);

    if (creatorCount > 0) {
      const creators = await Creator.find({}, '_id username displayName createdAt').sort({ createdAt: -1 }).limit(10);
      console.log(`   Recent creators:`);
      creators.forEach((creator, index) => {
        console.log(`   ${index + 1}. ${creator._id} | "${creator.username}" | "${creator.displayName}" | ${creator.createdAt}`);
      });
    }

    // Search for creators with IDs similar to what we're looking for
    console.log(`\n🔍 Searching for creators with similar IDs:`);
    const searchPatterns = [
      '68d2b6748e72aae35ab19ca0',
      '68d2b6758e72aae35ab19ca2'
    ];

    for (const pattern of searchPatterns) {
      console.log(`\n   Looking for: ${pattern}`);
      try {
        if (mongoose.Types.ObjectId.isValid(pattern)) {
          const creator = await Creator.findById(pattern);
          if (creator) {
            console.log(`   ✅ FOUND: ${creator.username} | ${creator.displayName}`);
          } else {
            console.log(`   ❌ Not found`);
          }
        } else {
          console.log(`   ❌ Invalid ObjectId format`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // Check if there are any creators with "adam" in username
    console.log(`\n🔍 Searching for creators with "adam" in username/displayName:`);
    const adamCreators = await Creator.find({
      $or: [
        { username: { $regex: /adam/i } },
        { displayName: { $regex: /adam/i } }
      ]
    });

    if (adamCreators.length > 0) {
      adamCreators.forEach(creator => {
        console.log(`   ✅ Found: ${creator._id} | "${creator.username}" | "${creator.displayName}"`);
      });
    } else {
      console.log(`   ❌ No creators found with "adam"`);
    }

  } catch (error) {
    console.error('❌ Error during database check:', error);
  }
};

// Run the script
const main = async () => {
  await connectDB();
  await checkDatabase();
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

module.exports = { checkDatabase };