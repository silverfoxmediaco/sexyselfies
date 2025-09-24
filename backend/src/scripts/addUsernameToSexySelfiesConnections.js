// Script to add username field to all documents in sexyselfies.connections collection
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

const addUsernameToConnections = async () => {
  try {
    const db = await connectDB();

    console.log('🔍 Accessing sexyselfies database directly...');

    // Explicitly use the sexyselfies database
    const sexySelfiesDB = db;

    // Get all connections from sexyselfies.connections collection
    console.log('📊 Counting documents in sexyselfies.connections...');
    const totalConnections = await sexySelfiesDB.collection('connections').countDocuments();
    console.log(`📊 Found ${totalConnections} connections in sexyselfies.connections collection`);

    if (totalConnections === 0) {
      console.log('📭 No connections found in sexyselfies.connections collection');
      return 0;
    }

    // Get all connections with member references
    console.log('🔄 Fetching all connections from sexyselfies.connections...');
    const connections = await sexySelfiesDB.collection('connections').find({}).toArray();

    console.log(`📋 Processing ${connections.length} connections...`);

    // Get all members from sexyselfies.members collection to create a lookup map
    console.log('👥 Fetching all members from sexyselfies.members...');
    const members = await sexySelfiesDB.collection('members').find({}).toArray();

    // Create a lookup map: memberId -> username
    const memberUsernameMap = new Map();
    members.forEach(member => {
      memberUsernameMap.set(member._id.toString(), member.username);
    });

    console.log(`📋 Created username lookup map for ${members.length} members`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < connections.length; i++) {
      const connection = connections[i];

      try {
        // Show progress
        if ((i + 1) % 5 === 0 || i === 0 || i === connections.length - 1) {
          console.log(`⏳ Processing connection ${i + 1}/${connections.length}...`);
        }

        // Check if username field already exists and has a value
        if (connection.username && connection.username.trim() !== '') {
          console.log(`⚠️  Connection ${connection._id} already has username: "${connection.username}", skipping...`);
          skipCount++;
          continue;
        }

        let usernameValue = '';

        // Get username from member lookup
        if (connection.member) {
          const memberId = connection.member.toString();
          usernameValue = memberUsernameMap.get(memberId) || '';

          if (!usernameValue) {
            console.log(`⚠️  Member ${memberId} not found in members collection or has no username`);
          }
        } else {
          console.log(`⚠️  Connection ${connection._id} has no member reference`);
          usernameValue = '';
        }

        // Update the connection document with username field
        const result = await sexySelfiesDB.collection('connections').updateOne(
          { _id: connection._id },
          { $set: { username: usernameValue } }
        );

        if (result.modifiedCount > 0) {
          successCount++;
          console.log(`✅ Updated connection ${connection._id}: username = "${usernameValue}"`);
        } else {
          console.log(`⚠️  Connection ${connection._id} update had no effect`);
        }

      } catch (error) {
        console.error(`❌ Error updating connection ${connection._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n🎉 Processing completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successfully updated: ${successCount} connections`);
    console.log(`   ⚠️  Skipped (already had username): ${skipCount} connections`);
    console.log(`   ❌ Errors: ${errorCount} connections`);
    console.log(`   📋 Total processed: ${connections.length} connections`);

    return successCount;

  } catch (error) {
    console.error('❌ Error in addUsernameToConnections:', error);
    throw error;
  }
};

const runScript = async () => {
  try {
    console.log('🚀 Starting addUsernameToSexySelfiesConnections script...');
    console.log('🎯 Target: sexyselfies database → connections collection');

    const updatedCount = await addUsernameToConnections();

    console.log(`\n🔄 Closing database connection...`);
    await mongoose.connection.close();
    console.log('✅ Database connection closed');

    console.log(`\n🎯 Script completed successfully!`);
    console.log(`📈 Total connections updated with username field: ${updatedCount}`);

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
  addUsernameToConnections
};