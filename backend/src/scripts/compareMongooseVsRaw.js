// Compare what Mongoose model sees vs raw database
const mongoose = require('mongoose');
const path = require('path');
const Member = require('../models/Member');

// Load .env file from backend root directory
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const compareData = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies';
    await mongoose.connect(mongoURI);

    console.log('✅ Connected to MongoDB');
    console.log(`📍 Database: ${mongoose.connection.name}`);

    const db = mongoose.connection.db;

    // 1. Check RAW database
    console.log('\n🔍 RAW DATABASE QUERY:');
    const rawMembers = await db.collection('members').find({}).toArray();
    rawMembers.forEach((member, i) => {
      console.log(`   ${i + 1}. ${member.username}:`);
      console.log(`      profileComplete: ${member.profileComplete} (${typeof member.profileComplete})`);
    });

    // 2. Check MONGOOSE MODEL
    console.log('\n🔍 MONGOOSE MODEL QUERY:');
    const modelMembers = await Member.find({});
    modelMembers.forEach((member, i) => {
      console.log(`   ${i + 1}. ${member.username}:`);
      console.log(`      profileComplete: ${member.profileComplete} (${typeof member.profileComplete})`);
    });

    // 3. Test the EXACT query from creator.members.controller.js
    console.log('\n🔍 EXACT CONTROLLER QUERY:');
    const controllerMembers = await Member.find({
      profileComplete: true
    });
    console.log(`Found ${controllerMembers.length} members with profileComplete: true`);

    controllerMembers.forEach((member, i) => {
      console.log(`   ${i + 1}. ${member.username}: profileComplete = ${member.profileComplete}`);
    });

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

compareData();