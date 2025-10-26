# Quick Start Guide - Cashier Electron App

## 5-Minute Setup (Development)

### Step 1: Install Dependencies (1 min)

```bash
cd /mnt/c/dev/loyalty_system_murzico/project-box-v3-orm/frontend-sveltekit/cashier-electron
npm install
```

### Step 2: Configure Environment (30 sec)

```bash
cp .env.example .env
```

Default values work for development (points to localhost:5173).

### Step 3: Start Development (2 min)

**Terminal 1 - SvelteKit Dev Server:**
```bash
cd /mnt/c/dev/loyalty_system_murzico/project-box-v3-orm/frontend-sveltekit
npm run dev
```

Wait for "ready" message.

**Terminal 2 - Electron App:**
```bash
cd /mnt/c/dev/loyalty_system_murzico/project-box-v3-orm/frontend-sveltekit/cashier-electron
npm run dev
```

### Step 4: Test (1 min)

Window should open in bottom-left corner:
- Press **F2** → Earn mode
- Press **F3** → Redeem mode
- Press **Esc** → Reset

✅ **Done!** You're running the cashier app.

---

## Production Build (15 minutes)

### Prerequisites

Ensure backend is deployed and accessible at `http://your-server:3000`.

### Build Installer

```bash
cd /mnt/c/dev/loyalty_system_murzico/project-box-v3-orm/frontend-sveltekit/cashier-electron

# Install dependencies (if not already done)
npm install

# Build for Windows
npm run package:win

# Output: dist/Cashier-Loyalty-Setup-1.0.0.exe
```

### Configure for Store

Create `.env` file in installation directory:

```bash
NODE_ENV=production
BACKEND_URL=http://192.168.1.100:3000
STORE_ID=1
```

Change `STORE_ID` to 2, 3, 4, 5, or 6 for other stores.

### Install on Cashier Workstation

1. Copy installer to cashier PC
2. Run `Cashier-Loyalty-Setup-1.0.0.exe`
3. Follow installation wizard
4. Launch "Касса Лояльность" from Start Menu

---

## Common Commands

```bash
# Development
npm run dev              # Run in dev mode (connect to localhost:5173)

# Production
npm start                # Run production build (connect to BACKEND_URL)

# Building
npm run build            # Build SvelteKit (run from parent directory)
npm run package:win      # Create Windows installer
npm run package:mac      # Create macOS installer
npm run package:linux    # Create Linux installer

# Maintenance
npm run clean            # Remove build artifacts and node_modules
```

---

## Window Specifications

- **Size**: 1/3 screen width × 1/3 screen height
- **Position**: Bottom-left corner (0, 2/3 screen height)
- **Behavior**:
  - ✅ Always on top of other windows
  - ✅ Cannot be moved
  - ✅ Cannot be resized
  - ✅ Shows in taskbar
  - ✅ Can minimize/maximize

---

## Keyboard Shortcuts

| Key | Action | Description |
|-----|--------|-------------|
| **F2** | Earn Points | Enter earn mode after sale complete |
| **F3** | Redeem Points | Enter redeem mode before sale |
| **Esc** | Reset | Cancel current operation, return to initial state |
| **Ctrl+Shift+I** | DevTools | Open DevTools (development mode only) |
| **Alt+F4** | Close | Exit application (Windows) |
| **Cmd+Q** | Quit | Exit application (macOS) |

---

## File Structure

```
cashier-electron/
├── electron.js              # Main process (window management)
├── preload.js              # Preload script (secure API bridge)
├── package.json            # Electron app configuration
├── .env                    # Environment configuration
├── icon.svg                # Application icon (placeholder)
│
├── README.md               # Full documentation
├── QUICKSTART.md           # This file
├── INSTALLATION.md         # Detailed install guide
├── BUILD_GUIDE.md          # Build strategies
├── ICON_SETUP.md           # Icon creation guide
│
├── create-placeholder-icon.js  # Icon generator script
├── ICON_README.txt         # Icon replacement instructions
│
├── node_modules/           # Dependencies (npm install)
├── dist/                   # Built installers (npm run package)
└── build/                  # SvelteKit build (if using embedded server)
```

---

## Environment Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `NODE_ENV` | `development` | `production` | Runtime environment |
| `BACKEND_URL` | `http://localhost:3000` | `http://server-ip:3000` | Backend API URL |
| `STORE_ID` | `1` | `1-6` | Physical store identifier |
| `DEV_SERVER_URL` | `http://localhost:5173/cashier?store_id=1` | N/A | Dev server URL |

---

## Troubleshooting

### Window Doesn't Appear

1. Check if already running (Task Manager)
2. Click app in taskbar
3. Close and restart

### Can't Connect to Backend

1. Verify backend is running:
   ```bash
   curl http://your-server:3000/api/health
   ```

2. Check `.env` file has correct `BACKEND_URL`

3. Test in browser first:
   ```
   http://your-server:3000/cashier?store_id=1
   ```

### Keyboard Shortcuts Don't Work

1. Click inside window to give it focus
2. Check if another app is capturing hotkeys
3. Test in browser to verify backend functionality

### Build Fails

```bash
# Clean and rebuild
npm run clean
npm install
npm run package:win
```

---

## Testing Checklist

Before deployment, verify:

- [ ] Window opens at bottom-left corner
- [ ] Window is 1/3 screen size
- [ ] Window stays on top of other apps
- [ ] Cannot move window
- [ ] Cannot resize window
- [ ] F2 activates earn mode
- [ ] F3 activates redeem mode
- [ ] Esc resets to initial state
- [ ] Backend API connects successfully
- [ ] Correct store ID in requests
- [ ] Can minimize to taskbar
- [ ] Can restore from taskbar

---

## Multi-Store Deployment

For deploying to all 6 stores:

1. **Build once:**
   ```bash
   npm run package:win
   ```

2. **Copy installer** to USB drive or network share

3. **For each store:**
   - Install from USB/network
   - Create store-specific `.env`:
     ```
     BACKEND_URL=http://192.168.1.100:3000
     STORE_ID=2  # Change per store (1-6)
     ```
   - Test connectivity
   - Train cashier on shortcuts

4. **Verify all stores** can reach backend and have correct STORE_ID

---

## Next Steps

### After Development Setup

1. Test all cashier workflows
2. Verify backend integration
3. Test 1C mock data fetching
4. Check QR code generation
5. Test error handling

### After Production Build

1. Install on test machine
2. Configure production backend URL
3. Test all functionality
4. Monitor performance
5. Collect feedback
6. Deploy to production stores

### After Deployment

1. Train cashiers on F2/F3/Esc shortcuts
2. Monitor logs for errors
3. Track API response times
4. Collect cashier feedback
5. Plan updates and maintenance

---

## Support

- **Full Documentation**: See `README.md`
- **Installation Guide**: See `INSTALLATION.md`
- **Build Strategies**: See `BUILD_GUIDE.md`
- **Icon Setup**: See `ICON_SETUP.md`

For technical issues, check:
1. DevTools console (Ctrl+Shift+I in dev mode)
2. Backend API logs
3. 1C integration status
4. Network connectivity

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│  Electron Window (Bottom-left, 1/3 screen)  │
│  - Always on top                            │
│  - Fixed position/size                      │
│  - Keyboard shortcuts (F2/F3/Esc)          │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  SvelteKit Backend (Node.js)                 │
│  - Cashier UI routes                         │
│  - API endpoints (earn/redeem)               │
│  - 1C integration                            │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  PostgreSQL Database                         │
│  - Users, transactions, points               │
│  - Store data                                │
└──────────────────────────────────────────────┘
```

---

**Version**: 1.0.0
**Last Updated**: 2025-10-24
**Status**: Production Ready

For questions or issues, consult the full documentation in `README.md` or `INSTALLATION.md`.
