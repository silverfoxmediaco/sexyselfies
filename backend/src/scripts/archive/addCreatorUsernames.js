const mongoose = require('mongoose');
require('dotenv').config();
const Creator = require('../models/Creator');

// Function to generate username from display name
function generateUsername(displayName) {
  if (!displayName) return `Creator${Math.floor(Math.random() * 1000)}`;

  // Remove spaces and special characters, keep PascalCase like members
  let username = displayName
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(''); // Join without spaces, PascalCase

  // Add random number suffix to ensure uniqueness
  const randomNum = Math.floor(Math.random() * 99) + 1;
  username += randomNum;

  return username;
}

// Function to check if username exists
async function isUsernameUnique(username) {
  const existingCreator = await Creator.findOne({ username });
  const Member = require('../models/Member');
  const existingMember = await Member.findOne({ username });

  return !existingCreator && !existingMember;
}

// Function to generate unique username
async function generateUniqueUsername(displayName) {
  let attempts = 0;
  let username;

  do {
    username = generateUsername(displayName);
    attempts++;

    // If we've tried 10 times, add timestamp to ensure uniqueness
    if (attempts > 10) {
      username =
        generateUsername(displayName) + Date.now().toString().slice(-4);
    }
  } while (!(await isUsernameUnique(username)) && attempts < 20);

  return username;
}

async function addUsernamesToCreators() {
  try {
    console.log('🚀 Starting creator username migration...');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find all creators without usernames
    const creators = await Creator.find({
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: '' },
      ],
    });

    console.log(`📋 Found ${creators.length} creators without usernames`);

    if (creators.length === 0) {
      console.log('✨ All creators already have usernames!');
      process.exit(0);
    }

    let updated = 0;
    let failed = 0;

    for (const creator of creators) {
      try {
        // Generate unique username
        const username = await generateUniqueUsername(creator.displayName);

        // Update creator with username
        await Creator.updateOne(
          { _id: creator._id },
          { $set: { username: username } }
        );

        console.log(`✅ ${creator.displayName} → ${username}`);
        updated++;
      } catch (error) {
        console.error(
          `❌ Failed to update ${creator.displayName}:`,
          error.message
        );
        failed++;
      }
    }

    console.log('\\n📊 Migration Results:');
    console.log(`✅ Successfully updated: ${updated} creators`);
    console.log(`❌ Failed: ${failed} creators`);
    console.log(`🎯 Total processed: ${updated + failed} creators`);

    // Verify results
    const creatorsWithUsernames = await Creator.countDocuments({
      username: { $exists: true, $ne: null, $ne: '' },
    });
    const totalCreators = await Creator.countDocuments();

    console.log('\\n🔍 Verification:');
    console.log(
      `📈 Creators with usernames: ${creatorsWithUsernames}/${totalCreators}`
    );

    if (creatorsWithUsernames === totalCreators) {
      console.log('🎉 All creators now have usernames!');
    } else {
      console.log('⚠️  Some creators still missing usernames');
    }
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from database');
    process.exit(0);
  }
}

// Run the migration
if (require.main === module) {
  addUsernamesToCreators();
}

module.exports = { addUsernamesToCreators };
