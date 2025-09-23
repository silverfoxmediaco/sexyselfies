// Script to add missing profile fields to existing creators
const mongoose = require('mongoose');
const Creator = require('../models/Creator');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const addMissingProfileFields = async () => {
  try {
    console.log('🔍 Finding creators with missing profile fields...');

    // Find creators missing gender, orientation, or bodyType
    const creatorsToUpdate = await Creator.find({
      $or: [
        { gender: { $exists: false } },
        { orientation: { $exists: false } },
        { bodyType: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${creatorsToUpdate.length} creators with missing fields`);

    if (creatorsToUpdate.length === 0) {
      console.log('✅ All creators already have complete profile fields');
      return;
    }

    // Update each creator with default/placeholder values
    let updatedCount = 0;
    for (const creator of creatorsToUpdate) {
      const updateFields = {};

      // Add missing fields with default values
      if (!creator.gender) {
        updateFields.gender = 'female'; // Default to female (can be changed in profile setup)
      }

      if (!creator.orientation) {
        updateFields.orientation = 'straight'; // Default orientation
      }

      if (!creator.bodyType) {
        updateFields.bodyType = 'average'; // Default body type
      }

      // Update the creator
      await Creator.findByIdAndUpdate(creator._id, updateFields);

      console.log(`✅ Updated creator: ${creator.username || creator.displayName} (${creator._id})`);
      console.log(`   Added fields: ${Object.keys(updateFields).join(', ')}`);

      updatedCount++;
    }

    console.log(`🎉 Successfully updated ${updatedCount} creators with missing profile fields`);
    console.log('💡 Note: These are default values. Creators can update them in their profile setup.');

  } catch (error) {
    console.error('❌ Error updating creators:', error);
  }
};

const runScript = async () => {
  await connectDB();
  await addMissingProfileFields();

  console.log('🔄 Disconnecting from MongoDB...');
  await mongoose.disconnect();
  console.log('✅ Script completed successfully');
  process.exit(0);
};

// Run the script
if (require.main === module) {
  runScript().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { addMissingProfileFields };