// backend/src/seeders/createDemoAccounts.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../../.env' });

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected for seeding...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define a simple Member schema if model doesn't exist
const memberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'member' },
  profile: {
    firstName: String,
    lastName: String,
    displayName: String,
    dateOfBirth: Date,
    gender: String,
    bio: String,
    avatar: String
  },
  preferences: {
    ageRange: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 50 }
    },
    interestedIn: [String],
    distance: { type: Number, default: 50 },
    interests: [String]
  },
  credits: {
    balance: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  subscription: {
    plan: { type: String, default: 'free' },
    status: { type: String, default: 'active' }
  },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  agreedToTerms: { type: Boolean, default: false },
  agreedToTermsDate: Date,
  createdAt: { type: Date, default: Date.now }
});

// Define a simple Creator schema
const creatorSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'creator' },
  profile: {
    displayName: String,
    firstName: String,
    lastName: String,
    stageName: String,
    dateOfBirth: Date,
    gender: String,
    bio: String,
    avatar: String,
    coverImage: String,
    interests: [String],
    location: {
      city: String,
      state: String,
      country: String
    }
  },
  verification: {
    idVerified: { type: Boolean, default: false },
    idVerifiedDate: Date,
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false }
  },
  content: {
    photoCount: { type: Number, default: 0 },
    videoCount: { type: Number, default: 0 },
    categories: [String]
  },
  subscription: {
    price: { type: Number, default: 9.99 },
    isActive: { type: Boolean, default: true },
    subscriberCount: { type: Number, default: 0 }
  },
  earnings: {
    total: { type: Number, default: 0 },
    available: { type: Number, default: 0 },
    pending: { type: Number, default: 0 }
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Define a simple Admin schema
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  permissions: [String],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Create or get models
const Member = mongoose.models.Member || mongoose.model('Member', memberSchema);
const Creator = mongoose.models.Creator || mongoose.model('Creator', creatorSchema);
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

const createDemoAccounts = async () => {
  try {
    await connectDB();
    
    console.log('\n🚀 Creating demo accounts...\n');
    
    // 1. Create Demo Member Account
    try {
      // Check if demo member exists
      const existingMember = await Member.findOne({ 
        $or: [
          { email: 'demo@sexyselfies.com' },
          { username: 'demo_member' }
        ]
      });
      
      if (existingMember) {
        console.log('⚠️  Demo Member already exists, skipping...');
      } else {
        const hashedPassword = await bcrypt.hash('demo123', 10);
        
        const demoMember = new Member({
          email: 'demo@sexyselfies.com',
          username: 'demo_member',
          password: hashedPassword,
          role: 'member',
          profile: {
            displayName: 'Demo Member',
            firstName: 'Demo',
            lastName: 'Member',
            dateOfBirth: new Date('1995-01-01'),
            gender: 'male',
            bio: 'This is a demo member account for testing',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'
          },
          preferences: {
            ageRange: { min: 18, max: 50 },
            interestedIn: ['female'],
            distance: 50,
            interests: ['fitness', 'travel', 'photography']
          },
          credits: {
            balance: 100,
            total: 100
          },
          subscription: {
            plan: 'free',
            status: 'active'
          },
          isVerified: true,
          isActive: true,
          agreedToTerms: true,
          agreedToTermsDate: new Date()
        });
        
        await demoMember.save();
        console.log('✅ Demo Member created successfully!');
      }
    } catch (error) {
      console.error('Error creating demo member:', error.message);
    }
    
    // 2. Create Demo Creator Account
    try {
      const existingCreator = await Creator.findOne({ 
        $or: [
          { email: 'demo.creator@sexyselfies.com' },
          { username: 'demo_creator' }
        ]
      });
      
      if (existingCreator) {
        console.log('⚠️  Demo Creator already exists, skipping...');
      } else {
        const hashedPassword = await bcrypt.hash('demo123', 10);
        
        const demoCreator = new Creator({
          email: 'demo.creator@sexyselfies.com',
          username: 'demo_creator',
          password: hashedPassword,
          role: 'creator',
          profile: {
            displayName: 'Demo Creator',
            firstName: 'Demo',
            lastName: 'Creator',
            stageName: 'DemoStar',
            dateOfBirth: new Date('1998-01-01'),
            gender: 'female',
            bio: 'This is a demo creator account for testing',
            avatar: 'http://localhost:5174/src/assets/IMG_5019.jpg', // Frontend asset URL
            coverImage: 'http://localhost:5174/src/assets/IMG_5019.jpg', // Using same image for cover
            interests: ['fitness', 'modeling', 'photography'],
            location: {
              city: 'Los Angeles',
              state: 'CA',
              country: 'USA'
            }
          },
          verification: {
            idVerified: true,
            idVerifiedDate: new Date(),
            emailVerified: true,
            phoneVerified: true
          },
          content: {
            photoCount: 10,
            videoCount: 5,
            categories: ['fitness', 'lifestyle']
          },
          subscription: {
            price: 9.99,
            isActive: true,
            subscriberCount: 150
          },
          earnings: {
            total: 1500.00,
            available: 500.00,
            pending: 100.00
          },
          ratings: {
            average: 4.8,
            count: 50
          },
          isActive: true,
          isVerified: true
        });
        
        await demoCreator.save();
        console.log('✅ Demo Creator created successfully!');
      }
    } catch (error) {
      console.error('Error creating demo creator:', error.message);
    }
    
    // 3. Create Demo Admin Account
    try {
      const existingAdmin = await Admin.findOne({ 
        $or: [
          { email: 'demo.admin@sexyselfies.com' }
        ]
      });
      
      if (existingAdmin) {
        console.log('⚠️  Demo Admin already exists, skipping...');
      } else {
        const hashedPassword = await bcrypt.hash('demoadmin123', 10);
        
        const demoAdmin = new Admin({
          email: 'demo.admin@sexyselfies.com',
          name: 'Demo Admin',
          password: hashedPassword,
          role: 'admin',
          permissions: ['read', 'write', 'delete'],
          isActive: true
        });
        
        await demoAdmin.save();
        console.log('✅ Demo Admin created successfully!');
      }
    } catch (error) {
      console.error('Error creating demo admin:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('            DEMO ACCOUNTS CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📧 MEMBER LOGIN:');
    console.log('   Email: demo@sexyselfies.com');
    console.log('   Password: demo123');
    console.log('\n🎨 CREATOR LOGIN:');
    console.log('   Email: demo.creator@sexyselfies.com');
    console.log('   Password: demo123');
    console.log('\n🛡️  ADMIN LOGIN:');
    console.log('   Email: demo.admin@sexyselfies.com');
    console.log('   Password: demoadmin123');
    console.log('\n' + '='.repeat(60) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating demo accounts:', error);
    process.exit(1);
  }
};

// Run the seeder
createDemoAccounts();