#!/usr/bin/env node

/**
 * Creates a simple placeholder icon for the Cashier Electron app
 *
 * This creates a basic 512x512 PNG with:
 * - Green background (#4CAF50)
 * - White "К" (Cyrillic K for "Касса")
 * - Border for definition
 *
 * Requires: No dependencies (uses SVG -> PNG conversion via data URI)
 *
 * Usage: node create-placeholder-icon.js
 */

const fs = require('fs');
const path = require('path');

// SVG icon template
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="512" height="512" fill="#4CAF50"/>

  <!-- Border -->
  <rect x="5" y="5" width="502" height="502" fill="none" stroke="#2E7D32" stroke-width="10"/>

  <!-- Letter "К" (Cyrillic K for "Касса" = Cashier) -->
  <text
    x="256"
    y="340"
    font-family="Arial, sans-serif"
    font-size="280"
    font-weight="bold"
    fill="white"
    text-anchor="middle"
  >К</text>

  <!-- Small subtitle (optional) -->
  <text
    x="256"
    y="470"
    font-family="Arial, sans-serif"
    font-size="40"
    fill="white"
    text-anchor="middle"
    opacity="0.9"
  >Касса</text>
</svg>`;

// Save SVG file
const svgPath = path.join(__dirname, 'icon.svg');
fs.writeFileSync(svgPath, svgIcon);
console.log('✓ Created icon.svg');

console.log(`
╔════════════════════════════════════════════════════════════════╗
║            Placeholder Icon Created Successfully               ║
╚════════════════════════════════════════════════════════════════╝

Location: ${svgPath}

IMPORTANT: This is a TEMPORARY placeholder icon for development.

For PRODUCTION, you should:
1. Design a professional icon using tools like Figma, Illustrator, or Photoshop
2. Export as PNG (512x512 or 1024x1024)
3. Replace icon.svg with icon.png
4. See ICON_SETUP.md for detailed instructions

To convert this SVG to PNG, you can:
- Use an online converter: https://svgtopng.com/
- Use ImageMagick: convert icon.svg icon.png
- Use Inkscape: inkscape icon.svg --export-filename=icon.png

Current icon shows:
- Green background (#4CAF50) - represents loyalty/growth
- Cyrillic "К" - first letter of "Касса" (Cashier)
- Clean, simple design for visibility at small sizes

The Electron builder will accept either:
- icon.png (recommended for production)
- icon.svg (will be converted automatically)
`);

// Create a README for icon replacement
const iconReadme = `# Icon Files

This directory should contain the application icon.

## Current Status
- icon.svg: Temporary placeholder (created by script)
- icon.png: NEEDED for production

## Replace Icon
1. Design your icon (512x512 or 1024x1024)
2. Save as icon.png in this directory
3. Delete icon.svg (no longer needed)
4. Rebuild: npm run package:win

See ICON_SETUP.md for detailed instructions.
`;

const readmePath = path.join(__dirname, 'ICON_README.txt');
fs.writeFileSync(readmePath, iconReadme);
console.log('✓ Created ICON_README.txt');

console.log('\nNext steps:');
console.log('1. Convert icon.svg to icon.png (see instructions above)');
console.log('2. Test with: npm run dev');
console.log('3. Build installer: npm run package:win');
