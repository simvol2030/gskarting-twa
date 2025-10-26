# Cashier Desktop App - Loyalty System

Electron-based desktop cashier interface for loyalty program. This application provides a fixed-position, always-on-top window for cashiers to manage customer loyalty points alongside their 1C terminal.

## Features

- **Fixed Window Position**: Bottom-left corner, 1/3 screen size
- **Always On Top**: Stays above 1C terminal and other applications
- **Keyboard Shortcuts**: F2 (earn), F3 (redeem), Esc (reset)
- **Auto-fetch Transactions**: Retrieves amounts from 1C integration
- **Real-time Point Management**: Instant earn/redeem operations
- **QR Code Support**: Scan customer loyalty cards

## System Requirements

- **OS**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 20.04+)
- **Memory**: 512MB RAM minimum
- **Disk**: 200MB free space
- **Network**: Local network access to backend API and 1C server

## Installation

### From Installer (Production)

1. Download the latest installer from the releases page:
   - Windows: `Cashier-Loyalty-Setup-1.0.0.exe`
   - macOS: `Cashier-Loyalty-1.0.0.dmg`
   - Linux: `Cashier-Loyalty-1.0.0.AppImage`

2. Run the installer and follow on-screen instructions

3. Launch "Касса Лояльность" from Start Menu / Applications

4. The window will automatically position itself in the bottom-left corner

### From Source (Development)

```bash
# Install dependencies
npm install

# Run in development mode (connects to SvelteKit dev server)
npm run dev

# Build for production
npm run build

# Package for distribution
npm run package:win    # Windows
npm run package:mac    # macOS
npm run package:linux  # Linux
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Backend API URL
BACKEND_URL=http://localhost:3000

# 1C Integration URL
ONEC_BASE_URL=http://1c-server:80

# Store ID (1-6 for physical stores)
STORE_ID=1
```

### Store-Specific Setup

Each physical store needs its own configuration:

```bash
# Store 1 (Main Location)
STORE_ID=1

# Store 2 (Branch)
STORE_ID=2

# ... etc
```

## Development

### Project Structure

```
cashier-electron/
├── electron.js           # Main process (window management)
├── preload.js           # Preload script (secure API exposure)
├── package.json         # Electron app configuration
├── .env.example         # Environment template
├── README.md            # This file
├── icon.png             # App icon
├── build/               # SvelteKit production build (generated)
└── dist/                # Packaged distributables (generated)
```

### Development Workflow

**Terminal 1: SvelteKit Dev Server**
```bash
cd ..
npm run dev  # Runs on http://localhost:5173
```

**Terminal 2: Electron App**
```bash
cd cashier-electron
npm run dev  # Opens Electron window pointing to dev server
```

This setup enables:
- Hot reload for UI changes
- DevTools for debugging
- Fast iteration cycle

### Building for Production

```bash
# 1. Build SvelteKit app with static adapter
cd ..
npm run build

# 2. Copy build to Electron directory
cd cashier-electron
npm run copy:build

# 3. Test production build locally
npm start

# 4. Package for distribution
npm run package:win  # Creates installer in dist/
```

## Window Specifications

The window behavior is critical for cashier workflow:

- **Size**: Exactly 1/3 of screen width × 1/3 of screen height
- **Position**: Fixed at (0, 2/3 screen height) - bottom-left corner
- **Movable**: No - window cannot be dragged
- **Resizable**: No - fixed size
- **Always On Top**: Yes - stays above 1C and other apps
- **Frame**: Yes - minimize and close buttons available
- **Taskbar**: Yes - shows in taskbar for easy access

### Why These Constraints?

1. **Fixed Position**: Ensures consistent placement alongside 1C terminal
2. **Fixed Size**: Prevents accidental window size changes during busy periods
3. **Always On Top**: Cashiers can see loyalty app while working in 1C
4. **Not Movable**: Prevents workflow disruption from accidental drags

## Keyboard Shortcuts

- **F2**: Enter "Earn Points" mode
- **F3**: Enter "Redeem Points" mode
- **Esc**: Reset to initial state
- **Alt+F4**: Close application (Windows)
- **Cmd+Q**: Quit application (macOS)

## Troubleshooting

### Window Not Visible

Check if window is behind other applications:
1. Click on "Касса Лояльность" in taskbar
2. Window should come to front (always on top)

### Cannot Connect to Backend

Verify backend API is running:
```bash
curl http://localhost:3000/api/health
```

Check `BACKEND_URL` in `.env` matches your setup.

### 1C Integration Not Working

1. Verify 1C server is accessible:
   ```bash
   curl http://1c-server/health
   ```

2. Check `ONEC_BASE_URL` in `.env`

3. Review 1C integration logs in backend

### DevTools Not Opening (Development)

Ensure `NODE_ENV=development` is set when running `npm run dev`.

## Production Deployment

### Pre-deployment Checklist

- [ ] Update version in `package.json`
- [ ] Build SvelteKit app (`cd .. && npm run build`)
- [ ] Test production build locally (`npm start`)
- [ ] Configure store-specific `.env` files
- [ ] Test on target OS (Windows/Mac/Linux)
- [ ] Verify backend connectivity
- [ ] Test 1C integration
- [ ] Verify keyboard shortcuts work
- [ ] Check window positioning on different screen sizes

### Deployment Steps

1. **Build Installer**:
   ```bash
   npm run package:win
   ```

2. **Test Installer**:
   - Install on clean test machine
   - Verify auto-start behavior
   - Test all functionality

3. **Distribute to Stores**:
   - Copy installer to USB drives or network share
   - Install on each cashier workstation
   - Configure `STORE_ID` for each location
   - Test connectivity to backend and 1C

4. **Post-deployment**:
   - Monitor logs for errors
   - Collect cashier feedback
   - Document any issues

## Security Considerations

- **No Passwords Stored**: Uses backend authentication
- **HTTPS Required**: Production backend should use HTTPS
- **Context Isolation**: Electron security enabled via preload script
- **No Node Integration**: Renderer process has no direct Node.js access
- **CSP Headers**: Content Security Policy enforced by SvelteKit

## Support

For issues or questions:
1. Check logs in DevTools (development)
2. Review backend API logs
3. Verify 1C integration status
4. Contact system administrator

## License

Proprietary - My App Butik

## Version History

### 1.0.0 (2025-10-24)
- Initial release
- Fixed window positioning and size
- F2/F3/Esc keyboard shortcuts
- 1C integration support
- QR code scanning
- Real-time point management
