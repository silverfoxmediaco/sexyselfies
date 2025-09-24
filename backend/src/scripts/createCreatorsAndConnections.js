// Script to create test creators and connections with proper usernames
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Creator = require('../models/Creator');
const Member = require('../models/Member');
const Connection = require('../models/Connections');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createTestCreators = async () => {
  try {
    console.log('👩‍🎨 Creating test creators...');

    const testCreators = [
      {
        username: 'creator1',
        email: 'creator1@test.com',
        displayName: 'Sophia Belle',
        gender: 'female',
        orientation: 'straight',
        bodyType: 'curvy',
        bio: 'Creating exclusive content for my amazing fans! 💋'
      },
      {
        username: 'creator2',
        email: 'creator2@test.com',
        displayName: 'Luna Star',
        gender: 'female',
        orientation: 'bisexual',
        bodyType: 'athletic',
        bio: 'Fitness model sharing my journey and exclusive photos ✨'
      },
      {
        username: 'creator3',
        email: 'creator3@test.com',
        displayName: 'Isabella Rose',
        gender: 'female',
        orientation: 'straight',
        bodyType: 'slim',
        bio: 'Artistic content creator with a passion for photography 📸'
      }
    ];

    let createdCount = 0;
    const createdCreators = [];

    for (const creatorData of testCreators) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: creatorData.email });
        if (existingUser) {
          console.log(`⚠️  User ${creatorData.email} already exists, skipping...`);
          // Try to find existing creator
          const existingCreator = await Creator.findOne({ user: existingUser._id });
          if (existingCreator) {
            createdCreators.push(existingCreator);
          }
          continue;
        }

        // Create User account
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = new User({
          email: creatorData.email,
          password: hashedPassword,
          role: 'creator',
          isActive: true,
          emailVerified: true
        });
        await user.save();

        // Create Creator profile
        const creator = new Creator({
          user: user._id,
          username: creatorData.username,
          displayName: creatorData.displayName,
          gender: creatorData.gender,
          orientation: creatorData.orientation,
          bodyType: creatorData.bodyType,
          bio: creatorData.bio,
          profileComplete: true,
          lastActive: new Date(),
          age: 25, // Default age
          contentPrice: 2.99
        });
        await creator.save();

        console.log(`✅ Created creator: ${creatorData.username} (${creatorData.displayName})`);
        createdCreators.push(creator);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creating creator ${creatorData.username}:`, error.message);
      }
    }

    console.log(`🎉 Successfully created ${createdCount} test creators`);
    return createdCreators;

  } catch (error) {
    console.error('❌ Error creating test creators:', error);
    return [];
  }
};

const createTestConnections = async (creators, members) => {
  try {
    console.log('\n🔗 Creating test connections...');

    if (creators.length === 0 || members.length === 0) {
      console.log('❌ No creators or members available to create connections');
      return [];
    }

    const connections = [];

    // Create connections between first 3 creators and first 3 members
    const connectionsToCreate = [
      { creatorIndex: 0, memberIndex: 0, status: 'active', isConnected: true },
      { creatorIndex: 0, memberIndex: 1, status: 'pending', isConnected: false },
      { creatorIndex: 1, memberIndex: 0, status: 'active', isConnected: true },
      { creatorIndex: 1, memberIndex: 2, status: 'active', isConnected: true },
      { creatorIndex: 2, memberIndex: 1, status: 'pending', isConnected: false },
    ];

    for (const connData of connectionsToCreate) {
      try {
        if (connData.creatorIndex >= creators.length || connData.memberIndex >= members.length) {
          continue;
        }

        const creator = creators[connData.creatorIndex];
        const member = members[connData.memberIndex];

        // Check if connection already exists
        const existingConnection = await Connection.findOne({
          creator: creator._id,
          member: member._id
        });

        if (existingConnection) {
          console.log(`⚠️  Connection already exists between ${creator.username} and ${member.username}`);
          connections.push(existingConnection);
          continue;
        }

        // Create new connection
        const connection = new Connection({
          creator: creator._id,
          member: member._id,
          status: connData.status,
          isConnected: connData.isConnected,
          memberLiked: true,
          creatorLiked: connData.isConnected,
          creatorAccepted: connData.isConnected,
          connectedAt: connData.isConnected ? new Date() : null,
          lastInteraction: new Date(),
          totalSpent: Math.floor(Math.random() * 100), // Random spending
          messageCount: Math.floor(Math.random() * 20) // Random message count
        });

        await connection.save();
        connections.push(connection);

        console.log(`✅ Created connection: ${creator.username} ↔ ${member.username} (${connData.status})`);

      } catch (error) {
        console.error(`❌ Error creating connection:`, error.message);
      }
    }

    console.log(`🎉 Successfully created ${connections.length} test connections`);
    return connections;

  } catch (error) {
    console.error('❌ Error creating test connections:', error);
    return [];
  }
};

const verifyConnectionsWithUsernames = async () => {
  try {
    console.log('\n🔍 Verifying connections have proper usernames...');

    const connections = await Connection.find({})
      .populate('creator', 'username displayName')
      .populate('member', 'username displayName')
      .limit(10);

    console.log(`📊 Found ${connections.length} connections in database`);

    connections.forEach((conn, i) => {
      console.log(`\n🔗 Connection ${i + 1}:`);
      console.log(`   ID: ${conn._id}`);
      console.log(`   Creator: ${conn.creator?.username || 'NO USERNAME'} (${conn.creator?.displayName || 'NO DISPLAY NAME'})`);
      console.log(`   Member: ${conn.member?.username || 'NO USERNAME'} (${conn.member?.displayName || 'NO DISPLAY NAME'})`);
      console.log(`   Status: ${conn.status}`);
      console.log(`   Connected: ${conn.isConnected}`);
      console.log(`   Total Spent: $${conn.totalSpent || 0}`);
      console.log(`   Messages: ${conn.messageCount || 0}`);
    });

    const missingUsernames = connections.filter(conn =>
      !conn.creator?.username || !conn.member?.username
    );

    if (missingUsernames.length > 0) {
      console.log(`\n⚠️  ${missingUsernames.length} connections missing username data`);
      return false;
    } else {
      console.log('\n✅ All connections have proper username data');
      return true;
    }

  } catch (error) {
    console.error('❌ Error verifying connections:', error);
    return false;
  }
};

const runScript = async () => {
  await connectDB();

  // Get existing members
  const members = await Member.find({}).limit(5);
  console.log(`📊 Found ${members.length} existing members`);

  // Create test creators
  const creators = await createTestCreators();

  if (creators.length > 0) {
    // Create test connections
    await createTestConnections(creators, members);

    // Verify connections have usernames
    await verifyConnectionsWithUsernames();
  }

  console.log('\n🔄 Disconnecting from MongoDB...');
  await mongoose.disconnect();
  console.log('✅ Script completed successfully');
  process.exit(0);
};

if (require.main === module) {
  runScript().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { createTestCreators, createTestConnections };