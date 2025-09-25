const mongoose = require('mongoose');
require('dotenv').config();

const Gift = require('../models/Gift');
const Creator = require('../models/Creator');
const Member = require('../models/Member');
const Content = require('../models/Content');

console.log('🔧 Testing Gift Model Database Operations...');

async function testGiftModel() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get existing data for testing
    const creators = await Creator.find().limit(1);
    const members = await Member.find().limit(1);
    const content = await Content.find({ price: { $gt: 0 } }).limit(1);

    console.log('📊 Found test data:');
    console.log(`  - Creators: ${creators.length}`);
    console.log(`  - Members: ${members.length}`);
    console.log(`  - Paid Content: ${content.length}`);

    if (creators.length === 0 || members.length === 0 || content.length === 0) {
      console.log('⚠️ Not enough test data available. Need at least 1 creator, 1 member, and 1 paid content item.');
      process.exit(1);
    }

    // Create a test gift
    const testGift = new Gift({
      creator: creators[0]._id,
      member: members[0]._id,
      content: content[0]._id,
      contentType: content[0].contentType || 'image',
      originalPrice: content[0].price,
      message: 'Test gift message for database validation',
      personalizedMessage: true,
      sourceContext: {
        source: 'browse_members',
        memberTier: 'new',
      },
    });

    console.log('💾 Attempting to save Gift model...');
    const savedGift = await testGift.save();
    console.log('✅ Gift saved successfully!');
    console.log(`   - Gift ID: ${savedGift._id}`);
    console.log(`   - Creator: ${savedGift.creator}`);
    console.log(`   - Member: ${savedGift.member}`);
    console.log(`   - Content: ${savedGift.content}`);
    console.log(`   - Price: $${savedGift.originalPrice}`);
    console.log(`   - Created: ${savedGift.giftedAt}`);

    // Test retrieval with population
    console.log('🔍 Testing Gift retrieval with population...');
    const populatedGift = await Gift.findById(savedGift._id)
      .populate('creator', 'username displayName')
      .populate('member', 'username')
      .populate('content', 'title contentType price');

    if (populatedGift) {
      console.log('✅ Gift retrieved and populated successfully:');
      console.log(`   - Creator: ${populatedGift.creator.username || populatedGift.creator.displayName}`);
      console.log(`   - Member: ${populatedGift.member.username}`);
      console.log(`   - Content: ${populatedGift.content.title} (${populatedGift.content.contentType})`);
    }

    // Test Gift model methods
    console.log('🧪 Testing Gift model methods...');

    // Test markAsViewed
    await populatedGift.markAsViewed();
    console.log('✅ markAsViewed() method works');

    // Test trackClickThrough
    await populatedGift.trackClickThrough();
    console.log('✅ trackClickThrough() method works');

    // Cleanup test gift
    await Gift.findByIdAndDelete(savedGift._id);
    console.log('🧹 Test gift cleaned up');

    console.log('');
    console.log('🎉 All Gift model tests passed successfully!');
    console.log('✅ Gift model can save to database');
    console.log('✅ Population relationships work correctly');
    console.log('✅ Model methods function properly');

  } catch (error) {
    console.error('❌ Gift model test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
  }
}

// Run the test
testGiftModel();