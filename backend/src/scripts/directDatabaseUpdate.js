// Direct database update using the Member model exactly like the app does
const mongoose = require('mongoose');
const path = require('path');
const Member = require('../models/Member');

// Load .env file from backend root directory
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const directUpdate = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies';
    await mongoose.connect(mongoURI);

    console.log('✅ Connected to MongoDB');
    console.log(`📍 Database: ${mongoose.connection.name}`);

    // Use Mongoose model directly (same as app does)
    console.log('\n🔧 Updating using Mongoose Model...');

    // Update testuser1
    const result1 = await Member.findOneAndUpdate(
      { username: 'testuser1' },
      { profileComplete: true },
      { new: true }
    );

    // Update Silverfox1
    const result2 = await Member.findOneAndUpdate(
      { username: 'Silverfox1' },
      { profileComplete: true },
      { new: true }
    );

    console.log('✅ Update results:');
    console.log(`   testuser1: profileComplete = ${result1?.profileComplete}`);
    console.log(`   Silverfox1: profileComplete = ${result2?.profileComplete}`);

    // Also ensure they have User records that are active
    const User = require('../models/User');

    console.log('\n🔧 Ensuring User records are active...');

    if (result1?.user) {
      await User.findByIdAndUpdate(result1.user, { isActive: true });
      console.log(`✅ User ${result1.user} set to active`);
    }

    if (result2?.user) {
      await User.findByIdAndUpdate(result2.user, { isActive: true });
      console.log(`✅ User ${result2.user} set to active`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Updates completed - refresh MongoDB Compass to see changes');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

directUpdate();