#!/usr/bin/env node

/**
 * Database Migration Script: Rename 'matches' collection to 'connections'
 *
 * This script safely renames the 'matches' collection to 'connections' while
 * preserving all existing data and indexes.
 *
 * Usage: node src/scripts/migrateMatchesToConnections.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../../../.env' });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies';

async function migrateCollection() {
  try {
    console.log('🚀 Starting migration: matches -> connections');
    console.log(
      `📡 Connecting to: ${MONGODB_URI.replace(/:[^:]+@/, ':****@')}`
    );

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Check if 'matches' collection exists
    const collections = await db.listCollections({ name: 'matches' }).toArray();
    if (collections.length === 0) {
      console.log(
        'ℹ️  Collection "matches" does not exist. Nothing to migrate.'
      );
      return;
    }

    // Check if 'connections' collection already exists
    const connectionsExists = await db
      .listCollections({ name: 'connections' })
      .toArray();
    if (connectionsExists.length > 0) {
      console.log('⚠️  Collection "connections" already exists!');
      console.log('📊 Checking document counts...');

      const matchesCount = await db.collection('matches').countDocuments();
      const connectionsCount = await db
        .collection('connections')
        .countDocuments();

      console.log(`📈 Matches collection: ${matchesCount} documents`);
      console.log(`📈 Connections collection: ${connectionsCount} documents`);

      if (matchesCount > 0 && connectionsCount === 0) {
        console.log('🔄 Migrating data to empty connections collection...');
      } else if (matchesCount === 0) {
        console.log('✅ Matches collection is empty. Migration complete.');
        return;
      } else {
        console.log(
          '❌ Both collections contain data. Manual intervention required.'
        );
        console.log(
          'Please backup your data and decide how to merge the collections.'
        );
        return;
      }
    }

    // Get document count before migration
    const matchesCount = await db.collection('matches').countDocuments();
    console.log(`📊 Found ${matchesCount} documents in 'matches' collection`);

    if (matchesCount === 0) {
      console.log('ℹ️  Matches collection is empty. Just renaming...');
    }

    // Rename the collection
    console.log('🔄 Renaming collection: matches -> connections');
    await db.collection('matches').rename('connections');

    // Verify the migration
    const connectionsCount = await db
      .collection('connections')
      .countDocuments();
    console.log(
      `✅ Migration complete! ${connectionsCount} documents in 'connections' collection`
    );

    // Get indexes from the new connections collection
    const indexes = await db.collection('connections').indexes();
    console.log(`📋 Collection has ${indexes.length} indexes:`);
    indexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('🎉 Migration successful!');
    console.log('');
    console.log('Next steps:');
    console.log(
      '1. Update the Connection model to use "connections" collection'
    );
    console.log('2. Update any API endpoints that reference "matches"');
    console.log('3. Test the application to ensure everything works');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateCollection()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateCollection;
