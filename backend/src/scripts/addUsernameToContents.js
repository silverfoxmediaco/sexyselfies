// Script to add username field to all documents in sexyselfies.contents collection
const mongoose = require('mongoose');
const path = require('path');

// Load .env file from backend root directory
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies';

    // Explicitly connect to the sexyselfies database
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    console.log(`📍 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Connection URI: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials

    return mongoose.connection.db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const addUsernameToContents = async () => {
  try {
    const db = await connectDB();

    console.log('🔍 Accessing sexyselfies database directly...');

    // Explicitly use the sexyselfies database
    const sexySelfiesDB = db;

    // Get all contents from sexyselfies.contents collection
    console.log('📊 Counting documents in sexyselfies.contents...');
    const totalContents = await sexySelfiesDB.collection('contents').countDocuments();
    console.log(`📊 Found ${totalContents} contents in sexyselfies.contents collection`);

    if (totalContents === 0) {
      console.log('📭 No contents found in sexyselfies.contents collection');
      return 0;
    }

    // Get all contents with creator references
    console.log('🔄 Fetching all contents from sexyselfies.contents...');
    const contents = await sexySelfiesDB.collection('contents').find({}).toArray();

    console.log(`📋 Processing ${contents.length} contents...`);

    // Get all creators from sexyselfies.creators collection to create a lookup map
    console.log('👩‍🎨 Fetching all creators from sexyselfies.creators...');
    const creators = await sexySelfiesDB.collection('creators').find({}).toArray();

    // Create a lookup map: creatorId -> username
    const creatorUsernameMap = new Map();
    creators.forEach(creator => {
      creatorUsernameMap.set(creator._id.toString(), creator.username);
    });

    console.log(`📋 Created username lookup map for ${creators.length} creators`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];

      try {
        // Show progress
        if ((i + 1) % 5 === 0 || i === 0 || i === contents.length - 1) {
          console.log(`⏳ Processing content ${i + 1}/${contents.length}...`);
        }

        // Check if username field already exists and has a value
        if (content.username && content.username.trim() !== '') {
          console.log(`⚠️  Content ${content._id} already has username: "${content.username}", skipping...`);
          skipCount++;
          continue;
        }

        let usernameValue = '';

        // Get username from creator lookup
        if (content.creator) {
          const creatorId = content.creator.toString();
          usernameValue = creatorUsernameMap.get(creatorId) || '';

          if (!usernameValue) {
            console.log(`⚠️  Creator ${creatorId} not found in creators collection or has no username`);
          }
        } else {
          console.log(`⚠️  Content ${content._id} has no creator reference`);
          usernameValue = '';
        }

        // Update the content document with username field
        const result = await sexySelfiesDB.collection('contents').updateOne(
          { _id: content._id },
          { $set: { username: usernameValue } }
        );

        if (result.modifiedCount > 0) {
          successCount++;
          console.log(`✅ Updated content ${content._id}: username = "${usernameValue}"`);
        } else {
          console.log(`⚠️  Content ${content._id} update had no effect`);
        }

      } catch (error) {
        console.error(`❌ Error updating content ${content._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n🎉 Processing completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successfully updated: ${successCount} contents`);
    console.log(`   ⚠️  Skipped (already had username): ${skipCount} contents`);
    console.log(`   ❌ Errors: ${errorCount} contents`);
    console.log(`   📋 Total processed: ${contents.length} contents`);

    return successCount;

  } catch (error) {
    console.error('❌ Error in addUsernameToContents:', error);
    throw error;
  }
};

const runScript = async () => {
  try {
    console.log('🚀 Starting addUsernameToContents script...');
    console.log('🎯 Target: sexyselfies database → contents collection');

    const updatedCount = await addUsernameToContents();

    console.log(`\n🔄 Closing database connection...`);
    await mongoose.connection.close();
    console.log('✅ Database connection closed');

    console.log(`\n🎯 Script completed successfully!`);
    console.log(`📈 Total contents updated with username field: ${updatedCount}`);

    process.exit(0);

  } catch (error) {
    console.error('💥 Script failed:', error);

    // Ensure database connection is closed even on error
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('🔄 Database connection closed after error');
      }
    } catch (closeError) {
      console.error('❌ Error closing database connection:', closeError);
    }

    process.exit(1);
  }
};

// Run the script only if called directly (not imported)
if (require.main === module) {
  runScript();
}

module.exports = {
  addUsernameToContents
};