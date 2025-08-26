const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Import models
const User = require('../models/User');
const Creator = require('../models/Creator');
const CreatorProfile = require('../models/CreatorProfile');
const Member = require('../models/Member');
const MemberProfile = require('../models/MemberProfile');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Mock creator data with demographics matching your filter system
const mockCreatorData = [
  {
    email: 'sophia.rose@example.com',
    displayName: 'Sophia Rose',
    age: 24,
    gender: 'female',
    orientation: 'straight',
    bodyType: 'Athletic',
    ethnicity: 'Caucasian',
    hairColor: 'Brown',
    height: 66, // 5'6"
    bio: "Fitness enthusiast & lifestyle creator. Love hiking, yoga, and sharing authentic moments ✨",
    categories: ['fitness', 'lifestyle'],
    location: {
      city: 'Los Angeles',
      state: 'CA',
      country: 'US',
      coordinates: [-118.2437, 34.0522]
    },
    pricing: {
      photos: { min: 0.99, default: 3.99, max: 9.99 },
      videos: { min: 2.99, default: 7.99, max: 19.99 },
      messages: { min: 0.99, default: 2.99, max: 9.99 }
    },
    profileImage: 'beaufitulbrunette1.png',
    coverImage: 'beautifulbrunette2.png',
    verified: true,
    showInBrowse: true
  },
  {
    email: 'isabella.santos@example.com',
    displayName: 'Isabella Santos',
    age: 22,
    gender: 'female',
    orientation: 'bisexual',
    bodyType: 'Slim',
    ethnicity: 'Hispanic/Latino',
    hairColor: 'Black',
    height: 64, // 5'4"
    bio: "Artist at heart 🎨 Dancing through life and sharing my creative journey with you",
    categories: ['artistic', 'lifestyle'],
    location: {
      city: 'Miami',
      state: 'FL',
      country: 'US',
      coordinates: [-80.1918, 25.7617]
    },
    pricing: {
      photos: { min: 0.99, default: 2.99, max: 9.99 },
      videos: { min: 2.99, default: 5.99, max: 19.99 },
      messages: { min: 0.99, default: 1.99, max: 9.99 }
    },
    profileImage: 'beautifulbrunette2.png',
    coverImage: 'beautifulbrunette4.png',
    verified: true,
    showInBrowse: true
  },
  {
    email: 'emma.thompson@example.com',
    displayName: 'Emma Thompson',
    age: 26,
    gender: 'female',
    orientation: 'straight',
    bodyType: 'Curvy',
    ethnicity: 'Caucasian',
    hairColor: 'Blonde',
    height: 68, // 5'8"
    bio: "Top creator ⭐ Fashion lover & entrepreneur. Let's chat about life, style, and dreams!",
    categories: ['fashion', 'lifestyle', 'education'],
    location: {
      city: 'New York',
      state: 'NY',
      country: 'US',
      coordinates: [-74.0060, 40.7128]
    },
    pricing: {
      photos: { min: 0.99, default: 5.99, max: 9.99 },
      videos: { min: 2.99, default: 12.99, max: 19.99 },
      messages: { min: 0.99, default: 4.99, max: 9.99 }
    },
    profileImage: 'beautifulbrunette4.png',
    coverImage: 'cuteblondeselfie1.png',
    verified: true,
    showInBrowse: true,
    isTopCreator: true
  },
  {
    email: 'ashley.kim@example.com',
    displayName: 'Ashley Kim',
    age: 23,
    gender: 'female',
    orientation: 'pansexual',
    bodyType: 'Average',
    ethnicity: 'Asian',
    hairColor: 'Blonde',
    height: 62, // 5'2"
    bio: "Tech girl by day, creative soul by night 💻✨ Love gaming, anime, and good conversations",
    categories: ['gaming', 'education', 'lifestyle'],
    location: {
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      coordinates: [-122.4194, 37.7749]
    },
    pricing: {
      photos: { min: 0.99, default: 2.49, max: 9.99 },
      videos: { min: 2.99, default: 4.99, max: 19.99 },
      messages: { min: 0.99, default: 1.49, max: 9.99 }
    },
    profileImage: 'cuteblondeselfie1.png',
    coverImage: 'beaufitulbrunette1.png',
    verified: false,
    showInBrowse: true
  },
  {
    email: 'zara.williams@example.com',
    displayName: 'Zara Williams',
    age: 25,
    gender: 'female',
    orientation: 'straight',
    bodyType: 'Plus Size',
    ethnicity: 'Black',
    hairColor: 'Black',
    height: 65, // 5'5"
    bio: "Body positive advocate 💖 Spreading self-love and confidence. Music lover & foodie!",
    categories: ['lifestyle', 'music', 'food'],
    location: {
      city: 'Chicago',
      state: 'IL',
      country: 'US',
      coordinates: [-87.6298, 41.8781]
    },
    pricing: {
      photos: { min: 0.99, default: 3.49, max: 9.99 },
      videos: { min: 2.99, default: 6.99, max: 19.99 },
      messages: { min: 0.99, default: 2.49, max: 9.99 }
    },
    profileImage: 'beautifulebrunette3.png',
    coverImage: 'cuteblondeselfie2.png',
    verified: true,
    showInBrowse: true
  },
  {
    email: 'chloe.martinez@example.com',
    displayName: 'Chloe Martinez',
    age: 21,
    gender: 'female',
    orientation: 'bisexual',
    bodyType: 'Slender',
    ethnicity: 'Mixed',
    hairColor: 'Blonde',
    height: 67, // 5'7"
    bio: "College student & travel enthusiast ✈️ Sharing my adventures and authentic moments",
    categories: ['travel', 'education', 'lifestyle'],
    location: {
      city: 'Austin',
      state: 'TX',
      country: 'US',
      coordinates: [-97.7431, 30.2672]
    },
    pricing: {
      photos: { min: 0.99, default: 1.99, max: 9.99 },
      videos: { min: 2.99, default: 3.99, max: 19.99 },
      messages: { min: 0.99, default: 0.99, max: 9.99 }
    },
    profileImage: 'cuteblondeselfie2.png',
    coverImage: 'beautifulebrunette3.png',
    verified: false,
    showInBrowse: true
  },
  {
    email: 'maya.patel@example.com',
    displayName: 'Maya Patel',
    age: 27,
    gender: 'female',
    orientation: 'straight',
    bodyType: 'Athletic',
    ethnicity: 'Asian',
    hairColor: 'Black',
    height: 63, // 5'3"
    bio: "Yoga instructor & wellness coach 🧘‍♀️ Helping others find balance and inner peace",
    categories: ['fitness', 'education', 'lifestyle'],
    location: {
      city: 'Seattle',
      state: 'WA',
      country: 'US',
      coordinates: [-122.3321, 47.6062]
    },
    pricing: {
      photos: { min: 0.99, default: 4.49, max: 9.99 },
      videos: { min: 2.99, default: 8.99, max: 19.99 },
      messages: { min: 0.99, default: 3.49, max: 9.99 }
    },
    profileImage: 'beaufitulbrunette1.png', // Reusing for variety
    coverImage: 'beautifulbrunette4.png',
    verified: true,
    showInBrowse: true
  },
  {
    email: 'natalie.brooks@example.com',
    displayName: 'Natalie Brooks',
    age: 25,
    gender: 'female',
    orientation: 'straight',
    bodyType: 'Curvy',
    ethnicity: 'Caucasian',
    hairColor: 'Brown',
    height: 65, // 5'5"
    bio: "Professional model & swimwear enthusiast 👙 Love beach days and sharing confident vibes",
    categories: ['fashion', 'lifestyle', 'modeling'],
    location: {
      city: 'San Diego',
      state: 'CA',
      country: 'US',
      coordinates: [-117.1611, 32.7157]
    },
    pricing: {
      photos: { min: 0.99, default: 4.99, max: 9.99 },
      videos: { min: 2.99, default: 9.99, max: 19.99 },
      messages: { min: 0.99, default: 3.99, max: 9.99 }
    },
    profileImage: 'creator8.png',
    coverImage: 'creator9.png',
    verified: true,
    showInBrowse: true
  },
  {
    email: 'aria.rose@example.com',
    displayName: 'Aria Rose',
    age: 22,
    gender: 'female',
    orientation: 'bisexual',
    bodyType: 'Slim',
    ethnicity: 'Mixed',
    hairColor: 'Brown',
    height: 64, // 5'4"
    bio: "Free spirit & nature lover 🌿 Photography student sharing my world through my lens",
    categories: ['artistic', 'lifestyle', 'photography'],
    location: {
      city: 'Portland',
      state: 'OR',
      country: 'US',
      coordinates: [-122.6750, 45.5152]
    },
    pricing: {
      photos: { min: 0.99, default: 2.99, max: 9.99 },
      videos: { min: 2.99, default: 5.99, max: 19.99 },
      messages: { min: 0.99, default: 1.99, max: 9.99 }
    },
    profileImage: 'creator10.png',
    coverImage: 'creator8.png',
    verified: false,
    showInBrowse: true
  },
  {
    email: 'jessica.taylor@example.com',
    displayName: 'Jessica Taylor',
    age: 28,
    gender: 'female',
    orientation: 'straight',
    bodyType: 'Athletic',
    ethnicity: 'Black',
    hairColor: 'Black',
    height: 68, // 5'8"
    bio: "Personal trainer & wellness coach 💪 Motivating others to live their best life",
    categories: ['fitness', 'lifestyle', 'education'],
    location: {
      city: 'Atlanta',
      state: 'GA',
      country: 'US',
      coordinates: [-84.3880, 33.7490]
    },
    pricing: {
      photos: { min: 0.99, default: 5.49, max: 9.99 },
      videos: { min: 2.99, default: 11.99, max: 19.99 },
      messages: { min: 0.99, default: 4.49, max: 9.99 }
    },
    profileImage: 'creator11.png',
    coverImage: 'creator12.png',
    verified: true,
    showInBrowse: true,
    isTopCreator: true
  },
  {
    email: 'luna.chen@example.com',
    displayName: 'Luna Chen',
    age: 24,
    gender: 'female',
    orientation: 'pansexual',
    bodyType: 'Slender',
    ethnicity: 'Asian',
    hairColor: 'Black',
    height: 61, // 5'1"
    bio: "Cosplay artist & anime lover 🎭 Bringing fantasies to life one costume at a time",
    categories: ['cosplay', 'artistic', 'gaming'],
    location: {
      city: 'Las Vegas',
      state: 'NV',
      country: 'US',
      coordinates: [-115.1398, 36.1699]
    },
    pricing: {
      photos: { min: 0.99, default: 3.99, max: 9.99 },
      videos: { min: 2.99, default: 7.99, max: 19.99 },
      messages: { min: 0.99, default: 2.99, max: 9.99 }
    },
    profileImage: 'creator13.png',
    coverImage: 'creator14.png',
    verified: true,
    showInBrowse: true
  },
  {
    email: 'savannah.white@example.com',
    displayName: 'Savannah White',
    age: 26,
    gender: 'female',
    orientation: 'straight',
    bodyType: 'Average',
    ethnicity: 'Caucasian',
    hairColor: 'Blonde',
    height: 66, // 5'6"
    bio: "Southern belle with big city dreams ✨ Fashion blogger & lifestyle content creator",
    categories: ['fashion', 'lifestyle', 'travel'],
    location: {
      city: 'Nashville',
      state: 'TN',
      country: 'US',
      coordinates: [-86.7816, 36.1627]
    },
    pricing: {
      photos: { min: 0.99, default: 4.49, max: 9.99 },
      videos: { min: 2.99, default: 8.99, max: 19.99 },
      messages: { min: 0.99, default: 3.49, max: 9.99 }
    },
    profileImage: 'creator15.png',
    coverImage: 'creator16.png',
    verified: true,
    showInBrowse: true
  },
  {
    email: 'dani.rodriguez@example.com',
    displayName: 'Dani Rodriguez',
    age: 23,
    gender: 'female',
    orientation: 'bisexual',
    bodyType: 'Curvy',
    ethnicity: 'Hispanic/Latino',
    hairColor: 'Brown',
    height: 63, // 5'3"
    bio: "Dance instructor & music lover 💃 Teaching salsa and sharing my passion for movement",
    categories: ['dance', 'music', 'lifestyle'],
    location: {
      city: 'Phoenix',
      state: 'AZ',
      country: 'US',
      coordinates: [-112.0740, 33.4484]
    },
    pricing: {
      photos: { min: 0.99, default: 3.49, max: 9.99 },
      videos: { min: 2.99, default: 6.99, max: 19.99 },
      messages: { min: 0.99, default: 2.49, max: 9.99 }
    },
    profileImage: 'creator16.png',
    coverImage: 'creator17.png',
    verified: false,
    showInBrowse: true
  },
  {
    email: 'taylor.green@example.com',
    displayName: 'Taylor Green',
    age: 29,
    gender: 'female',
    orientation: 'straight',
    bodyType: 'Plus Size',
    ethnicity: 'Caucasian',
    hairColor: 'Red',
    height: 67, // 5'7"
    bio: "Body positivity advocate & chef 👩‍🍳 Sharing delicious recipes and self-love tips",
    categories: ['food', 'lifestyle', 'body-positivity'],
    location: {
      city: 'Denver',
      state: 'CO',
      country: 'US',
      coordinates: [-104.9903, 39.7392]
    },
    pricing: {
      photos: { min: 0.99, default: 3.99, max: 9.99 },
      videos: { min: 2.99, default: 7.99, max: 19.99 },
      messages: { min: 0.99, default: 2.99, max: 9.99 }
    },
    profileImage: 'creator17.png',
    coverImage: 'creator15.png',
    verified: true,
    showInBrowse: true
  },
  {
    email: 'brooklyn.james@example.com',
    displayName: 'Brooklyn James',
    age: 21,
    gender: 'female',
    orientation: 'pansexual',
    bodyType: 'Slim',
    ethnicity: 'Black',
    hairColor: 'Brown',
    height: 65, // 5'5"
    bio: "College athlete & study buddy 📚 Balancing sports, academics, and authentic connections",
    categories: ['fitness', 'education', 'lifestyle'],
    location: {
      city: 'Boston',
      state: 'MA',
      country: 'US',
      coordinates: [-71.0589, 42.3601]
    },
    pricing: {
      photos: { min: 0.99, default: 2.49, max: 9.99 },
      videos: { min: 2.99, default: 4.99, max: 19.99 },
      messages: { min: 0.99, default: 1.49, max: 9.99 }
    },
    profileImage: 'creator12.png',
    coverImage: 'creator13.png',
    verified: false,
    showInBrowse: true
  },
  {
    email: 'mia.foster@example.com',
    displayName: 'Mia Foster',
    age: 27,
    gender: 'female',
    orientation: 'straight',
    bodyType: 'Athletic',
    ethnicity: 'Mixed',
    hairColor: 'Blonde',
    height: 64, // 5'4"
    bio: "Surfer girl & ocean lover 🌊 Living the beach life and sharing good vibes only",
    categories: ['sports', 'lifestyle', 'travel'],
    location: {
      city: 'Honolulu',
      state: 'HI',
      country: 'US',
      coordinates: [-157.8583, 21.3099]
    },
    pricing: {
      photos: { min: 0.99, default: 4.99, max: 9.99 },
      videos: { min: 2.99, default: 9.99, max: 19.99 },
      messages: { min: 0.99, default: 3.99, max: 9.99 }
    },
    profileImage: 'creator14.png',
    coverImage: 'creator11.png',
    verified: true,
    showInBrowse: true
  },
  {
    email: 'alexis.stone@example.com',
    displayName: 'Alexis Stone',
    age: 25,
    gender: 'female',
    orientation: 'bisexual',
    bodyType: 'Slender',
    ethnicity: 'Caucasian',
    hairColor: 'Black',
    height: 69, // 5'9"
    bio: "Alternative model & tattoo enthusiast 🖤 Expressing art through body and soul",
    categories: ['alternative', 'artistic', 'modeling'],
    location: {
      city: 'Tampa',
      state: 'FL',
      country: 'US',
      coordinates: [-82.4572, 27.9506]
    },
    pricing: {
      photos: { min: 0.99, default: 5.99, max: 9.99 },
      videos: { min: 2.99, default: 12.99, max: 19.99 },
      messages: { min: 0.99, default: 4.99, max: 9.99 }
    },
    profileImage: 'creator10.png',
    coverImage: 'creator9.png',
    verified: true,
    showInBrowse: true,
    isTopCreator: true
  }
];

// Mock member data for creator CRM testing
const mockMemberData = [
  {
    email: 'luxury.lover88@gmail.com',
    username: 'LuxuryLover88',
    age: 32,
    location: {
      city: 'Los Angeles',
      state: 'CA',
      country: 'US',
      coordinates: [-118.2437, 34.0522]
    },
    spending: {
      tier: 'whale',
      totalSpent: 2847.50,
      last30DaySpend: 847.50,
      last7DaySpend: 234.75,
      averagePurchase: 45.99,
      largestPurchase: 125.00,
      purchaseFrequency: 'weekly'
    },
    activity: {
      engagementLevel: 'very-active',
      contentPurchases: 62,
      tipsGiven: 23,
      messagesExchanged: 145,
      responseRate: 92,
      averageSessionLength: 35
    },
    subscription: {
      hasSubscribed: true,
      subscriptionTier: 'premium',
      autoRenew: true,
      subscriptionValue: 29.99
    },
    preferences: {
      categories: ['Fitness', 'Lifestyle', 'Fashion'],
      contentTypes: ['videos', 'photos', 'messages'],
      priceRange: { min: 5, max: 50 },
      favoriteContentType: 'Videos',
      communicationStyle: 'frequent'
    },
    badges: ['whale', 'big-spender', 'vip', 'loyal-fan'],
    isOnline: true,
    joinedDaysAgo: 45
  },
  {
    email: 'contentking.ny@gmail.com',
    username: 'ContentKing',
    age: 28,
    location: {
      city: 'New York',
      state: 'NY',
      country: 'US',
      coordinates: [-74.0060, 40.7128]
    },
    spending: {
      tier: 'high',
      totalSpent: 1234.75,
      last30DaySpend: 234.75,
      last7DaySpend: 89.50,
      averagePurchase: 25.50,
      largestPurchase: 75.00,
      purchaseFrequency: 'bi-weekly'
    },
    activity: {
      engagementLevel: 'active',
      contentPurchases: 48,
      tipsGiven: 15,
      messagesExchanged: 89,
      responseRate: 85,
      averageSessionLength: 22
    },
    subscription: {
      hasSubscribed: true,
      subscriptionTier: 'basic',
      autoRenew: false,
      subscriptionValue: 12.99
    },
    preferences: {
      categories: ['Art', 'Photography', 'Travel'],
      contentTypes: ['photos', 'messages'],
      priceRange: { min: 2, max: 30 },
      favoriteContentType: 'Photos',
      communicationStyle: 'occasional'
    },
    badges: ['supporter', 'engaged'],
    isOnline: true,
    joinedDaysAgo: 62
  },
  {
    email: 'nightowl23@gmail.com',
    username: 'NightOwl23',
    age: 24,
    location: {
      city: 'Chicago',
      state: 'IL',
      country: 'US',
      coordinates: [-87.6298, 41.8781]
    },
    spending: {
      tier: 'medium',
      totalSpent: 567.25,
      last30DaySpend: 127.25,
      last7DaySpend: 45.00,
      averagePurchase: 15.75,
      largestPurchase: 35.00,
      purchaseFrequency: 'monthly'
    },
    activity: {
      engagementLevel: 'moderate',
      contentPurchases: 36,
      tipsGiven: 8,
      messagesExchanged: 52,
      responseRate: 78,
      averageSessionLength: 18
    },
    subscription: {
      hasSubscribed: false,
      subscriptionTier: null,
      autoRenew: false,
      subscriptionValue: 0
    },
    preferences: {
      categories: ['Gaming', 'Anime', 'Music'],
      contentTypes: ['messages', 'photos'],
      priceRange: { min: 1, max: 20 },
      favoriteContentType: 'Messages',
      communicationStyle: 'occasional'
    },
    badges: ['night-owl', 'regular'],
    isOnline: false,
    joinedDaysAgo: 21
  },
  {
    email: 'premiumfan.vip@gmail.com',
    username: 'PremiumFan',
    age: 35,
    location: {
      city: 'Miami',
      state: 'FL',
      country: 'US',
      coordinates: [-80.1918, 25.7617]
    },
    spending: {
      tier: 'whale',
      totalSpent: 4567.80,
      last30DaySpend: 1234.50,
      last7DaySpend: 456.78,
      averagePurchase: 67.25,
      largestPurchase: 199.99,
      purchaseFrequency: 'daily'
    },
    activity: {
      engagementLevel: 'very-active',
      contentPurchases: 68,
      tipsGiven: 45,
      messagesExchanged: 234,
      responseRate: 95,
      averageSessionLength: 45
    },
    subscription: {
      hasSubscribed: true,
      subscriptionTier: 'vip',
      autoRenew: true,
      subscriptionValue: 79.99
    },
    preferences: {
      categories: ['Exclusive', 'VIP', 'Premium'],
      contentTypes: ['videos', 'live', 'messages', 'photos'],
      priceRange: { min: 10, max: 100 },
      favoriteContentType: 'Live Shows',
      communicationStyle: 'frequent'
    },
    badges: ['whale', 'vip', 'top-supporter', 'loyal-fan'],
    isOnline: true,
    joinedDaysAgo: 134
  },
  {
    email: 'newexplorer2024@gmail.com',
    username: 'NewExplorer',
    age: 21,
    location: {
      city: 'Austin',
      state: 'TX',
      country: 'US',
      coordinates: [-97.7431, 30.2672]
    },
    spending: {
      tier: 'low',
      totalSpent: 45.50,
      last30DaySpend: 45.50,
      last7DaySpend: 12.99,
      averagePurchase: 9.10,
      largestPurchase: 15.99,
      purchaseFrequency: 'rare'
    },
    activity: {
      engagementLevel: 'inactive',
      contentPurchases: 5,
      tipsGiven: 1,
      messagesExchanged: 12,
      responseRate: 60,
      averageSessionLength: 8
    },
    subscription: {
      hasSubscribed: false,
      subscriptionTier: null,
      autoRenew: false,
      subscriptionValue: 0
    },
    preferences: {
      categories: ['Beginner', 'Explore'],
      contentTypes: ['photos'],
      priceRange: { min: 1, max: 10 },
      favoriteContentType: 'Photos',
      communicationStyle: 'minimal'
    },
    badges: ['newcomer'],
    isOnline: false,
    joinedDaysAgo: 7
  },
  {
    email: 'seattle.techie@gmail.com',
    username: 'SeattleTechie',
    age: 29,
    location: {
      city: 'Seattle',
      state: 'WA',
      country: 'US',
      coordinates: [-122.3321, 47.6062]
    },
    spending: {
      tier: 'medium',
      totalSpent: 789.25,
      last30DaySpend: 156.75,
      last7DaySpend: 67.50,
      averagePurchase: 28.50,
      largestPurchase: 89.99,
      purchaseFrequency: 'bi-weekly'
    },
    activity: {
      engagementLevel: 'active',
      contentPurchases: 27,
      tipsGiven: 12,
      messagesExchanged: 78,
      responseRate: 88,
      averageSessionLength: 25
    },
    subscription: {
      hasSubscribed: true,
      subscriptionTier: 'basic',
      autoRenew: true,
      subscriptionValue: 12.99
    },
    preferences: {
      categories: ['Gaming', 'Education', 'Lifestyle'],
      contentTypes: ['videos', 'photos'],
      priceRange: { min: 3, max: 40 },
      favoriteContentType: 'Videos',
      communicationStyle: 'occasional'
    },
    badges: ['supporter', 'engaged', 'night-owl'],
    isOnline: true,
    joinedDaysAgo: 89
  },
  {
    email: 'phoenix.wanderer@gmail.com',
    username: 'PhoenixWanderer',
    age: 26,
    location: {
      city: 'Phoenix',
      state: 'AZ',
      country: 'US',
      coordinates: [-112.0740, 33.4484]
    },
    spending: {
      tier: 'high',
      totalSpent: 1567.40,
      last30DaySpend: 342.80,
      last7DaySpend: 124.50,
      averagePurchase: 42.60,
      largestPurchase: 95.00,
      purchaseFrequency: 'weekly'
    },
    activity: {
      engagementLevel: 'very-active',
      contentPurchases: 36,
      tipsGiven: 28,
      messagesExchanged: 156,
      responseRate: 91,
      averageSessionLength: 32
    },
    subscription: {
      hasSubscribed: true,
      subscriptionTier: 'premium',
      autoRenew: true,
      subscriptionValue: 29.99
    },
    preferences: {
      categories: ['Travel', 'Art', 'Lifestyle', 'Fashion'],
      contentTypes: ['photos', 'videos', 'messages'],
      priceRange: { min: 5, max: 60 },
      favoriteContentType: 'Photos',
      communicationStyle: 'frequent'
    },
    badges: ['vip', 'supporter', 'generous-tipper', 'conversation-starter'],
    isOnline: false,
    joinedDaysAgo: 156
  },
  {
    email: 'boston.scholar@gmail.com',
    username: 'BostonScholar',
    age: 31,
    location: {
      city: 'Boston',
      state: 'MA',
      country: 'US',
      coordinates: [-71.0589, 42.3601]
    },
    spending: {
      tier: 'medium',
      totalSpent: 412.90,
      last30DaySpend: 89.75,
      last7DaySpend: 34.50,
      averagePurchase: 19.75,
      largestPurchase: 45.00,
      purchaseFrequency: 'monthly'
    },
    activity: {
      engagementLevel: 'moderate',
      contentPurchases: 20,
      tipsGiven: 6,
      messagesExchanged: 43,
      responseRate: 76,
      averageSessionLength: 15
    },
    subscription: {
      hasSubscribed: false,
      subscriptionTier: null,
      autoRenew: false,
      subscriptionValue: 0
    },
    preferences: {
      categories: ['Educational', 'Art', 'Music'],
      contentTypes: ['messages', 'photos'],
      priceRange: { min: 2, max: 25 },
      favoriteContentType: 'Messages',
      communicationStyle: 'minimal'
    },
    badges: ['regular', 'conversation-starter'],
    isOnline: true,
    joinedDaysAgo: 67
  },
  {
    email: 'vegas.high.roller@gmail.com',
    username: 'VegasHighRoller',
    age: 38,
    location: {
      city: 'Las Vegas',
      state: 'NV',
      country: 'US',
      coordinates: [-115.1398, 36.1699]
    },
    spending: {
      tier: 'whale',
      totalSpent: 6234.75,
      last30DaySpend: 1876.25,
      last7DaySpend: 567.80,
      averagePurchase: 89.50,
      largestPurchase: 249.99,
      purchaseFrequency: 'daily'
    },
    activity: {
      engagementLevel: 'very-active',
      contentPurchases: 69,
      tipsGiven: 58,
      messagesExchanged: 287,
      responseRate: 97,
      averageSessionLength: 52
    },
    subscription: {
      hasSubscribed: true,
      subscriptionTier: 'elite',
      autoRenew: true,
      subscriptionValue: 149.99
    },
    preferences: {
      categories: ['Exclusive', 'VIP', 'Premium', 'Luxury'],
      contentTypes: ['videos', 'live', 'messages', 'photos', 'stories'],
      priceRange: { min: 20, max: 250 },
      favoriteContentType: 'Live Shows',
      communicationStyle: 'frequent'
    },
    badges: ['whale', 'big-spender', 'top-supporter', 'loyal-fan', 'generous-tipper', 'vip'],
    isOnline: true,
    joinedDaysAgo: 278
  },
  {
    email: 'denver.mountain@gmail.com',
    username: 'DenverMountain',
    age: 27,
    location: {
      city: 'Denver',
      state: 'CO',
      country: 'US',
      coordinates: [-104.9903, 39.7392]
    },
    spending: {
      tier: 'low',
      totalSpent: 123.45,
      last30DaySpend: 67.90,
      last7DaySpend: 23.50,
      averagePurchase: 12.35,
      largestPurchase: 29.99,
      purchaseFrequency: 'monthly'
    },
    activity: {
      engagementLevel: 'moderate',
      contentPurchases: 10,
      tipsGiven: 3,
      messagesExchanged: 28,
      responseRate: 71,
      averageSessionLength: 12
    },
    subscription: {
      hasSubscribed: false,
      subscriptionTier: null,
      autoRenew: false,
      subscriptionValue: 0
    },
    preferences: {
      categories: ['Fitness', 'Travel', 'Lifestyle'],
      contentTypes: ['photos', 'videos'],
      priceRange: { min: 1, max: 15 },
      favoriteContentType: 'Photos',
      communicationStyle: 'minimal'
    },
    badges: ['regular'],
    isOnline: false,
    joinedDaysAgo: 34
  }
];

/**
 * Upload image to Cloudinary
 */
async function uploadToCloudinary(imagePath, publicId) {
  try {
    console.log(`Uploading ${imagePath} to Cloudinary...`);
    
    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: publicId,
      folder: 'creator-profiles',
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'fill', quality: 'auto' }
      ]
    });
    
    console.log(`✅ Uploaded: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Error uploading ${imagePath}:`, error);
    return null;
  }
}

/**
 * Create a single creator with all related records
 */
async function createCreator(creatorData) {
  try {
    console.log(`Creating creator: ${creatorData.displayName}...`);
    
    // 1. Create User record
    const userData = {
      email: creatorData.email,
      password: 'TempPass123!', // They would reset this
      role: 'creator',
      isEmailVerified: true,
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 30) // Random date within last 30 days
    };
    
    const user = await User.create(userData);
    console.log(`  ✅ User created: ${user.email}`);
    
    // 2. Upload images to Cloudinary
    const frontendPublicPath = path.join(__dirname, '../../../frontend/public/placeholders');
    const profileImagePath = path.join(frontendPublicPath, creatorData.profileImage);
    const coverImagePath = path.join(frontendPublicPath, creatorData.coverImage);
    
    let profileImageUrl = null;
    let coverImageUrl = null;
    
    if (fs.existsSync(profileImagePath)) {
      profileImageUrl = await uploadToCloudinary(
        profileImagePath, 
        `creator-${user._id}-profile`
      );
    }
    
    if (fs.existsSync(coverImagePath)) {
      coverImageUrl = await uploadToCloudinary(
        coverImagePath, 
        `creator-${user._id}-cover`
      );
    }
    
    // 3. Create Creator record
    const creator = await Creator.create({
      user: user._id,
      displayName: creatorData.displayName,
      bio: creatorData.bio,
      profileImage: profileImageUrl || 'default-avatar.jpg',
      coverImage: coverImageUrl,
      contentPrice: creatorData.pricing.photos.default,
      isVerified: creatorData.verified,
      stats: {
        totalEarnings: Math.floor(Math.random() * 10000),
        monthlyEarnings: Math.floor(Math.random() * 3000),
        totalMatches: Math.floor(Math.random() * 500),
        totalLikes: Math.floor(Math.random() * 1000),
        rating: 4.0 + Math.random(),
        ratingCount: Math.floor(Math.random() * 100)
      },
      location: {
        type: 'Point',
        coordinates: creatorData.location.coordinates,
        city: creatorData.location.city,
        state: creatorData.location.state,
        country: creatorData.location.country
      },
      preferences: {
        minAge: 18,
        maxAge: 99,
        interestedIn: ['men', 'women']
      },
      lastActive: new Date(Date.now() - Math.random() * 86400000), // Random within last day
      isPaused: false
    });
    
    console.log(`  ✅ Creator created: ${creator.displayName}`);
    
    // 4. Create CreatorProfile record with detailed demographics
    const creatorProfile = await CreatorProfile.create({
      creator: creator._id,
      
      // Branding
      branding: {
        primaryColor: '#17D2C2',
        welcomeMessage: `Welcome to ${creatorData.displayName}'s exclusive content! 🔥`,
        customBio: {
          headline: creatorData.displayName,
          aboutMe: creatorData.bio
        }
      },
      
      // Demographics for filtering
      demographics: {
        age: creatorData.age,
        gender: creatorData.gender,
        orientation: creatorData.orientation,
        bodyType: creatorData.bodyType,
        ethnicity: creatorData.ethnicity,
        hairColor: creatorData.hairColor,
        height: creatorData.height,
        categories: creatorData.categories
      },
      
      // Browse settings
      browseSettings: {
        showInBrowse: creatorData.showInBrowse,
        browsePreferences: {
          men: true,
          women: true,
          couples: false,
          nonBinary: true
        }
      },
      
      // Analytics
      analytics: {
        realTime: {
          activeViewers: Math.floor(Math.random() * 50),
          todayEarnings: Math.floor(Math.random() * 500),
          todayViews: Math.floor(Math.random() * 1000),
          todayNewSubscribers: Math.floor(Math.random() * 20)
        }
      },
      
      // Financials
      financials: {
        earningsGoals: {
          daily: 100,
          weekly: 700,
          monthly: 3000
        }
      },
      
      // Automation
      automation: {
        welcomeMessage: {
          enabled: true,
          message: "Hey! Thanks for connecting with me 💕",
          delay: 5
        }
      }
    });
    
    console.log(`  ✅ CreatorProfile created for: ${creator.displayName}`);
    console.log(`  📍 Location: ${creatorData.location.city}, ${creatorData.location.state}`);
    console.log(`  🎯 Demographics: ${creatorData.age}y, ${creatorData.ethnicity}, ${creatorData.bodyType}`);
    console.log('');
    
    return { user, creator, creatorProfile };
    
  } catch (error) {
    console.error(`❌ Error creating creator ${creatorData.displayName}:`, error);
    throw error;
  }
}

/**
 * Create a single member with all related records
 */
async function createMember(memberData) {
  try {
    console.log(`Creating member: ${memberData.username}...`);
    
    // 1. Create User record
    const userData = {
      email: memberData.email,
      password: 'TempPass123!', // They would reset this
      role: 'member',
      isEmailVerified: true,
      isActive: true,
      lastLogin: new Date(Date.now() - Math.random() * 86400000 * 7), // Random within last week
      createdAt: new Date(Date.now() - memberData.joinedDaysAgo * 86400000)
    };
    
    const user = await User.create(userData);
    console.log(`  ✅ User created: ${user.email}`);
    
    // 2. Create Member record
    const member = await Member.create({
      user: user._id,
      username: memberData.username,
      profileImage: 'default-avatar.jpg', // Members don't upload profile photos for privacy
      credits: Math.floor(Math.random() * 500) + 100, // Random credits 100-600
      preferences: {
        ageRange: {
          min: 18,
          max: Math.max(35, memberData.age + 10)
        },
        interestedIn: ['women'], // Most members interested in female creators
        contentTypes: memberData.preferences.contentTypes,
        maxDistance: 100
      },
      location: {
        type: 'Point',
        coordinates: memberData.location.coordinates
      },
      lastActive: memberData.isOnline ? new Date() : new Date(Date.now() - Math.random() * 86400000 * 3) // Random within last 3 days
    });
    
    console.log(`  ✅ Member created: ${member.username}`);
    
    // 3. Create MemberProfile record with detailed CRM data
    const purchaseDates = {
      first: new Date(Date.now() - memberData.joinedDaysAgo * 86400000 * 0.8), // 80% through membership
      last: new Date(Date.now() - Math.random() * 86400000 * 7) // Random within last week
    };
    
    const memberProfile = await MemberProfile.create({
      member: member._id,
      
      // Spending data
      spending: {
        tier: memberData.spending.tier,
        totalSpent: memberData.spending.totalSpent,
        last30DaySpend: memberData.spending.last30DaySpend,
        last7DaySpend: memberData.spending.last7DaySpend,
        averagePurchase: memberData.spending.averagePurchase,
        largestPurchase: memberData.spending.largestPurchase,
        firstPurchaseDate: purchaseDates.first,
        lastPurchaseDate: purchaseDates.last,
        purchaseFrequency: memberData.spending.purchaseFrequency
      },
      
      // Activity data
      activity: {
        engagementLevel: memberData.activity.engagementLevel,
        contentPurchases: memberData.activity.contentPurchases,
        tipsGiven: memberData.activity.tipsGiven,
        messagesExchanged: memberData.activity.messagesExchanged,
        responseRate: memberData.activity.responseRate,
        averageSessionLength: memberData.activity.averageSessionLength,
        loginStreak: {
          current: Math.floor(Math.random() * 10),
          longest: Math.floor(Math.random() * 30)
        }
      },
      
      // Subscription data
      subscription: {
        hasSubscribed: memberData.subscription.hasSubscribed,
        subscriptionTier: memberData.subscription.subscriptionTier,
        subscriptionStartDate: memberData.subscription.hasSubscribed ? 
          new Date(Date.now() - Math.random() * 86400000 * 90) : null,
        subscriptionEndDate: memberData.subscription.hasSubscribed ? 
          new Date(Date.now() + 86400000 * 30) : null,
        autoRenew: memberData.subscription.autoRenew,
        subscriptionValue: memberData.subscription.subscriptionValue
      },
      
      // Preferences
      preferences: {
        categories: memberData.preferences.categories,
        contentTypes: memberData.preferences.contentTypes,
        priceRange: memberData.preferences.priceRange,
        favoriteContentType: memberData.preferences.favoriteContentType,
        communicationStyle: memberData.preferences.communicationStyle
      },
      
      // Demographics
      demographics: {
        age: memberData.age,
        location: {
          city: memberData.location.city,
          state: memberData.location.state,
          country: memberData.location.country,
          coordinates: memberData.location.coordinates
        },
        timezone: 'America/New_York', // Default timezone
        language: 'en'
      },
      
      // Badges (will be calculated by the method)
      badges: memberData.badges,
      
      // CRM data (empty for now, creators would add notes)
      crm: {
        notes: [],
        tags: [],
        lastContactedBy: null,
        followUpReminders: []
      },
      
      // Analytics
      analytics: {
        churnRisk: {
          level: 'low',
          reasons: [],
          lastCalculated: new Date()
        },
        ltv: {
          estimated: memberData.spending.totalSpent * 2.5, // Rough LTV estimate
          confidence: Math.floor(Math.random() * 40) + 60 // 60-100% confidence
        },
        segments: ['high-value', 'loyal-customer', 'growth-potential'].filter(() => Math.random() > 0.7),
        predictedActions: []
      },
      
      // Privacy settings
      privacy: {
        allowDataTracking: true,
        allowPersonalizedOffers: true,
        allowCommunication: true
      },
      
      // Billing info
      billing: {
        preferredPaymentMethod: ['credit-card', 'paypal'][Math.floor(Math.random() * 2)],
        billingCountry: 'US',
        hasPaymentIssues: false,
        lastPaymentDate: purchaseDates.last,
        failedPaymentAttempts: 0
      }
    });
    
    // Calculate and assign proper badges based on spending/activity
    memberProfile.assignBadges();
    memberProfile.calculateChurnRisk();
    await memberProfile.save();
    
    console.log(`  ✅ MemberProfile created for: ${member.username}`);
    console.log(`  📍 Location: ${memberData.location.city}, ${memberData.location.state}`);
    console.log(`  💰 Tier: ${memberData.spending.tier} ($${memberData.spending.totalSpent} total)`);
    console.log(`  🎯 Engagement: ${memberData.activity.engagementLevel}`);
    console.log('');
    
    return { user, member, memberProfile };
    
  } catch (error) {
    console.error(`❌ Error creating member ${memberData.username}:`, error);
    throw error;
  }
}

/**
 * Main seeding function
 */
async function seedCreators() {
  try {
    console.log('🌱 Starting creator and member seeding...\n');
    
    // Check if we're being called from API (mongoose already connected) or standalone
    const isStandalone = require.main === module;
    
    if (isStandalone) {
      // Connect to MongoDB for standalone execution
      const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/sexyselfies';
      
      if (!mongoUri || mongoUri.includes('undefined')) {
        console.error('❌ MongoDB connection string not found!');
        console.log('Please set MONGO_URI or MONGODB_URI environment variable.');
        console.log('Your server is running, so you can also copy the connection from your terminal output.');
        return { success: false, error: 'No MongoDB connection string' };
      }
      
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to MongoDB\n');
    } else {
      console.log('✅ Using existing MongoDB connection\n');
    }
    
    // Check if we should clear existing data
    const existingCreators = await Creator.countDocuments();
    const existingMembers = await Member.countDocuments();
    if (existingCreators > 0 || existingMembers > 0) {
      console.log(`⚠️  Found ${existingCreators} existing creators and ${existingMembers} existing members.`);
      console.log('To avoid duplicates, please clear the database first or use different emails.\n');
    }
    
    // Create all creators
    const createdCreators = [];
    for (const creatorData of mockCreatorData) {
      try {
        const result = await createCreator(creatorData);
        createdCreators.push(result);
      } catch (error) {
        console.error(`Failed to create ${creatorData.displayName}, continuing...`);
      }
    }
    
    // Create all members
    console.log('\n🧑‍💼 Creating members for CRM testing...\n');
    const createdMembers = [];
    for (const memberData of mockMemberData) {
      try {
        const result = await createMember(memberData);
        createdMembers.push(result);
      } catch (error) {
        console.error(`Failed to create ${memberData.username}, continuing...`);
      }
    }
    
    console.log(`🎉 Successfully created ${createdCreators.length} creators and ${createdMembers.length} members!`);
    
    console.log('\n📋 Created creators:');
    createdCreators.forEach((creator, index) => {
      console.log(`${index + 1}. ${creator.creator.displayName} (${creator.user.email})`);
    });
    
    console.log('\n📋 Created members:');
    createdMembers.forEach((member, index) => {
      console.log(`${index + 1}. ${member.member.username} (${member.user.email}) - ${member.memberProfile.spending.tier} tier`);
    });
    
    console.log('\n✅ Seeding complete!');
    console.log('\n🎯 You can now test:');
    console.log('👤 Member mode: Browse creators with filtering');
    console.log('✨ Creator mode: Browse members via CRM interface');
    console.log('🛡️  Admin mode: View both creators and members');
    
    return {
      success: true,
      creators: createdCreators.length,
      members: createdMembers.length,
      summary: {
        creators: createdCreators.map(c => ({ 
          name: c.creator.displayName, 
          email: c.user.email 
        })),
        members: createdMembers.map(m => ({ 
          username: m.member.username, 
          email: m.user.email,
          tier: m.memberProfile.spending.tier 
        }))
      }
    };
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    return { 
      success: false, 
      error: error.message,
      stack: error.stack 
    };
  } finally {
    // Only disconnect if running standalone (not from API)
    if (require.main === module) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Export the function
module.exports = { seedCreators };

// Run the seeding
if (require.main === module) {
  seedCreators().catch(console.error);
}