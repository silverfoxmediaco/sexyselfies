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

// Fix password
const fixPassword = async () => {
  try {
    // Find the admin
    const admin = await Admin.findOne({ email: 'admin@sexyselfies.com' }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin not found');
      return;
    }
    
    console.log('📧 Admin found:', admin.email);
    
    const testPassword = 'AdminPass123!';
    
    // Method 1: Direct database update (bypasses pre-save hooks)
    console.log('\n🔧 Updating password directly in database...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testPassword, salt);
    
    // Use updateOne to bypass model hooks
    await Admin.updateOne(
      { _id: admin._id },
      { 
        $set: { 
          password: hashedPassword,
          loginAttempts: 0,
          lockUntil: null
        }
      }
    );
    
    console.log('✅ Password updated directly in database');
    console.log('🔐 New hash:', hashedPassword.substring(0, 20) + '...');
    
    // Verify the update worked
    const updatedAdmin = await Admin.findOne({ email: 'admin@sexyselfies.com' }).select('+password');
    const isMatch = await bcrypt.compare(testPassword, updatedAdmin.password);
    
    console.log('\n✅ Password verification:', isMatch ? 'SUCCESS' : 'FAILED');
    
    if (isMatch) {
      console.log('✅ Password has been fixed!');
    } else {
      console.log('\n❌ Password verification failed');
      console.log('There may be an issue with the Admin model');
    }
    
  } catch (error) {
    console.error('Error fixing password:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Complete! Database connection closed.');
    process.exit(0);
  }
};

// Run the fix
const run = async () => {
  await connectDB();
  await fixPassword();
};

run();