const fs = require('fs');
const path = require('path');

/**
 * Sync high-quality assets images to placeholders folder for easy seed management
 */
async function syncAssetImages() {
  const assetsPath = path.join(__dirname, '../../../frontend/src/assets');
  const placeholdersPath = path.join(__dirname, '../../../frontend/public/placeholders');
  
  console.log('🖼️  Syncing assets to placeholders...\n');
  
  // Get all high-quality AI-generated images
  const assetsImages = fs.readdirSync(assetsPath)
    .filter(file => file.includes('jessatsexyselfies') && file.endsWith('.png'))
    .sort();
    
  console.log(`Found ${assetsImages.length} high-quality assets images`);
  
  // Copy them with cleaner names
  const copiedImages = [];
  
  for (let i = 0; i < assetsImages.length; i++) {
    const sourceFile = path.join(assetsPath, assetsImages[i]);
    const newFileName = `ai-creator-${i + 1}.png`;
    const destFile = path.join(placeholdersPath, newFileName);
    
    try {
      // Only copy if destination doesn't exist
      if (!fs.existsSync(destFile)) {
        fs.copyFileSync(sourceFile, destFile);
        console.log(`✅ Copied: ${assetsImages[i]} → ${newFileName}`);
        copiedImages.push(newFileName);
      } else {
        console.log(`⏭️  Skipped: ${newFileName} (already exists)`);
      }
    } catch (error) {
      console.error(`❌ Failed to copy ${assetsImages[i]}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Sync complete! Copied ${copiedImages.length} new images.`);
  console.log('\n📋 Available images for seed script:');
  
  // List all available placeholder images
  const allPlaceholders = fs.readdirSync(placeholdersPath)
    .filter(file => file.endsWith('.png') || file.endsWith('.jpg'))
    .sort();
    
  allPlaceholders.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });
  
  return {
    success: true,
    copiedImages: copiedImages.length,
    totalImages: allPlaceholders.length,
    images: allPlaceholders
  };
}

// Export for use in other scripts
module.exports = { syncAssetImages };

// Run directly if called
if (require.main === module) {
  syncAssetImages().catch(console.error);
}