// Script to find ALL connection documents across all collections
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

const findAllConnections = async () => {
  const db = await connectDB();

  try {
    console.log('🔍 Searching for ALL connections in ALL collections...');

    // Get all collections in the database
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Available collections:');
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });

    // Check each collection for documents that look like connections
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\n🔍 Checking collection: ${collectionName}`);

      try {
        const count = await db.collection(collectionName).countDocuments();
        console.log(`   Document count: ${count}`);

        if (count > 0) {
          // Get a sample document to see its structure
          const sample = await db.collection(collectionName).findOne({});

          // Check if this looks like a connection document
          if (sample && (sample.member || sample.creator || sample.status)) {
            console.log(`   ✅ Contains connection-like documents`);

            // Show first few documents
            const docs = await db.collection(collectionName).find({}).limit(5).toArray();
            docs.forEach((doc, i) => {
              console.log(`   ${i+1}. ID: ${doc._id}`);
              console.log(`      Member: ${doc.member || 'N/A'}`);
              console.log(`      Creator: ${doc.creator || 'N/A'}`);
              console.log(`      Status: ${doc.status || 'N/A'}`);
              console.log(`      Username field: ${doc.username ? `"${doc.username}"` : 'MISSING'}`);
            });
          } else {
            console.log(`   ℹ️  Sample document structure:`, Object.keys(sample || {}));
          }
        }
      } catch (error) {
        console.log(`   ❌ Error checking collection: ${error.message}`);
      }
    }

    // Specifically look for the connection ID you mentioned
    const targetId = '68ab34abcb0949fa5501b40d';
    console.log(`\n🎯 Specifically searching for ID: ${targetId}`);

    for (const collection of collections) {
      try {
        const doc = await db.collection(collection.name).findOne({
          _id: new mongoose.Types.ObjectId(targetId)
        });
        if (doc) {
          console.log(`✅ Found in collection "${collection.name}":`);
          console.log(JSON.stringify(doc, null, 2));
        }
      } catch (error) {
        // Skip if invalid ObjectId or other error
      }
    }

  } catch (error) {
    console.error('❌ Error finding connections:', error);
  }

  await mongoose.disconnect();
  process.exit(0);
};

findAllConnections();