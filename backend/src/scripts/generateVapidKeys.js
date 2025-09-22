#!/usr/bin/env node

/**
 * Generate VAPID keys for Web Push notifications
 *
 * VAPID (Voluntary Application Server Identification for Web Push) keys are used
 * to identify your application server to push services like FCM, Mozilla, etc.
 *
 * Run this script to generate the keys, then add them to your .env file:
 *
 * VAPID_PUBLIC_KEY=your_public_key_here
 * VAPID_PRIVATE_KEY=your_private_key_here
 */

const webpush = require('web-push');

console.log('🔑 Generating VAPID keys for push notifications...\n');

try {
  const vapidKeys = webpush.generateVAPIDKeys();

  console.log('✅ VAPID keys generated successfully!\n');
  console.log('Add these to your .env file:\n');
  console.log('# Push Notification VAPID Keys');
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  console.log('\n📝 Note: Keep the private key secret! Do not commit it to version control.');
  console.log('🌐 The public key can be safely shared with your frontend application.');

} catch (error) {
  console.error('❌ Error generating VAPID keys:', error.message);
  console.log('\n💡 Make sure you have the web-push package installed:');
  console.log('npm install web-push');
  process.exit(1);
}