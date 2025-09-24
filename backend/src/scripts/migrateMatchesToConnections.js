// Script to migrate data from matches to connections collection
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    return mongoose.connection.db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const migrateData = async () => {
  const db = await connectDB();

  try {
    console.log('🔄 Migrating data from matches to connections...');

    // Get all documents from matches collection
    const matchesData = await db.collection('matches').find({}).toArray();
    console.log(`📊 Found ${matchesData.length} documents in matches collection`);

    if (matchesData.length === 0) {
      console.log('📭 No data to migrate');
      return;
    }

    // Insert all data into connections collection with username field
    const connectionsData = matchesData.map(doc => ({
      ...doc,
      username: '' // Add empty username field that will be populated later
    }));

    await db.collection('connections').insertMany(connectionsData);
    console.log(`✅ Successfully migrated ${connectionsData.length} documents to connections collection`);

    // Verify the migration
    const connectionsCount = await db.collection('connections').countDocuments();
    console.log(`📊 Connections collection now has ${connectionsCount} documents`);

    // Now drop the matches collection
    await db.collection('matches').drop();
    console.log('🗑️ Dropped matches collection');

  } catch (error) {
    console.error('❌ Error during migration:', error);
  }

  await mongoose.disconnect();
  process.exit(0);
};

migrateData();