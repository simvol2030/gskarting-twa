#!/usr/bin/env node

/**
 * Generate .env files for each store
 *
 * Usage: node generate-store-configs.js [store_id]
 *
 * Examples:
 *   node generate-store-configs.js        # Generate all 6 configs
 *   node generate-store-configs.js 1      # Generate only store 1 config
 */

const fs = require('fs');
const path = require('path');

// Load stores configuration
const configPath = path.join(__dirname, 'stores-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Check if specific store ID was provided
const targetStoreId = process.argv[2] ? parseInt(process.argv[2]) : null;

// Validate store ID if provided
if (targetStoreId && (targetStoreId < 1 || targetStoreId > 6)) {
  console.error('❌ Invalid store ID. Must be between 1 and 6.');
  process.exit(1);
}

// Create configs directory if it doesn't exist
const configsDir = path.join(__dirname, 'configs');
if (!fs.existsSync(configsDir)) {
  fs.mkdirSync(configsDir, { recursive: true });
}

// Filter stores if specific ID was provided
const storesToProcess = targetStoreId
  ? config.stores.filter(s => s.id === targetStoreId)
  : config.stores;

console.log(`\n🏪 Generating configurations for ${storesToProcess.length} store(s)...\n`);

storesToProcess.forEach(store => {
  // Generate .env content
  const envContent = `# Store Configuration: ${store.name}
# Address: ${store.address}, ${store.city}
# Terminal: ${store.terminalId}

# Store Identification
STORE_ID=${store.id}
STORE_NAME=${store.name}
STORE_ADDRESS=${store.address}
STORE_CITY=${store.city}
TERMINAL_ID=${store.terminalId}

# Backend API
BACKEND_URL=${config.backend.url}
BACKEND_FALLBACK_URL=${config.backend.fallbackUrl}

# 1C Integration
ONEC_BASE_URL=${store.onecUrl}
ONEC_USERNAME=${config.onec.username}
ONEC_PASSWORD=  # Set this manually for security
ONEC_TIMEOUT=${config.onec.timeout}
ONEC_MOCK=${config.onec.mockMode}

# Environment
NODE_ENV=production

# Optional: Override 1C URL for this specific store
# STORE_${store.id}_ONEC_URL=${store.onecUrl}
`;

  // Write to configs directory
  const envFilePath = path.join(configsDir, `.env.store${store.id}`);
  fs.writeFileSync(envFilePath, envContent, 'utf8');

  console.log(`✅ ${store.name} (Store ${store.id})`);
  console.log(`   File: configs/.env.store${store.id}`);
  console.log(`   Terminal: ${store.terminalId}`);
  console.log(`   1C URL: ${store.onecUrl}`);
  console.log('');
});

// Also generate a master .env.example
const exampleEnvContent = `# Master .env.example - Copy to .env and configure
# For specific store, copy from configs/.env.storeN

# Store Identification
STORE_ID=1
STORE_NAME=Алмаз
STORE_ADDRESS=ул. Советская, 15
STORE_CITY=Москва
TERMINAL_ID=TERM_ALMAS_001

# Backend API
BACKEND_URL=http://192.168.0.100:3000
BACKEND_FALLBACK_URL=http://localhost:3000

# 1C Integration
ONEC_BASE_URL=http://192.168.1.10:8080
ONEC_USERNAME=cashier_api
ONEC_PASSWORD=  # Set this manually for security
ONEC_TIMEOUT=3000
ONEC_MOCK=false

# Environment
NODE_ENV=production
`;

fs.writeFileSync(path.join(__dirname, '.env.example'), exampleEnvContent, 'utf8');
console.log('✅ Master .env.example generated\n');

// Generate deployment guide
const deploymentGuide = `# Deployment Guide for 6 Stores

## Generated Configurations

${config.stores.map(store => `### Store ${store.id}: ${store.name}
- **Location**: ${store.address}, ${store.city}
- **Terminal**: ${store.terminalId}
- **Config**: \`configs/.env.store${store.id}\`
- **1C Server**: ${store.onecUrl}
`).join('\n')}

## Deployment Steps

### Option 1: Manual Configuration (Recommended)

For each store:

1. **Install Electron App**:
   \`\`\`bash
   # Run installer on cashier workstation
   ./Cashier-Loyalty-Setup-1.0.0.exe
   \`\`\`

2. **Configure Store**:
   \`\`\`bash
   # Copy appropriate config
   cd "C:\\Program Files\\Cashier Loyalty"
   copy configs\\.env.store${config.stores[0].id} .env

   # Edit .env and set ONEC_PASSWORD
   notepad .env
   \`\`\`

3. **Test**:
   - Launch app
   - Verify window position (bottom-left)
   - Test QR scan
   - Test F2 (earn) and F3 (redeem)

### Option 2: Automated Deployment Script

Create \`deploy-to-store.bat\`:

\`\`\`batch
@echo off
SET STORE_ID=%1

IF "%STORE_ID%"=="" (
    echo Usage: deploy-to-store.bat [store_id]
    echo Example: deploy-to-store.bat 1
    exit /b 1
)

echo Deploying to Store %STORE_ID%...
copy configs\\.env.store%STORE_ID% .env
echo Configuration deployed!
echo Please edit .env and set ONEC_PASSWORD before starting the app.
pause
\`\`\`

**Usage**:
\`\`\`bash
deploy-to-store.bat 1  # For Store 1: Алмаз
deploy-to-store.bat 2  # For Store 2: Изумруд
# etc.
\`\`\`

## Pre-Deployment Checklist

- [ ] Backend server deployed and accessible at ${config.backend.url}
- [ ] Database populated with store and customer data
- [ ] 1C OData API accessible from each store location
- [ ] ONEC_PASSWORD set for each store
- [ ] Network connectivity tested
- [ ] Firewall rules configured
- [ ] Icon updated (if using custom branding)

## Security Notes

⚠️ **IMPORTANT**: Never commit .env files with passwords to version control!

- Passwords should be set manually on each workstation
- Use different passwords per store if possible
- Rotate passwords regularly
- Monitor access logs

## Testing Matrix

| Store | Config | Backend | 1C | QR Scan | Earn | Redeem |
|-------|--------|---------|----|---------| -----|--------|
${config.stores.map(store => `| ${store.id}. ${store.name} | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |`).join('\n')}

## Support

For issues, check:
1. \`logs/\` directory for error messages
2. Network connectivity to backend and 1C
3. .env configuration correctness
4. Windows Event Viewer for system errors
`;

fs.writeFileSync(path.join(configsDir, 'DEPLOYMENT_GUIDE.md'), deploymentGuide, 'utf8');
console.log('✅ Deployment guide: configs/DEPLOYMENT_GUIDE.md\n');

console.log('✨ Configuration generation complete!');
console.log('\n📋 Next steps:');
console.log('   1. Review configs/.env.store* files');
console.log('   2. Set ONEC_PASSWORD in each config');
console.log('   3. Copy appropriate config to .env before packaging');
console.log('   4. Build installers: npm run package:all-stores\n');
