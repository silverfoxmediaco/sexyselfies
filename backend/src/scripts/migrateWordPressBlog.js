const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const xml2js = require('xml2js');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// Import BlogPost model
const BlogPost = require('../models/BlogPost');

/**
 * WordPress to MongoDB Blog Migration Script
 *
 * This script parses a WordPress XML export file and imports blog posts
 * into the MongoDB BlogPost collection.
 *
 * Usage:
 *   node migrateWordPressBlog.js /path/to/wordpress-export.xml
 *
 * Features:
 *   - Parses WordPress WXR format
 *   - Extracts post content, metadata, featured images
 *   - Generates slugs from post names
 *   - Preserves publish dates
 *   - Stores WordPress IDs for tracking
 *   - Skips drafts and private posts
 */

// Helper function to extract text content from XML element
const extractText = (element) => {
  if (!element) return '';
  if (Array.isArray(element)) {
    return element[0] || '';
  }
  if (typeof element === 'string') {
    return element;
  }
  if (element._) {
    return element._;
  }
  return String(element);
};

// Helper function to clean HTML content
const cleanContent = (html) => {
  if (!html) return '';

  // Remove WordPress shortcodes
  let cleaned = html.replace(/\[.*?\]/g, '');

  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
};

// Helper function to extract featured image from post meta
const extractFeaturedImage = (postmeta) => {
  if (!postmeta || !Array.isArray(postmeta)) return '';

  // Look for _thumbnail_id in postmeta
  const thumbnailMeta = postmeta.find(meta => {
    const metaKey = extractText(meta['wp:meta_key']);
    return metaKey === '_thumbnail_id';
  });

  if (thumbnailMeta) {
    const thumbnailId = extractText(thumbnailMeta['wp:meta_value']);
    // We would need to look up the attachment by ID
    // For now, return empty - images will need to be manually added
    return '';
  }

  return '';
};

// Helper function to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .substring(0, 100); // Limit length
};

// Main migration function
const migrateWordPressBlog = async (xmlFilePath) => {
  try {
    console.log('🚀 Starting WordPress blog migration...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Read XML file
    console.log('📂 Reading WordPress export file...');
    const xmlContent = await fs.readFile(xmlFilePath, 'utf-8');
    console.log('✅ XML file loaded\n');

    // Parse XML
    console.log('🔍 Parsing XML...');
    const parser = new xml2js.Parser({
      explicitArray: true,
      mergeAttrs: true,
    });
    const result = await parser.parseStringPromise(xmlContent);
    console.log('✅ XML parsed successfully\n');

    // Extract channel and items
    const channel = result.rss.channel[0];
    const items = channel.item || [];

    console.log(`📊 Found ${items.length} items in export\n`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // Process each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
        // Extract post type and status
        const postType = extractText(item['wp:post_type']);
        const postStatus = extractText(item['wp:status']);

        // Only process published posts
        if (postType !== 'post') {
          console.log(`⏭️  Skipping item ${i + 1}: Not a post (${postType})`);
          skipped++;
          continue;
        }

        if (postStatus !== 'publish') {
          console.log(`⏭️  Skipping item ${i + 1}: Not published (${postStatus})`);
          skipped++;
          continue;
        }

        // Extract post data
        const title = extractText(item.title);
        const content = extractText(item['content:encoded']);
        const excerpt = extractText(item['excerpt:encoded']);
        const postName = extractText(item['wp:post_name']);
        const postId = parseInt(extractText(item['wp:post_id']), 10);
        const postDate = new Date(extractText(item['wp:post_date']));
        const postModified = new Date(extractText(item['wp:post_date_gmt']));
        const postLink = extractText(item.link);

        // Extract author
        const authorLogin = extractText(item['dc:creator']);

        // Extract categories
        const categories = item.category || [];
        const categoryNames = categories
          .filter(cat => cat.domain && cat.domain.includes('category'))
          .map(cat => extractText(cat._));

        // Extract tags
        const tagNames = categories
          .filter(cat => cat.domain && cat.domain.includes('tag'))
          .map(cat => extractText(cat._));

        // Generate slug
        const slug = postName || generateSlug(title);

        // Extract featured image
        const featuredImage = extractFeaturedImage(item['wp:postmeta']);

        // Create or update blog post
        const postData = {
          title: title,
          slug: slug,
          content: cleanContent(content),
          excerpt: excerpt || '',
          featuredImage: featuredImage,
          author: {
            name: authorLogin === 'admin' ? 'Sexy Selfies Team' : authorLogin,
            email: '',
          },
          category: categoryNames[0] || 'Sex Talk',
          tags: tagNames,
          status: 'published',
          publishDate: postDate,
          modifiedDate: postModified,
          wordpressId: postId,
          wordpressUrl: postLink,
          views: 0,
          likes: 0,
        };

        // Check if post already exists
        const existingPost = await BlogPost.findOne({ wordpressId: postId });

        if (existingPost) {
          console.log(`🔄 Updating existing post: "${title}"`);
          await BlogPost.updateOne({ wordpressId: postId }, postData);
        } else {
          console.log(`➕ Creating new post: "${title}"`);
          await BlogPost.create(postData);
        }

        imported++;

      } catch (error) {
        console.error(`❌ Error processing item ${i + 1}:`, error.message);
        errors++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📈 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total items: ${items.length}`);
    console.log(`✅ Imported: ${imported}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(50) + '\n');

    // Close database connection
    await mongoose.connection.close();
    console.log('👋 Database connection closed');

    process.exit(0);

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
const xmlFilePath = process.argv[2];

if (!xmlFilePath) {
  console.error('❌ Error: Please provide path to WordPress XML export file');
  console.log('Usage: node migrateWordPressBlog.js /path/to/export.xml');
  process.exit(1);
}

migrateWordPressBlog(xmlFilePath);
