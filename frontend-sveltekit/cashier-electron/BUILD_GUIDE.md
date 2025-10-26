# Build Guide for Cashier Electron App

## Overview

The cashier Electron app wraps the SvelteKit application in a desktop window. Since SvelteKit uses `adapter-node`, we have two deployment options:

## Option 1: Embedded Node Server (Recommended for Development)

Bundle the Node.js server inside Electron and run it internally.

**Pros**:
- No external dependencies
- Self-contained application
- Easy deployment

**Cons**:
- Larger bundle size
- Node.js process runs inside Electron

### Implementation

Update `electron.js` to start the SvelteKit server:

```javascript
const { spawn } = require('child_process');
const path = require('path');

let serverProcess;

function startServer() {
  const serverPath = path.join(__dirname, '..', 'build', 'index.js');
  serverProcess = spawn('node', [serverPath], {
    env: {
      ...process.env,
      PORT: 3001,
      ORIGIN: 'http://localhost:3001'
    }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });

  return new Promise((resolve) => {
    setTimeout(resolve, 2000); // Wait for server to start
  });
}

async function createWindow() {
  await startServer();

  // ... rest of window creation code
  mainWindow.loadURL('http://localhost:3001/cashier?store_id=1');
}

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
```

## Option 2: External Backend (Recommended for Production)

Point Electron to an external SvelteKit server running on the network.

**Pros**:
- Smaller Electron bundle
- Backend can be scaled independently
- Easier to update backend without redistributing desktop app
- Multiple cashier stations can share one backend

**Cons**:
- Requires network connectivity
- Backend must be deployed separately

### Implementation (Current)

The current `electron.js` already implements this approach:

```javascript
// Development: point to dev server
const devUrl = 'http://localhost:5173/cashier?store_id=1';

// Production: point to production backend
const prodUrl = 'http://backend-server:3000/cashier?store_id=1';
```

## Build Process

### Step 1: Build SvelteKit Application

```bash
cd /mnt/c/dev/loyalty_system_murzico/project-box-v3-orm/frontend-sveltekit
npm run build
```

This creates:
- `build/` directory with Node.js server
- Entry point: `build/index.js`
- Server runs on port specified by `PORT` env variable

### Step 2: Choose Deployment Strategy

#### Strategy A: Standalone Desktop App with Embedded Server

1. Copy entire SvelteKit build into Electron app:
   ```bash
   cd cashier-electron
   rm -rf build
   cp -r ../build .
   ```

2. Update `electron.js` to start server (see Option 1 above)

3. Update `package.json` build config:
   ```json
   {
     "build": {
       "files": [
         "electron.js",
         "preload.js",
         "build/**/*",
         "icon.png"
       ]
     }
   }
   ```

4. Package:
   ```bash
   npm run package:win
   ```

#### Strategy B: Thin Client (Current Implementation)

1. Don't copy build files
2. Configure backend URL in `.env`:
   ```
   BACKEND_URL=http://your-server:3000
   ```

3. Update `electron.js` to use `BACKEND_URL`:
   ```javascript
   const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
   mainWindow.loadURL(`${backendUrl}/cashier?store_id=1`);
   ```

4. Package (smaller bundle):
   ```bash
   npm run package:win
   ```

## Deployment Workflow

### For Option 1 (Embedded Server)

```bash
# Full build and package script
cd /mnt/c/dev/loyalty_system_murzico/project-box-v3-orm/frontend-sveltekit

# 1. Build SvelteKit
npm run build

# 2. Copy to Electron
cd cashier-electron
rm -rf build
cp -r ../build .

# 3. Package for Windows
npm run package:win

# Result: dist/Cashier-Loyalty-Setup-1.0.0.exe
```

### For Option 2 (Thin Client) - CURRENT

```bash
cd /mnt/c/dev/loyalty_system_murzico/project-box-v3-orm/frontend-sveltekit/cashier-electron

# 1. Install dependencies
npm install

# 2. Configure backend URL
echo "BACKEND_URL=http://your-server:3000" > .env

# 3. Package
npm run package:win

# Result: dist/Cashier-Loyalty-Setup-1.0.0.exe (smaller size)
```

## Testing Builds

### Test Embedded Server Build

```bash
cd cashier-electron
npm start

# Should see:
# - Server starting on port 3001
# - Window loading http://localhost:3001/cashier
```

### Test Thin Client Build

```bash
# Terminal 1: Start backend
cd frontend-sveltekit
npm run build
node build/index.js  # PORT=3000 by default

# Terminal 2: Start Electron
cd cashier-electron
BACKEND_URL=http://localhost:3000 npm start
```

## Recommended Production Setup

For 6 physical stores, use **Option 2 (Thin Client)**:

**Architecture**:
```
┌─────────────────────────────────────────────┐
│  Central Server (Backend)                   │
│  - SvelteKit app (port 3000)                │
│  - PostgreSQL database                      │
│  - 1C integration                           │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
   ┌────▼───┐  ┌───▼────┐  ┌──▼─────┐
   │Store 1 │  │Store 2 │  │Store 6 │
   │Electron│  │Electron│  │Electron│
   │Client  │  │Client  │  │Client  │
   └────────┘  └────────┘  └────────┘
```

**Benefits**:
1. Single source of truth (central database)
2. Easy updates (update backend, no need to redeploy desktop app)
3. Smaller desktop installer (~100MB vs ~300MB)
4. Shared 1C integration
5. Centralized logging and monitoring

**Deployment Steps**:
1. Deploy SvelteKit backend to central server
2. Configure firewall to allow port 3000
3. Install Electron app on each cashier workstation
4. Configure `BACKEND_URL=http://central-server:3000` on each
5. Set `STORE_ID=1,2,3...` per location

## Bundle Size Comparison

| Approach | Size | Contents |
|----------|------|----------|
| Thin Client | ~100MB | Electron + Chromium only |
| Embedded Server | ~300MB | Electron + Chromium + Node server + dependencies |

## Current Status

The current implementation uses **Option 2 (Thin Client)**:

- `electron.js` loads from external URL
- Development: `http://localhost:5173/cashier?store_id=1`
- Production: Configure via `BACKEND_URL` env variable

**To switch to Option 1**, modify `electron.js` as shown in the "Embedded Node Server" section above.

## Next Steps

1. Decide on deployment strategy (thin client recommended)
2. If thin client: Deploy SvelteKit backend to server
3. If embedded: Update `electron.js` to start server internally
4. Test packaging on target OS
5. Create installer and test on clean machine
6. Deploy to store locations
