const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import Admin model
const Admin = require('../models/Admin');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create super admin
const createSuperAdmin = async () => {
  try {
    // Check if super admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@sexyselfies.com' });
    
    if (existingAdmin) {
      console.log('❌ Super admin already exists with email: admin@sexyselfies.com');
      
      // Ask if they want to reset the password
      console.log('Resetting password for existing admin...');
      
      // Generate new password
      const newPassword = 'AdminPass123!'; // Change this!
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      existingAdmin.password = hashedPassword;
      existingAdmin.loginAttempts = 0;
      existingAdmin.lockUntil = undefined;
      existingAdmin.isActive = true;
      existingAdmin.role = 'superAdmin';
      
      // Set all permissions
      existingAdmin.setRolePermissions();
      
      await existingAdmin.save();
      
      console.log('✅ Password reset successfully!');
      
    } else {
      // Create new super admin
      const password = 'AdminPass123!'; // Change this!
      
      const admin = await Admin.create({
        email: 'admin@sexyselfies.com',
        password: password,
        name: 'Super Admin',
        role: 'superAdmin',
        isActive: true
      });
      
      // Set permissions based on role
      admin.setRolePermissions();
      await admin.save();
      
      console.log('✅ Super Admin created successfully!');
    }
    
    // Also create a moderator and verification staff for testing
    const moderatorExists = await Admin.findOne({ email: 'moderator@sexyselfies.com' });
    
    if (!moderatorExists) {
      const moderator = await Admin.create({
        email: 'moderator@sexyselfies.com',
        password: 'ModPass123!',
        name: 'Moderator',
        role: 'moderator',
        isActive: true,
        createdBy: admin._id
      });
      
      moderator.setRolePermissions();
      await moderator.save();
      
      console.log('✅ Moderator account created');
    }
    
    const verifierExists = await Admin.findOne({ email: 'verifier@sexyselfies.com' });
    
    if (!verifierExists) {
      const verifier = await Admin.create({
        email: 'verifier@sexyselfies.com',
        password: 'VerifyPass123!',
        name: 'ID Verifier',
        role: 'verificationStaff',
        isActive: true,
        createdBy: admin._id
      });
      
      verifier.setRolePermissions();
      await verifier.save();
      
      console.log('✅ Verification Staff account created');
    }
    
  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.connection.close();
    console.log('\n✅ Setup complete! Database connection closed.');
    process.exit(0);
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await createSuperAdmin();
};

run();