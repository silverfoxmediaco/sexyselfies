// Script to properly check creators and connections data
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

const checkData = async () => {
  try {
    console.log('🔍 Checking database collections...');

    // Check creators collection directly
    console.log('\n👩‍🎨 CREATORS:');
    const creators = await Creator.find({}).populate('user', 'email username');
    console.log(`   Total creators: ${creators.length}`);

    creators.forEach((creator, i) => {
      console.log(`   ${i+1}. ID: ${creator._id}`);
      console.log(`      Username: ${creator.username || 'NO USERNAME'}`);
      console.log(`      Display Name: ${creator.displayName || 'NO DISPLAY NAME'}`);
      console.log(`      User Email: ${creator.user?.email || 'NO USER EMAIL'}`);
      console.log('');
    });

    // Check members collection
    console.log('\n👥 MEMBERS:');
    const members = await Member.find({}).populate('user', 'email username');
    console.log(`   Total members: ${members.length}`);

    members.slice(0, 3).forEach((member, i) => {
      console.log(`   ${i+1}. ID: ${member._id}`);
      console.log(`      Username: ${member.username || 'NO USERNAME'}`);
      console.log(`      Display Name: ${member.displayName || 'NO DISPLAY NAME'}`);
      console.log(`      User Email: ${member.user?.email || 'NO USER EMAIL'}`);
      console.log('');
    });

    // Check connections collection
    console.log('\n🔗 CONNECTIONS:');
    const connections = await Connection.find({})
      .populate('member', 'username displayName')
      .populate('creator', 'username displayName');

    console.log(`   Total connections: ${connections.length}`);

    if (connections.length === 0) {
      console.log('   📭 No connections found');

      console.log('\n💡 SUGGESTION: Create connections between existing creators and members');
      console.log('   Available creators:', creators.length);
      console.log('   Available members:', members.length);

      if (creators.length > 0 && members.length > 0) {
        console.log('\n🔧 Can create connections between:');
        console.log(`   Creator: ${creators[0].username || creators[0].displayName} (${creators[0]._id})`);
        console.log(`   Member: ${members[0].username || members[0].displayName} (${members[0]._id})`);
      }
    } else {
      connections.forEach((conn, i) => {
        console.log(`   ${i+1}. Connection ${conn._id}:`);
        console.log(`      Member: ${conn.member?.username || conn.member?.displayName || 'NO NAME'}`);
        console.log(`      Creator: ${conn.creator?.username || conn.creator?.displayName || 'NO NAME'}`);
        console.log(`      Status: ${conn.status}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error checking data:', error);
  }
};

const runCheck = async () => {
  await connectDB();
  await checkData();

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

module.exports = { checkData };