// Script to clean up any remaining creator preference database entries
const mongoose = require('mongoose');
const Creator = require('../models/Creator');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const cleanupPreferences = async () => {
  try {
    console.log('🧹 Cleaning up creator preference fields from database...');

    // Remove the preferences.minAge, preferences.maxAge, preferences.interestedIn, preferences.showInBrowse fields
    // but keep any other preferences (like notification settings)
    const result = await Creator.updateMany(
      {},
      {
        $unset: {
          'preferences.minAge': '',
          'preferences.maxAge': '',
          'preferences.interestedIn': '',
          'preferences.showInBrowse': ''
        }
      }
    );

    console.log(`✅ Cleaned up preferences fields from ${result.modifiedCount} creators`);

    // Also clean up any empty preferences objects
    const emptyPrefsResult = await Creator.updateMany(
      { 'preferences': {} },
      { $unset: { 'preferences': '' } }
    );

    console.log(`✅ Removed ${emptyPrefsResult.modifiedCount} empty preferences objects`);

  } catch (error) {
    console.error('❌ Error cleaning up preferences:', error);
  }
};

const runScript = async () => {
  await connectDB();
  await cleanupPreferences();

  console.log('🔄 Disconnecting from MongoDB...');
  await mongoose.disconnect();
  console.log('✅ Cleanup completed successfully');
  process.exit(0);
};

if (require.main === module) {
  runScript().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { cleanupPreferences };