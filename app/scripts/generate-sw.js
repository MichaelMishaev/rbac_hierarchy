#!/usr/bin/env node
/**
 * Service Worker Generation Script
 *
 * Generates public/sw.js from public/sw.template.js by injecting
 * the Service Worker version from version.json
 *
 * This ensures SW version is centralized (no hardcoding)
 * and synchronized with app version tracking.
 *
 * Usage:
 *   node scripts/generate-sw.js
 *
 * Runs automatically before builds via prebuild/predev npm scripts
 */

const fs = require('fs');
const path = require('path');

function generateServiceWorker() {
  try {
    console.log('[generate-sw] Starting Service Worker generation...');

    // Read version.json
    const versionPath = path.join(__dirname, '../version.json');
    if (!fs.existsSync(versionPath)) {
      console.error('[generate-sw] ❌ ERROR: version.json not found!');
      process.exit(1);
    }

    const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    const swVersion = versionData.serviceWorkerVersion;

    if (!swVersion) {
      console.error('[generate-sw] ❌ ERROR: serviceWorkerVersion not found in version.json!');
      console.error('[generate-sw] Please add "serviceWorkerVersion": "2.1.6" to version.json');
      process.exit(1);
    }

    console.log(`[generate-sw] 📦 SW Version from version.json: ${swVersion}`);

    // Read SW template
    const swTemplatePath = path.join(__dirname, '../public/sw.template.js');
    if (!fs.existsSync(swTemplatePath)) {
      console.error('[generate-sw] ❌ ERROR: sw.template.js not found!');
      console.error('[generate-sw] Did you rename public/sw.js to public/sw.template.js?');
      process.exit(1);
    }

    const swTemplate = fs.readFileSync(swTemplatePath, 'utf8');

    // Inject version from version.json
    // Matches: const SW_VERSION = '2.1.6'; or const SW_VERSION = "2.1.6";
    const versionRegex = /const SW_VERSION = ['"].*?['"];/;
    if (!versionRegex.test(swTemplate)) {
      console.error('[generate-sw] ❌ ERROR: SW_VERSION constant not found in template!');
      console.error('[generate-sw] Template must contain: const SW_VERSION = \'x.x.x\';');
      process.exit(1);
    }

    const swContent = swTemplate.replace(
      versionRegex,
      `const SW_VERSION = '${swVersion}';`
    );

    // Write final sw.js
    const swOutputPath = path.join(__dirname, '../public/sw.js');
    fs.writeFileSync(swOutputPath, swContent, 'utf8');

    console.log(`[generate-sw] ✅ Generated sw.js with version ${swVersion}`);
    console.log(`[generate-sw] 📄 Output: ${swOutputPath}`);
    console.log('[generate-sw] Done!');

  } catch (error) {
    console.error('[generate-sw] ❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run generation
generateServiceWorker();
