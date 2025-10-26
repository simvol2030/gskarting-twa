# Icon Setup for Cashier Electron App

## Current Status

The Electron app is configured to use `icon.png` as the application icon. However, a production-ready icon has not been created yet.

## Requirements

- **Format**: PNG with transparency
- **Size**: 512x512 pixels minimum
- **Recommended**: 1024x1024 for best quality across all platforms
- **Color Depth**: 32-bit RGBA

## Creating the Icon

### Option 1: Using Design Software

Use tools like:
- Adobe Illustrator / Photoshop
- Figma
- Inkscape (free)
- GIMP (free)

**Design Guidelines**:
- Simple, recognizable design
- High contrast for visibility at small sizes
- Include loyalty/cashier theme (QR code, cards, coins)
- Use brand colors
- Test at multiple sizes (16x16, 32x32, 64x64, 128x128, 256x256)

### Option 2: Using Icon Generator

Online services:
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/
- https://icon.kitchen/

Upload a logo/image and generate multi-size icons.

### Option 3: Temporary Placeholder

For development/testing, you can use a simple colored square:

**Using ImageMagick**:
```bash
convert -size 512x512 xc:#4CAF50 \
  -font Arial -pointsize 200 -fill white \
  -gravity center -annotate +0+0 "К" \
  icon.png
```

**Using Node.js (with canvas)**:
```bash
npm install canvas
node create-icon.js
```

```javascript
// create-icon.js
const { createCanvas } = require('canvas');
const fs = require('fs');

const size = 512;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#4CAF50';
ctx.fillRect(0, 0, size, size);

// Border
ctx.strokeStyle = '#2E7D32';
ctx.lineWidth = 10;
ctx.strokeRect(5, 5, size - 10, size - 10);

// Text
ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 200px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('К', size / 2, size / 2);

// Save
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('icon.png', buffer);
console.log('Icon created: icon.png');
```

## Platform-Specific Formats

### Windows (.ico)

Electron Builder automatically converts PNG to ICO format. The PNG should contain multiple resolutions:

- 16x16
- 32x32
- 48x48
- 64x64
- 128x128
- 256x256

**Convert PNG to multi-size ICO**:
```bash
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### macOS (.icns)

Electron Builder automatically generates ICNS from PNG for macOS builds.

### Linux

PNG format is sufficient for Linux distributions.

## Current Configuration

In `package.json`, the icon is referenced as:

```json
{
  "build": {
    "win": {
      "icon": "icon.png"
    },
    "mac": {
      "icon": "icon.png"
    },
    "linux": {
      "icon": "icon.png"
    }
  }
}
```

Electron Builder will automatically convert this PNG to the appropriate format for each platform.

## Testing the Icon

After creating `icon.png`:

1. **Development**: Icon appears in window title bar and taskbar
   ```bash
   npm run dev
   ```

2. **Production Build**: Icon appears in installer and installed application
   ```bash
   npm run package:win
   ```

3. **Check in Installer**: The generated installer in `dist/` should show your icon

## Recommended Next Steps

1. Create a professional icon using design software
2. Save as `icon.png` (512x512 or 1024x1024)
3. Place in `cashier-electron/` directory
4. Test in development mode
5. Build installer and verify icon appears correctly
6. If needed, create platform-specific icons (.ico, .icns) for better quality

## Brand Guidelines

If your loyalty system has existing branding:
- Use official brand colors
- Include recognizable brand elements
- Ensure icon matches overall brand identity
- Get approval from marketing/design team before production deployment

## Resources

- [Electron Icon Documentation](https://www.electron.build/icons)
- [Icon Design Best Practices](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Windows Icon Guidelines](https://learn.microsoft.com/en-us/windows/apps/design/style/iconography/app-icon-design)
