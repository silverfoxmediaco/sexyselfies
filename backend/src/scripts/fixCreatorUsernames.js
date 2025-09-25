#!/usr/bin/env node

/**
 * Fix Creator Usernames Script
 *
 * This script ensures all creators have proper usernames:
 * 1. If username is missing/empty, generate from displayName
 * 2. If displayName is also missing, use fallback pattern
 * 3. Ensure usernames are unique
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

// Generate username from displayName
const generateUsernameFromDisplayName = (displayName) => {
  if (!displayName) return null;

  return displayName
    .toLowerCase()
    .replace(/\s+/g, '') // Remove spaces
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .substring(0, 20); // Limit length
};

// Generate fallback username
const generateFallbackUsername = (creatorId) => {
  return `creator${creatorId.toString().slice(-8)}`;
};

// Check if username is unique
const isUsernameUnique = async (username, excludeId = null) => {
  const query = { username };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await Creator.findOne(query);
  return !existing;
};

// Make username unique by adding number suffix
const makeUsernameUnique = async (baseUsername, excludeId = null) => {
  let username = baseUsername;
  let counter = 1;

  while (!(await isUsernameUnique(username, excludeId))) {
    username = `${baseUsername}${counter}`;
    counter++;

    // Safety check to avoid infinite loop
    if (counter > 1000) {
      username = `${baseUsername}${Date.now()}`;
      break;
    }
  }

  return username;
};

// Main function to fix creator usernames
const fixCreatorUsernames = async () => {
  try {
    console.log('🔧 Starting to fix creator usernames...\n');

    // Find all creators
    const creators = await Creator.find({});
    console.log(`📊 Found ${creators.length} creators total\n`);

    // Find creators without proper usernames
    const creatorsToFix = creators.filter(creator =>
      !creator.username ||
      creator.username.trim() === '' ||
      creator.username.length < 3
    );

    console.log(`🎯 Found ${creatorsToFix.length} creators that need username fixes:\n`);

    if (creatorsToFix.length === 0) {
      console.log('✅ All creators already have valid usernames!');
      return;
    }

    // Fix each creator
    let fixedCount = 0;

    for (const creator of creatorsToFix) {
      try {
        console.log(`🔨 Fixing creator ${creator._id}:`);
        console.log(`   Current username: "${creator.username}"`);
        console.log(`   Display name: "${creator.displayName}"`);

        let newUsername;

        // Try to generate from displayName first
        if (creator.displayName && creator.displayName.trim() !== '') {
          const baseUsername = generateUsernameFromDisplayName(creator.displayName);
          if (baseUsername && baseUsername.length >= 3) {
            newUsername = await makeUsernameUnique(baseUsername, creator._id);
            console.log(`   ✨ Generated from displayName: "${newUsername}"`);
          }
        }

        // If still no username, use fallback
        if (!newUsername) {
          const fallbackUsername = generateFallbackUsername(creator._id);
          newUsername = await makeUsernameUnique(fallbackUsername, creator._id);
          console.log(`   🔄 Using fallback: "${newUsername}"`);
        }

        // Update the creator
        await Creator.findByIdAndUpdate(creator._id, {
          username: newUsername
        });

        console.log(`   ✅ Updated successfully!\n`);
        fixedCount++;

      } catch (error) {
        console.error(`   ❌ Error fixing creator ${creator._id}:`, error.message);
      }
    }

    console.log(`\n🎉 Fixed ${fixedCount} out of ${creatorsToFix.length} creators`);

    // Verify the fix
    console.log('\n🔍 Verifying fixes...');
    const stillBrokenCreators = await Creator.find({
      $or: [
        { username: { $exists: false } },
        { username: '' },
        { username: { $regex: /^.{0,2}$/ } } // Less than 3 characters
      ]
    });

    if (stillBrokenCreators.length === 0) {
      console.log('✅ All creators now have valid usernames!');
    } else {
      console.log(`⚠️  ${stillBrokenCreators.length} creators still need fixing`);
      stillBrokenCreators.forEach(creator => {
        console.log(`   - ${creator._id}: "${creator.username}"`);
      });
    }

  } catch (error) {
    console.error('❌ Error during fix process:', error);
  }
};

// Run the script
const main = async () => {
  await connectDB();
  await fixCreatorUsernames();
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

module.exports = { fixCreatorUsernames };