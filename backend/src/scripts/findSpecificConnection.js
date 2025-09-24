// Script to find the specific connection ID you're looking at
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    console.log(`📍 Database: ${mongoose.connection.name}`);
    return mongoose.connection.db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const findConnection = async () => {
  const db = await connectDB();

  const targetId = '68ab34abcb0949fa5501b40d';

  try {
    console.log(`🔍 Searching for connection ID: ${targetId}`);

    // Check in connections collection
    const connectionsResult = await db.collection('connections').findOne({
      _id: new mongoose.Types.ObjectId(targetId)
    });

    if (connectionsResult) {
      console.log('\n✅ Found in "connections" collection:');
      console.log(JSON.stringify(connectionsResult, null, 2));
    } else {
      console.log('\n❌ NOT found in "connections" collection');
    }

    // Check in matches collection
    const matchesResult = await db.collection('matches').findOne({
      _id: new mongoose.Types.ObjectId(targetId)
    });

    if (matchesResult) {
      console.log('\n✅ Found in "matches" collection:');
      console.log(JSON.stringify(matchesResult, null, 2));
    } else {
      console.log('\n❌ NOT found in "matches" collection');
    }

    // Check how many connections exist in each collection
    const connectionsCount = await db.collection('connections').countDocuments();
    const matchesCount = await db.collection('matches').countDocuments();

    console.log(`\n📊 Collection counts:`);
    console.log(`   connections: ${connectionsCount} documents`);
    console.log(`   matches: ${matchesCount} documents`);

    // Show sample from connections collection
    if (connectionsCount > 0) {
      const sampleConnections = await db.collection('connections').find({}).limit(3).toArray();
      console.log(`\n📋 Sample from connections collection:`);
      sampleConnections.forEach((conn, i) => {
        console.log(`   ${i+1}. ID: ${conn._id}`);
        console.log(`      Member: ${conn.member}`);
        console.log(`      Creator: ${conn.creator}`);
      });
    }

  } catch (error) {
    console.error('❌ Error finding connection:', error);
  }

  await mongoose.disconnect();
  process.exit(0);
};

findConnection();