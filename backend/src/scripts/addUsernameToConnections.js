// Script to add username field to all documents in MongoDB connections collection
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Connection = require('../models/Connections');
const User = require('../models/User');
const Member = require('../models/Member'); // Import Member model to register schema

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    console.log(`📍 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const addUsernameToConnections = async () => {
  try {
    console.log('🔍 Finding all connections in the database...');

    // Get total count of connections
    const totalConnections = await Connection.countDocuments();
    console.log(`📊 Found ${totalConnections} connections to process`);

    if (totalConnections === 0) {
      console.log('📭 No connections found in database');
      return 0;
    }

    // Find all connections and populate member field
    console.log('🔄 Fetching connections with member data...');
    const connections = await Connection.find({})
      .populate('member', 'username displayName');

    console.log(`📋 Processing ${connections.length} connections...`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < connections.length; i++) {
      const connection = connections[i];

      try {
        // Show progress every 10 connections
        if ((i + 1) % 10 === 0 || i === 0) {
          console.log(`⏳ Processing connection ${i + 1}/${connections.length}...`);
        }

        // Check if username field already exists and has a value
        if (connection.username && connection.username.trim() !== '') {
          console.log(`⚠️  Connection ${connection._id} already has username field with value "${connection.username}", skipping...`);
          skipCount++;
          continue;
        }

        let usernameValue = '';

        // Handle edge cases
        if (!connection.member) {
          console.log(`⚠️  Connection ${connection._id} has no member reference`);
          usernameValue = '';
        } else if (!connection.member.username) {
          console.log(`⚠️  Member ${connection.member._id} has no username, using display name or empty string`);
          usernameValue = connection.member.displayName || '';
        } else {
          usernameValue = connection.member.username;
        }

        // Update the connection document with username field
        await Connection.findByIdAndUpdate(
          connection._id,
          {
            $set: { username: usernameValue }
          },
          { new: true }
        );

        successCount++;

        if (connection.member) {
          console.log(`✅ Updated connection ${connection._id}: username = "${usernameValue}"`);
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
    console.log('🚀 Starting addUsernameToConnections script...');
    await connectDB();

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
  addUsernameToConnections,
  connectDB
};