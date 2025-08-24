// Replace the content of generate-icons.js with this:
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon configurations for different platforms
const iconSizes = [
  // PWA Standard Icons
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'icon-48x48.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 1024, name: 'icon-1024x1024.png' },

  // iOS Icons
  { size: 57, name: 'apple-icon-57x57.png' },
  { size: 60, name: 'apple-icon-60x60.png' },
  { size: 72, name: 'apple-icon-72x72.png' },
  { size: 76, name: 'apple-icon-76x76.png' },
  { size: 114, name: 'apple-icon-114x114.png' },
  { size: 120, name: 'apple-icon-120x120.png' },
  { size: 144, name: 'apple-icon-144x144.png' },
  { size: 152, name: 'apple-icon-152x152.png' },
  { size: 167, name: 'apple-icon-167x167.png' },
  { size: 180, name: 'apple-icon-180x180.png' },
  { size: 1024, name: 'apple-icon-1024x1024.png' },

  // Android Icons
  { size: 36, name: 'android-icon-36x36.png' },
  { size: 48, name: 'android-icon-48x48.png' },
  { size: 72, name: 'android-icon-72x72.png' },
  { size: 96, name: 'android-icon-96x96.png' },
  { size: 144, name: 'android-icon-144x144.png' },
  { size: 192, name: 'android-icon-192x192.png' },

  // Windows Tiles
  { size: 70, name: 'ms-icon-70x70.png' },
  { size: 144, name: 'ms-icon-144x144.png' },
  { size: 150, name: 'ms-icon-150x150.png' },
  { size: 310, name: 'ms-icon-310x310.png' },

  // Maskable Icons for PWA
  { size: 192, name: 'maskable-icon-192x192.png', maskable: true },
  { size: 512, name: 'maskable-icon-512x512.png', maskable: true },

  // Badge Icon (for notifications)
  { size: 72, name: 'badge-72x72.png' },
  { size: 128, name: 'badge-128x128.png' }
];

async function generateIcons() {
  const baseIconPath = path.join(__dirname, 'base-icon.png');
  
  // Check if base icon exists
  if (!fs.existsSync(baseIconPath)) {
    console.error('Base icon (base-icon.png) not found! Please add a 1024x1024 PNG image.');
    return;
  }

  console.log('🎨 Generating icons...\n');

  for (const config of iconSizes) {
    try {
      let pipeline = sharp(baseIconPath)
        .resize(config.size, config.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        });

      // Add padding for maskable icons
      if (config.maskable) {
        const padding = Math.floor(config.size * 0.1);
        pipeline = sharp(baseIconPath)
          .resize(config.size - (padding * 2), config.size - (padding * 2), {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .extend({
            top: padding,
            bottom: padding,
            left: padding,
            right: padding,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          });
      }

      await pipeline
        .png()
        .toFile(path.join(__dirname, config.name));

      console.log(`✅ Generated ${config.name}`);
    } catch (error) {
      console.error(`❌ Error generating ${config.name}:`, error);
    }
  }

  // Generate favicon.ico (multi-resolution)
  try {
    await sharp(baseIconPath)
      .resize(32, 32)
      .toFile(path.join(__dirname, 'favicon.ico'));
    console.log('✅ Generated favicon.ico');
  } catch (error) {
    console.error('❌ Error generating favicon.ico:', error);
  }

  console.log('\n🎉 Icon generation complete!');
}

// Run the generator
generateIcons();