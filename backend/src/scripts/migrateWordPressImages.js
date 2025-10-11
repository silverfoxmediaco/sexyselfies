/**
 * WordPress Image Migration Script
 *
 * This script:
 * 1. Reads the WordPress XML export file
 * 2. Extracts all featured image URLs from blog posts
 * 3. Downloads images from WordPress site
 * 4. Uploads them to Cloudinary
 * 5. Updates MongoDB blog posts with new Cloudinary URLs
 *
 * Usage: node src/scripts/migrateWordPressImages.js
 */

require('dotenv').config(); // LOAD ENV VARS FIRST!

const fs = require('fs').promises;
const path = require('path');
const xml2js = require('xml2js');
const https = require('https');
const http = require('http');
const mongoose = require('mongoose');
const { cloudinary } = require('../config/cloudinary');

const BlogPost = require('../models/BlogPost');

// Configuration
const XML_FILE_PATH = path.join(__dirname, '../../../wordpress-export.xml');
const TEMP_DOWNLOAD_DIR = path.join(__dirname, '../../../temp-blog-images');

/**
 * Download image from URL to local file
 */
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = require('fs').createWriteStream(filepath);

    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      require('fs').unlink(filepath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

/**
 * Upload image to Cloudinary
 */
async function uploadToCloudinary(filepath, filename) {
  try {
    const result = await cloudinary.uploader.upload(filepath, {
      folder: 'blog-posts',
      public_id: filename.replace(/\.[^/.]+$/, ''), // Remove extension
      resource_type: 'image',
      overwrite: false,
    });

    return result.secure_url;
  } catch (error) {
    console.error(`Error uploading to Cloudinary: ${error.message}`);
    throw error;
  }
}

/**
 * Parse WordPress XML and extract image URLs
 */
async function parseWordPressXML() {
  try {
    const xmlData = await fs.readFile(XML_FILE_PATH, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);

    const items = result.rss.channel[0].item || [];
    const imageMap = new Map(); // slug -> imageUrl
    const attachmentMap = new Map(); // attachment_id -> url

    // First pass: Build attachment ID to URL mapping
    for (const item of items) {
      const postType = item['wp:post_type']?.[0];
      if (postType === 'attachment') {
        const attachmentId = item['wp:post_id']?.[0];
        const attachmentUrl = item['wp:attachment_url']?.[0];
        if (attachmentId && attachmentUrl) {
          attachmentMap.set(attachmentId, attachmentUrl);
        }
      }
    }

    console.log(`   Found ${attachmentMap.size} attachment files`);

    // Second pass: Match posts to their featured images
    for (const item of items) {
      const postType = item['wp:post_type']?.[0];
      const postStatus = item['wp:status']?.[0];

      // Only process published posts
      if (postType !== 'post' || postStatus !== 'publish') {
        continue;
      }

      // Get slug
      const slug = item['wp:post_name']?.[0];
      if (!slug) continue;

      // Look for _thumbnail_id in postmeta
      const postmeta = item['wp:postmeta'] || [];
      let thumbnailId = null;

      for (const meta of postmeta) {
        const metaKey = meta['wp:meta_key']?.[0];
        if (metaKey === '_thumbnail_id') {
          thumbnailId = meta['wp:meta_value']?.[0];
          break;
        }
      }

      // If we found a thumbnail ID, get its URL
      if (thumbnailId && attachmentMap.has(thumbnailId)) {
        imageMap.set(slug, attachmentMap.get(thumbnailId));
        continue;
      }

      // Fallback: Extract first image from content
      const content = item['content:encoded']?.[0] || '';
      const imgRegex = /<img[^>]+src="([^">]+)"/gi;
      const match = imgRegex.exec(content);

      if (match && match[1]) {
        imageMap.set(slug, match[1]);
      }
    }

    return imageMap;
  } catch (error) {
    console.error('Error parsing XML:', error.message);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrateImages() {
  console.log('🚀 Starting WordPress Image Migration...\n');

  try {
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Create temp directory
    try {
      await fs.mkdir(TEMP_DOWNLOAD_DIR, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    // Parse XML and get image URLs
    console.log('📄 Parsing WordPress XML...');
    const imageMap = await parseWordPressXML();
    console.log(`✅ Found ${imageMap.size} images to migrate\n`);

    let successCount = 0;
    let errorCount = 0;

    // Process each image
    for (const [slug, imageUrl] of imageMap) {
      try {
        console.log(`\n📸 Processing: ${slug}`);
        console.log(`   Original URL: ${imageUrl}`);

        // Find blog post in database
        const post = await BlogPost.findOne({ slug });
        if (!post) {
          console.log(`   ⚠️  Post not found in database, skipping...`);
          errorCount++;
          continue;
        }

        // Skip if already has a Cloudinary URL
        if (post.featuredImage && post.featuredImage.includes('cloudinary.com')) {
          console.log(`   ✓ Already has Cloudinary URL, skipping...`);
          successCount++;
          continue;
        }

        // Generate filename from URL
        const urlPath = new URL(imageUrl).pathname;
        const filename = path.basename(urlPath);
        const filepath = path.join(TEMP_DOWNLOAD_DIR, filename);

        // Download image
        console.log(`   ⬇️  Downloading...`);
        await downloadImage(imageUrl, filepath);
        console.log(`   ✓ Downloaded`);

        // Upload to Cloudinary
        console.log(`   ⬆️  Uploading to Cloudinary...`);
        const cloudinaryUrl = await uploadToCloudinary(filepath, filename);
        console.log(`   ✓ Uploaded: ${cloudinaryUrl}`);

        // Update database
        post.featuredImage = cloudinaryUrl;
        await post.save();
        console.log(`   ✓ Database updated`);

        // Delete temp file
        await fs.unlink(filepath);

        successCount++;
        console.log(`   ✅ Success!`);

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }

    // Cleanup
    try {
      await fs.rmdir(TEMP_DOWNLOAD_DIR);
    } catch (err) {
      // Directory might not be empty or already deleted
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary');
    console.log('='.repeat(50));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📝 Total: ${imageMap.size}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run migration
migrateImages();
