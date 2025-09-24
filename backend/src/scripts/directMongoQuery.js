// Direct MongoDB query to check actual collections
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies');
    console.log('✅ Connected to MongoDB');
    return mongoose.connection.db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const queryDirectly = async () => {
  const db = await connectDB();

  try {
    console.log('🔍 Checking actual MongoDB collections...');

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Available collections:');
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });

    // Check different possible creator collection names
    const possibleCreatorCollections = ['creators', 'creator', 'sexyselfies.creators'];

    for (const collectionName of possibleCreatorCollections) {
      try {
        const count = await db.collection(collectionName).countDocuments();
        console.log(`\n👩‍🎨 Collection '${collectionName}': ${count} documents`);

        if (count > 0) {
          const samples = await db.collection(collectionName).find({}).limit(3).toArray();
          console.log(`   Sample documents:`);
          samples.forEach((doc, i) => {
            console.log(`   ${i+1}. ID: ${doc._id}`);
            console.log(`      Username: ${doc.username || 'NO USERNAME'}`);
            console.log(`      Display Name: ${doc.displayName || 'NO DISPLAY NAME'}`);
            console.log(`      User: ${doc.user || 'NO USER REFERENCE'}`);
            console.log('');
          });
        }
      } catch (error) {
        console.log(`   Collection '${collectionName}': does not exist`);
      }
    }

    // Check members collection
    try {
      const memberCount = await db.collection('members').countDocuments();
      console.log(`\n👥 Members collection: ${memberCount} documents`);

      if (memberCount > 0) {
        const memberSample = await db.collection('members').findOne({});
        console.log(`   Sample member:`);
        console.log(`      ID: ${memberSample._id}`);
        console.log(`      Username: ${memberSample.username || 'NO USERNAME'}`);
        console.log(`      Display Name: ${memberSample.displayName || 'NO DISPLAY NAME'}`);
      }
    } catch (error) {
      console.log('   Members collection: error', error.message);
    }

    // Check connections/matches collections
    const possibleConnectionCollections = ['connections', 'matches', 'creatorconnections'];

    for (const collectionName of possibleConnectionCollections) {
      try {
        const count = await db.collection(collectionName).countDocuments();
        console.log(`\n🔗 Collection '${collectionName}': ${count} documents`);

        if (count > 0) {
          const samples = await db.collection(collectionName).find({}).limit(3).toArray();
          console.log(`   Sample documents:`);
          samples.forEach((doc, i) => {
            console.log(`   ${i+1}. ID: ${doc._id}`);
            console.log(`      Member: ${doc.member || 'NO MEMBER'}`);
            console.log(`      Creator: ${doc.creator || 'NO CREATOR'}`);
            console.log(`      Status: ${doc.status || 'NO STATUS'}`);
            console.log('');
          });
        }
      } catch (error) {
        console.log(`   Collection '${collectionName}': does not exist`);
      }
    }

  } catch (error) {
    console.error('❌ Error querying database:', error);
  }
};

const runQuery = async () => {
  await queryDirectly();

  console.log('\n🔄 Disconnecting from MongoDB...');
  await mongoose.disconnect();
  console.log('✅ Query completed successfully');
  process.exit(0);
};

if (require.main === module) {
  runQuery().catch(error => {
    console.error('❌ Query failed:', error);
    process.exit(1);
  });
}

module.exports = { queryDirectly };