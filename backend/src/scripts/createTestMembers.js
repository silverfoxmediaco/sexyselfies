// Script to create test members for Creator Browse Members functionality
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Member = require('../models/Member');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createTestMembers = async () => {
  try {
    console.log('👥 Creating test members...');

    const testMembers = [
      {
        username: 'member1',
        email: 'member1@test.com',
        displayName: 'Alex Johnson',
        gender: 'male',
        orientation: 'straight',
        bodyType: 'athletic',
        location: { country: 'United States' },
        bio: 'Love connecting with amazing creators!'
      },
      {
        username: 'member2',
        email: 'member2@test.com',
        displayName: 'Sarah Wilson',
        gender: 'female',
        orientation: 'bisexual',
        bodyType: 'curvy',
        location: { country: 'Canada' },
        bio: 'Looking for exclusive content and connections.'
      },
      {
        username: 'member3',
        email: 'member3@test.com',
        displayName: 'Mike Chen',
        gender: 'male',
        orientation: 'straight',
        bodyType: 'average',
        location: { country: 'United Kingdom' },
        bio: 'Supporting amazing creators and their content.'
      },
      {
        username: 'member4',
        email: 'member4@test.com',
        displayName: 'Emma Davis',
        gender: 'female',
        orientation: 'lesbian',
        bodyType: 'slim',
        location: { country: 'Australia' },
        bio: 'Passionate about supporting women creators.'
      },
      {
        username: 'member5',
        email: 'member5@test.com',
        displayName: 'James Rodriguez',
        gender: 'male',
        orientation: 'straight',
        bodyType: 'muscular',
        location: { country: 'Spain' },
        bio: 'Active member looking for quality content.'
      }
    ];

    let createdCount = 0;

    for (const memberData of testMembers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: memberData.email });
        if (existingUser) {
          console.log(`⚠️  User ${memberData.email} already exists, skipping...`);
          continue;
        }

        // Create User account
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = new User({
          email: memberData.email,
          password: hashedPassword,
          role: 'member',
          isActive: true,
          emailVerified: true
        });
        await user.save();

        // Create Member profile
        const member = new Member({
          user: user._id,
          username: memberData.username,
          displayName: memberData.displayName,
          gender: memberData.gender,
          orientation: memberData.orientation,
          bodyType: memberData.bodyType,
          bio: memberData.bio,
          location: memberData.location,
          profileComplete: true,
          lastActive: new Date(),
          preferences: {
            ageRange: [18, 55],
            interestedIn: ['female'], // Members interested in female creators
            showInBrowse: true
          }
        });
        await member.save();

        console.log(`✅ Created member: ${memberData.username} (${memberData.displayName})`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creating member ${memberData.username}:`, error.message);
      }
    }

    console.log(`🎉 Successfully created ${createdCount} test members`);

  } catch (error) {
    console.error('❌ Error creating test members:', error);
  }
};

const runScript = async () => {
  await connectDB();
  await createTestMembers();

  console.log('🔄 Disconnecting from MongoDB...');
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

module.exports = { createTestMembers };