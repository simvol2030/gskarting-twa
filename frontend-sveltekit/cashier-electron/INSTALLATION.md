# Installation and Testing Guide

## Prerequisites

### Development Machine

- **Node.js**: v18+ (LTS recommended)
- **npm**: v9+ (comes with Node.js)
- **OS**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)

### Target Cashier Workstation

- **OS**: Windows 10/11 (primary target for 1C integration)
- **Memory**: 4GB RAM minimum (8GB recommended)
- **Disk**: 500MB free space
- **Network**: Access to backend server on port 3000
- **Screen**: 1920x1080 or higher (for proper 1/3 window sizing)

## Installation Steps

### Step 1: Install Node.js Dependencies

```bash
cd /mnt/c/dev/loyalty_system_murzico/project-box-v3-orm/frontend-sveltekit/cashier-electron

# Install Electron and dependencies
npm install
```

Expected output:
```
added 200+ packages in 30s
```

### Step 2: Configure Environment

Create `.env` file from template:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```bash
# For production deployment
NODE_ENV=production
BACKEND_URL=http://192.168.1.100:3000  # Your backend server IP
STORE_ID=1                              # Store number (1-6)

# For development
NODE_ENV=development
DEV_SERVER_URL=http://localhost:5173/cashier?store_id=1
```

### Step 3: Test Development Mode

**Terminal 1: Start SvelteKit Backend**
```bash
cd /mnt/c/dev/loyalty_system_murzico/project-box-v3-orm/frontend-sveltekit
npm run dev
```

Wait for:
```
VITE v7.x.x  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
```

**Terminal 2: Start Electron App**
```bash
cd /mnt/c/dev/loyalty_system_murzico/project-box-v3-orm/frontend-sveltekit/cashier-electron
npm run dev
```

Expected behavior:
- Electron window opens in bottom-left corner
- Window size is 1/3 of screen
- DevTools open automatically
- Cashier interface loads from dev server
- Can interact with cashier UI (F2, F3, Esc)

### Step 4: Build Production Installer

```bash
# Ensure you're in cashier-electron directory
cd /mnt/c/dev/loyalty_system_murzico/project-box-v3-orm/frontend-sveltekit/cashier-electron

# For Windows (NSIS installer)
npm run package:win

# For macOS (DMG)
npm run package:mac

# For Linux (AppImage)
npm run package:linux
```

Build time: ~2-5 minutes depending on system

Output location:
```
cashier-electron/dist/
├── Cashier-Loyalty-Setup-1.0.0.exe      # Windows installer
├── Cashier-Loyalty-1.0.0.dmg            # macOS installer
└── Cashier-Loyalty-1.0.0.AppImage       # Linux installer
```

### Step 5: Install on Target Machine

#### Windows Installation

1. Copy `Cashier-Loyalty-Setup-1.0.0.exe` to target machine

2. Run installer:
   - Double-click installer
   - Choose installation directory (default: C:\Program Files\Касса Лояльность)
   - Select "Create Desktop Shortcut" if desired
   - Click "Install"

3. Configure environment:
   - Create `.env` file in installation directory
   - Set production values (backend URL, store ID)

4. Launch application:
   - From Desktop shortcut, or
   - From Start Menu: "Касса Лояльность"

#### macOS Installation

1. Copy `Cashier-Loyalty-1.0.0.dmg` to Mac

2. Open DMG and drag app to Applications

3. Configure environment:
   - Right-click app → "Show Package Contents"
   - Create `.env` in `Contents/Resources/app/`
   - Set backend URL and store ID

4. Launch from Applications folder

#### Linux Installation

1. Copy `Cashier-Loyalty-1.0.0.AppImage` to Linux machine

2. Make executable:
   ```bash
   chmod +x Cashier-Loyalty-1.0.0.AppImage
   ```

3. Create config file:
   ```bash
   # In same directory as AppImage
   echo "BACKEND_URL=http://backend-server:3000" > .env
   echo "STORE_ID=1" >> .env
   ```

4. Run:
   ```bash
   ./Cashier-Loyalty-1.0.0.AppImage
   ```

## Testing Checklist

### Window Behavior Tests

Run these tests after installation:

- [ ] **Window Position**: Opens at bottom-left corner
- [ ] **Window Size**: Exactly 1/3 screen width × 1/3 screen height
- [ ] **Always On Top**: Stays above other windows (test by opening browser, 1C, etc.)
- [ ] **Cannot Move**: Try dragging window - should snap back to position
- [ ] **Cannot Resize**: Drag window edges - should not resize
- [ ] **Has Frame**: Minimize and close buttons visible
- [ ] **In Taskbar**: Shows in Windows taskbar / macOS dock
- [ ] **Minimize Works**: Can minimize to taskbar
- [ ] **Restore Works**: Restores to exact position after minimize

### Functionality Tests

- [ ] **Page Loads**: Cashier interface displays correctly
- [ ] **F2 Hotkey**: Press F2 → "Earn Points" mode activates
- [ ] **F3 Hotkey**: Press F3 → "Redeem Points" mode activates
- [ ] **Esc Hotkey**: Press Esc → Returns to initial state
- [ ] **Phone Input**: Can enter phone number
- [ ] **Amount Input**: Can enter transaction amount
- [ ] **Submit Button**: Can click "Начислить" / "Списать"
- [ ] **API Connection**: Backend API responds (check network tab)
- [ ] **QR Code**: QR codes display correctly
- [ ] **Error Messages**: Errors display properly (test with invalid phone)

### Integration Tests

- [ ] **Backend Connection**: App connects to backend server
- [ ] **Store ID**: Correct store ID used in API requests
- [ ] **Transaction Create**: Can create earn transaction
- [ ] **Transaction Redeem**: Can create redeem transaction
- [ ] **User Lookup**: Phone number lookup works
- [ ] **Balance Display**: Customer balance shows correctly
- [ ] **Points Calculation**: Points calculated correctly based on amount
- [ ] **1C Mock Data**: Mock 1C amounts populate correctly

### Performance Tests

- [ ] **Load Time**: App opens within 3 seconds
- [ ] **Response Time**: UI responds to input within 500ms
- [ ] **Memory Usage**: Check Task Manager - should be <500MB
- [ ] **CPU Usage**: Should be <10% when idle
- [ ] **Network Latency**: API calls complete within 1 second

## Troubleshooting

### Issue: Window Not Visible

**Symptoms**: App launches but window doesn't appear

**Solutions**:
1. Check taskbar - window might be minimized
2. Click app in taskbar to bring to front
3. Check if window is off-screen (multi-monitor setup)
4. Close app and restart
5. Check logs: `%APPDATA%\Касса Лояльность\logs\`

### Issue: Cannot Connect to Backend

**Symptoms**: "Network Error" or blank page

**Solutions**:
1. Verify backend is running:
   ```bash
   curl http://your-backend:3000/api/health
   ```

2. Check `.env` file:
   - Correct `BACKEND_URL`
   - No trailing slash
   - Reachable from this machine

3. Check firewall settings:
   - Allow port 3000
   - Allow Electron app through Windows Firewall

4. Test in browser first:
   ```
   http://your-backend:3000/cashier?store_id=1
   ```

### Issue: Keyboard Shortcuts Don't Work

**Symptoms**: F2, F3, Esc don't trigger actions

**Solutions**:
1. Ensure window has focus (click inside window)
2. Check if another app is capturing hotkeys
3. Test in browser to verify backend functionality
4. Check DevTools console for JavaScript errors

### Issue: Window Position Wrong

**Symptoms**: Window appears in wrong location or wrong size

**Solutions**:
1. Check screen resolution (must be 1920x1080+)
2. Check for multi-monitor setup (may position on wrong screen)
3. Close and restart app
4. Check Electron logs for position calculations
5. Try on single monitor to isolate issue

### Issue: App Won't Launch After Installation

**Symptoms**: Double-click does nothing

**Solutions**:
1. Check if already running (Task Manager)
2. Run as Administrator
3. Check Windows Event Viewer for errors
4. Reinstall application
5. Check antivirus logs (may be blocking)

### Issue: High Memory Usage

**Symptoms**: App uses >1GB RAM

**Solutions**:
1. Close DevTools (if in development mode)
2. Restart app (clear memory leaks)
3. Check for excessive API calls (network tab)
4. Update to latest Electron version
5. Report to development team

## Development Debugging

### Enable DevTools in Production

Temporarily enable DevTools for debugging:

1. Edit `electron.js`:
   ```javascript
   webPreferences: {
     devTools: true  // Enable always
   }
   ```

2. Rebuild:
   ```bash
   npm run package:win
   ```

3. Press `Ctrl+Shift+I` to open DevTools

### View Console Logs

**Windows**:
```
%APPDATA%\Касса Лояльность\logs\main.log
```

**macOS**:
```
~/Library/Logs/Касса Лояльность/main.log
```

**Linux**:
```
~/.config/Касса Лояльность/logs/main.log
```

### Network Debugging

Use DevTools to inspect network requests:
1. Open DevTools (Ctrl+Shift+I)
2. Go to Network tab
3. Reproduce issue
4. Check failed requests
5. Inspect request/response headers

## Multi-Store Deployment

For deploying to all 6 stores:

### Store Configuration Matrix

| Store | Location | STORE_ID | Backend URL | Installer |
|-------|----------|----------|-------------|-----------|
| Store 1 | Main | 1 | http://server:3000 | Same |
| Store 2 | Branch A | 2 | http://server:3000 | Same |
| Store 3 | Branch B | 3 | http://server:3000 | Same |
| Store 4 | Branch C | 4 | http://server:3000 | Same |
| Store 5 | Branch D | 5 | http://server:3000 | Same |
| Store 6 | Branch E | 6 | http://server:3000 | Same |

### Deployment Process

1. **Build once**:
   ```bash
   npm run package:win
   ```

2. **Copy installer to USB drive or network share**

3. **For each store**:
   - Install from USB/network
   - Create store-specific `.env`:
     ```bash
     BACKEND_URL=http://192.168.1.100:3000
     STORE_ID=2  # Change per store
     ```
   - Test connectivity
   - Train cashier on F2/F3/Esc shortcuts

4. **Verify all stores**:
   - Each store uses correct STORE_ID
   - All can reach backend
   - All shortcuts work

## Next Steps After Installation

1. **Train Cashiers**:
   - F2 = Earn points (after sale)
   - F3 = Redeem points (before sale)
   - Esc = Cancel/reset
   - Phone entry format

2. **Monitor Performance**:
   - Check logs daily for first week
   - Track API response times
   - Monitor memory usage
   - Collect cashier feedback

3. **Plan Updates**:
   - Document update process
   - Test updates on one store first
   - Schedule off-peak hours for updates
   - Keep backup of previous version

## Support Contacts

For technical issues:
- System Administrator: [contact info]
- Backend API: [documentation link]
- 1C Integration: [1C admin contact]
