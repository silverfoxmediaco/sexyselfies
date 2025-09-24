// Script to check connections data and see what usernames are missing
const mongoose = require('mongoose');
const Connection = require('../models/Connections');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkConnections = async () => {
  try {
    console.log('🔍 Checking connections data...');

    // Get all connections
    const connections = await Connection.find({})
      .populate('member', 'username displayName')
      .populate('creator', 'username displayName')
      .limit(10);

    console.log(`📊 Found ${connections.length} connections in database`);

    if (connections.length === 0) {
      console.log('📭 No connections found in database');

      // Check if we have members and creators to potentially create connections
      const members = await Member.find({}).limit(3);
      const creators = await Creator.find({}).limit(3);

      console.log(`👥 Found ${members.length} members and ${creators.length} creators`);

      if (members.length > 0 && creators.length > 0) {
        console.log('\n💡 Sample members available:');
        members.forEach((member, i) => {
          console.log(`   ${i+1}. ID: ${member._id}, Username: ${member.username}`);
        });

        console.log('\n💡 Sample creators available:');
        creators.forEach((creator, i) => {
          console.log(`   ${i+1}. ID: ${creator._id}, Username: ${creator.username}`);
        });
      }

      return;
    }

    // Show connection details
    console.log('\n📋 Connection Details:');
    connections.forEach((connection, index) => {
      console.log(`\n🔗 Connection ${index + 1}:`);
      console.log(`   ID: ${connection._id}`);
      console.log(`   Member: ${connection.member?.username || connection.member?.displayName || 'NO NAME'} (${connection.member?._id || 'NO ID'})`);
      console.log(`   Creator: ${connection.creator?.username || connection.creator?.displayName || 'NO NAME'} (${connection.creator?._id || 'NO ID'})`);
      console.log(`   Status: ${connection.status}`);
      console.log(`   Connected: ${connection.isConnected}`);
      console.log(`   Last Interaction: ${connection.lastInteraction}`);
      console.log(`   Total Spent: $${connection.totalSpent || 0}`);
    });

    // Check for connections with missing usernames
    const connectionsWithMissingData = connections.filter(conn =>
      !conn.member?.username || !conn.creator?.username
    );

    if (connectionsWithMissingData.length > 0) {
      console.log(`\n⚠️  Found ${connectionsWithMissingData.length} connections with missing username data`);

      console.log('\n🔧 Missing data details:');
      connectionsWithMissingData.forEach((conn, i) => {
        console.log(`   ${i+1}. Connection ${conn._id}:`);
        console.log(`      Member: ${conn.member ? 'EXISTS but no username' : 'MISSING REFERENCE'}`);
        console.log(`      Creator: ${conn.creator ? 'EXISTS but no username' : 'MISSING REFERENCE'}`);
      });
    } else {
      console.log('\n✅ All connections have proper username data');
    }

  } catch (error) {
    console.error('❌ Error checking connections:', error);
  }
};

const runCheck = async () => {
  await connectDB();
  await checkConnections();

  console.log('\n🔄 Disconnecting from MongoDB...');
  await mongoose.disconnect();
  console.log('✅ Check completed successfully');
  process.exit(0);
};

if (require.main === module) {
  runCheck().catch(error => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
}

module.exports = { checkConnections };