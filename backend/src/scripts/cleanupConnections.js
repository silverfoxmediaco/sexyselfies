#!/usr/bin/env node

/**
 * Cleanup old/bad connection requests from the database
 *
 * This script will:
 * 1. Find connections with invalid member/creator references
 * 2. Remove duplicate connections
 * 3. Remove connections older than a certain date
 * 4. Clean up orphaned connections
 */

const mongoose = require('mongoose');
const CreatorConnection = require('../models/CreatorConnection');
const Member = require('../models/Member');
const Creator = require('../models/Creator');

async function cleanupConnections() {
  try {
    console.log('🧹 Starting connection cleanup...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // 1. Find all connections
    const allConnections = await CreatorConnection.find({});
    console.log(`📊 Total connections found: ${allConnections.length}\n`);

    // 2. Find connections with invalid member references
    console.log('🔍 Checking for invalid member references...');
    const invalidMemberConnections = [];

    for (const connection of allConnections) {
      const member = await Member.findById(connection.member);
      if (!member) {
        invalidMemberConnections.push(connection);
        console.log(`❌ Invalid member reference: ${connection._id} -> member: ${connection.member}`);
      }
    }

    // 3. Find connections with invalid creator references
    console.log('\n🔍 Checking for invalid creator references...');
    const invalidCreatorConnections = [];

    for (const connection of allConnections) {
      const creator = await Creator.findById(connection.creator);
      if (!creator) {
        invalidCreatorConnections.push(connection);
        console.log(`❌ Invalid creator reference: ${connection._id} -> creator: ${connection.creator}`);
      }
    }

    // 4. Find duplicate connections (same member + creator)
    console.log('\n🔍 Checking for duplicate connections...');
    const duplicateConnections = [];
    const connectionMap = new Map();

    for (const connection of allConnections) {
      const key = `${connection.member}_${connection.creator}`;
      if (connectionMap.has(key)) {
        // Keep the most recent one, mark older ones for deletion
        const existing = connectionMap.get(key);
        if (connection.createdAt > existing.createdAt) {
          duplicateConnections.push(existing);
          connectionMap.set(key, connection);
        } else {
          duplicateConnections.push(connection);
        }
        console.log(`🔄 Duplicate found: ${connection._id} (member: ${connection.member}, creator: ${connection.creator})`);
      } else {
        connectionMap.set(key, connection);
      }
    }

    // 5. Find old connections (older than 30 days with no activity)
    console.log('\n🔍 Checking for old inactive connections...');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldConnections = allConnections.filter(conn =>
      conn.createdAt < thirtyDaysAgo &&
      conn.status === 'pending' &&
      !conn.lastInteraction
    );

    oldConnections.forEach(conn => {
      console.log(`⏰ Old pending connection: ${conn._id} (created: ${conn.createdAt})`);
    });

    // Summary
    console.log('\n📋 CLEANUP SUMMARY:');
    console.log(`❌ Invalid member references: ${invalidMemberConnections.length}`);
    console.log(`❌ Invalid creator references: ${invalidCreatorConnections.length}`);
    console.log(`🔄 Duplicate connections: ${duplicateConnections.length}`);
    console.log(`⏰ Old pending connections: ${oldConnections.length}`);

    const totalToDelete = invalidMemberConnections.length +
                         invalidCreatorConnections.length +
                         duplicateConnections.length +
                         oldConnections.length;

    console.log(`\n🗑️ Total connections to delete: ${totalToDelete}`);

    // Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      readline.question('\nDo you want to proceed with cleanup? (yes/no): ', resolve);
    });

    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      console.log('\n🧹 Performing cleanup...');

      // Delete invalid member connections
      if (invalidMemberConnections.length > 0) {
        const memberIds = invalidMemberConnections.map(c => c._id);
        await CreatorConnection.deleteMany({ _id: { $in: memberIds } });
        console.log(`✅ Deleted ${invalidMemberConnections.length} connections with invalid members`);
      }

      // Delete invalid creator connections
      if (invalidCreatorConnections.length > 0) {
        const creatorIds = invalidCreatorConnections.map(c => c._id);
        await CreatorConnection.deleteMany({ _id: { $in: creatorIds } });
        console.log(`✅ Deleted ${invalidCreatorConnections.length} connections with invalid creators`);
      }

      // Delete duplicate connections
      if (duplicateConnections.length > 0) {
        const duplicateIds = duplicateConnections.map(c => c._id);
        await CreatorConnection.deleteMany({ _id: { $in: duplicateIds } });
        console.log(`✅ Deleted ${duplicateConnections.length} duplicate connections`);
      }

      // Delete old connections
      if (oldConnections.length > 0) {
        const oldIds = oldConnections.map(c => c._id);
        await CreatorConnection.deleteMany({ _id: { $in: oldIds } });
        console.log(`✅ Deleted ${oldConnections.length} old pending connections`);
      }

      console.log('\n🎉 Cleanup completed successfully!');

      // Show final count
      const finalCount = await CreatorConnection.countDocuments();
      console.log(`📊 Remaining connections: ${finalCount}`);

    } else {
      console.log('\n❌ Cleanup cancelled');
    }

    readline.close();

  } catch (error) {
    console.error('❌ Cleanup error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the cleanup
cleanupConnections();