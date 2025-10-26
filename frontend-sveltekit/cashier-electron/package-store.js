#!/usr/bin/env node

/**
 * Package Electron app for a specific store
 *
 * Usage: npm run package:store1
 *        npm run package:store2
 *        etc.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get store ID and name from command line arguments
const storeId = process.argv[2];
const storeName = process.argv[3];

if (!storeId || !storeName) {
  console.error('Usage: node package-store.js <storeId> <storeName>');
  console.error('Example: node package-store.js 1 Алмаз');
  process.exit(1);
}

console.log(`\n📦 Packaging for Store ${storeId}: ${storeName}...\n`);

// Load store configuration
const configPath = path.join(__dirname, 'stores-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const store = config.stores.find(s => s.id === parseInt(storeId));

if (!store) {
  console.error(`❌ Store ${storeId} not found in configuration!`);
  process.exit(1);
}

// Copy store-specific .env file
const envSourcePath = path.join(__dirname, 'configs', `.env.store${storeId}`);
const envDestPath = path.join(__dirname, '.env');

if (fs.existsSync(envSourcePath)) {
  fs.copyFileSync(envSourcePath, envDestPath);
  console.log(`✅ Copied configuration: .env.store${storeId} → .env`);
} else {
  console.warn(`⚠️  Configuration file not found: ${envSourcePath}`);
  console.warn('   Run: npm run config:generate first\n');
  process.exit(1);
}

// Update electron-builder config for store-specific naming
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Backup original config
const originalProductName = packageJson.build.productName;
const originalArtifactName = packageJson.build.nsis.artifactName;

// Update with store-specific name
packageJson.build.productName = `Касса ${storeName}`;
packageJson.build.nsis.artifactName = `Cashier-${storeName}-Store${storeId}-Setup-\${version}.\${ext}`;
packageJson.build.nsis.shortcutName = `Касса ${storeName}`;

// Write temp package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');

try {
  console.log(`\n🏗️  Building with electron-builder...`);
  console.log(`   Product: ${packageJson.build.productName}`);
  console.log(`   Output: ${packageJson.build.nsis.artifactName}\n`);

  // Run electron-builder
  execSync('electron-builder --win', {
    cwd: __dirname,
    stdio: 'inherit'
  });

  console.log(`\n✅ Successfully packaged for Store ${storeId}: ${storeName}`);
  console.log(`   Check dist/ folder for installer\n`);

} catch (error) {
  console.error(`\n❌ Packaging failed for Store ${storeId}:`, error.message);
  process.exit(1);

} finally {
  // Restore original package.json
  packageJson.build.productName = originalProductName;
  packageJson.build.nsis.artifactName = originalArtifactName;
  packageJson.build.nsis.shortcutName = originalProductName;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');

  console.log('🔄 Restored original package.json');
}
