// Script to test current state of sexyselfies.connections collection
const mongoose = require('mongoose');
const path = require('path');

// Load .env file from backend root directory
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const testConnections = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies';
    await mongoose.connect(mongoURI);

    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📍 Database: ${mongoose.connection.name}`);

    const db = mongoose.connection.db;

    // Count total documents
    const totalCount = await db.collection('connections').countDocuments();
    console.log(`\n📊 Total connections: ${totalCount}`);

    // Count documents with username field (any value)
    const withUsernameCount = await db.collection('connections').countDocuments({
      username: { $exists: true }
    });
    console.log(`✅ With username field: ${withUsernameCount}`);

    // Count documents with actual username values (not empty)
    const withUsernameValueCount = await db.collection('connections').countDocuments({
      username: { $exists: true, $ne: "" }
    });
    console.log(`🎯 With actual username values: ${withUsernameValueCount}`);

    // Count documents with empty usernames
    const emptyUsernameCount = await db.collection('connections').countDocuments({
      username: ""
    });
    console.log(`⚠️  With empty usernames: ${emptyUsernameCount}`);

    // Show sample documents
    console.log('\n📋 Sample documents:');
    const samples = await db.collection('connections').find({}).limit(3).toArray();

    samples.forEach((doc, i) => {
      console.log(`\n${i + 1}. Connection ${doc._id}:`);
      console.log(`   Member ID: ${doc.member}`);
      console.log(`   Creator ID: ${doc.creator}`);
      console.log(`   Username: "${doc.username || 'MISSING FIELD'}"`);
      console.log(`   Status: ${doc.status}`);
    });

    // Check for documents missing username field entirely
    const missingUsernameCount = await db.collection('connections').countDocuments({
      username: { $exists: false }
    });
    console.log(`\n❌ Missing username field entirely: ${missingUsernameCount}`);

    await mongoose.disconnect();
    console.log('\n✅ Test completed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testConnections();