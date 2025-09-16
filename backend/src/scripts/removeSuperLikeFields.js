#!/usr/bin/env node

/**
 * Database Migration Script: Remove Super Like Fields
 *
 * This script removes all Super Like related fields from the database:
 * - memberSuperLiked field from connections
 * - Changes all 'premium' connectionType to 'verified'
 * - Removes superLikes array from members
 * - Removes dailySuperLikes object from members
 *
 * Usage: node src/scripts/removeSuperLikeFields.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../../../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies';

async function removeSuperLikeFields() {
  try {
    console.log('🚀 Starting Super Like field removal');
    console.log(`📡 Connecting to: ${MONGODB_URI.replace(/:[^:]+@/, ':****@')}`);

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // 1. Update Connections collection
    console.log('\n📊 Processing Connections collection...');

    // Count documents that need updates
    const connectionsNeedingUpdate = await db.collection('connections').countDocuments({
      $or: [
        { memberSuperLiked: { $exists: true } },
        { connectionType: 'premium' }
      ]
    });

    console.log(`📈 Found ${connectionsNeedingUpdate} connections to update`);

    if (connectionsNeedingUpdate > 0) {
      // Remove memberSuperLiked field and update premium connections
      const connectionsResult = await db.collection('connections').updateMany(
        {},
        {
          $unset: { memberSuperLiked: "" },
          $set: { connectionType: { $cond: [{ $eq: ["$connectionType", "premium"] }, "verified", "$connectionType"] } }
        }
      );

      // Clean up connectionType enum (convert premium to verified)
      const premiumConnectionsResult = await db.collection('connections').updateMany(
        { connectionType: 'premium' },
        { $set: { connectionType: 'verified' } }
      );

      console.log(`✅ Connections updated: ${connectionsResult.modifiedCount} documents`);
      console.log(`✅ Premium connections converted: ${premiumConnectionsResult.modifiedCount} documents`);
    }

    // 2. Update Members collection
    console.log('\n👥 Processing Members collection...');

    // Count members that need updates
    const membersNeedingUpdate = await db.collection('members').countDocuments({
      $or: [
        { superLikes: { $exists: true } },
        { dailySuperLikes: { $exists: true } }
      ]
    });

    console.log(`📈 Found ${membersNeedingUpdate} members to update`);

    if (membersNeedingUpdate > 0) {
      // Remove Super Like related fields from members
      const membersResult = await db.collection('members').updateMany(
        {},
        {
          $unset: {
            superLikes: "",
            dailySuperLikes: ""
          }
        }
      );

      console.log(`✅ Members updated: ${membersResult.modifiedCount} documents`);
    }

    // 3. Verify cleanup
    console.log('\n🔍 Verifying cleanup...');

    const remainingConnections = await db.collection('connections').countDocuments({
      $or: [
        { memberSuperLiked: { $exists: true } },
        { connectionType: 'premium' }
      ]
    });

    const remainingMembers = await db.collection('members').countDocuments({
      $or: [
        { superLikes: { $exists: true } },
        { dailySuperLikes: { $exists: true } }
      ]
    });

    if (remainingConnections === 0 && remainingMembers === 0) {
      console.log('✅ Cleanup successful! No Super Like fields remain');
    } else {
      console.log(`⚠️  Cleanup incomplete: ${remainingConnections} connections, ${remainingMembers} members still have Super Like fields`);
    }

    console.log('\n📊 Final Statistics:');
    const totalConnections = await db.collection('connections').countDocuments();
    const verifiedConnections = await db.collection('connections').countDocuments({ connectionType: 'verified' });
    const basicConnections = await db.collection('connections').countDocuments({ connectionType: 'basic' });

    console.log(`   Total connections: ${totalConnections}`);
    console.log(`   Basic connections: ${basicConnections}`);
    console.log(`   Verified connections: ${verifiedConnections}`);

    console.log('\n🎉 Super Like removal completed successfully!');
    console.log('');
    console.log('Summary of changes:');
    console.log('✅ Removed memberSuperLiked field from connections');
    console.log('✅ Converted premium connections to verified');
    console.log('✅ Removed superLikes array from members');
    console.log('✅ Removed dailySuperLikes object from members');

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
  removeSuperLikeFields()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = removeSuperLikeFields;