const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import Admin model
const Admin = require('../models/Admin');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test password
const testPassword = async () => {
  try {
    // Find the admin
    const admin = await Admin.findOne({ email: 'admin@sexyselfies.com' }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin not found');
      return;
    }
    
    console.log('\n📧 Admin found:', admin.email);
    console.log('🔐 Has password field:', !!admin.password);
    
    // Test password directly with bcrypt
    const testPassword = 'AdminPass123!';
    console.log('\n🧪 Testing password:', testPassword);
    
    // Method 1: Direct bcrypt compare
    const isMatch1 = await bcrypt.compare(testPassword, admin.password);
    console.log('✅ Direct bcrypt.compare result:', isMatch1);
    
    // Method 2: Using model method if it exists
    if (admin.matchPassword) {
      const isMatch2 = await admin.matchPassword(testPassword);
    } else if (admin.comparePassword) {
      const isMatch2 = await admin.comparePassword(testPassword);
    } else {
      console.log('⚠️  No password comparison method on model');
    }
    
    // Create a new hash to compare
    console.log('\n🔄 Creating fresh hash for comparison...');
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(testPassword, salt);
    console.log('🆕 New hash:', newHash.substring(0, 20) + '...');
    
    // Test the new hash
    const testNewHash = await bcrypt.compare(testPassword, newHash);
    console.log('✅ New hash comparison works:', testNewHash);
    
    // Update the password with the new hash
    if (!isMatch1) {
      console.log('\n🔧 Fixing password...');
      admin.password = newHash;
      admin.loginAttempts = 0;
      admin.lockUntil = undefined;
      await admin.save();
      console.log('✅ Password updated with new hash');
      
      // Test again
      const updatedAdmin = await Admin.findOne({ email: 'admin@sexyselfies.com' }).select('+password');
      const finalTest = await bcrypt.compare(testPassword, updatedAdmin.password);
      console.log('✅ Final test after update:', finalTest);
    }
    
  } catch (error) {
    console.error('Error testing password:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Test complete! Database connection closed.');
    process.exit(0);
  }
};

// Run the test
const run = async () => {
  await connectDB();
  await testPassword();
};

run();