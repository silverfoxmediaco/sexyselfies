const mongoose = require('mongoose');
require('dotenv').config();

async function dropLocationIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('creators');
    
    // List all indexes
    const indexes = await collection.listIndexes().toArray();
    console.log('Current indexes:', indexes.map(i => i.name));
    
    // Drop the location index
    try {
      await collection.dropIndex({ location: '2dsphere' });
      console.log('Successfully dropped location 2dsphere index');
    } catch (error) {
      console.log('Index may not exist or already dropped:', error.message);
    }
    
    console.log('Index drop completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropLocationIndex();