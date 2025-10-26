const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

let mainWindow;

/**
 * Create the main cashier window with fixed size and position
 * Specifications:
 * - Size: 1/3 screen width × 1/3 screen height
 * - Position: Bottom-left corner
 * - Always on top: Yes
 * - Resizable: No
 * - Movable: No
 */
function createWindow() {
  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  console.log(`Screen dimensions: ${width}x${height}`);

  // Fixed window size: 550x550px
  const windowWidth = 550;
  const windowHeight = 550;

  // Calculate position (left bottom corner)
  const windowX = 0;
  const windowY = height - windowHeight;

  console.log(`Window size: ${windowWidth}x${windowHeight}`);
  console.log(`Window position: (${windowX}, ${windowY})`);

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: windowX,
    y: windowY,
    frame: true,           // Keep window frame (minimize, close buttons)
    resizable: false,      // Disable resizing
    alwaysOnTop: true,     // Always on top of other windows (including 1C)
    skipTaskbar: false,    // Show in taskbar
    movable: false,        // Prevent moving (Electron 31+)
    minimizable: true,     // Allow minimizing to taskbar
    maximizable: false,    // Disable maximize button
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: process.env.NODE_ENV === 'development'
    },
    title: 'Касса - Система лояльности',
    icon: path.join(__dirname, 'icon.svg'),
    backgroundColor: '#ffffff'
  });

  // Load the SvelteKit application
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // In development, point to SvelteKit dev server
    const devUrl = process.env.DEV_SERVER_URL || 'http://localhost:5173/cashier?store_id=1';
    console.log(`Loading dev server: ${devUrl}`);
    mainWindow.loadURL(devUrl);
  } else {
    // In production, point to backend server (thin client approach)
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const storeId = process.env.STORE_ID || '1';
    const prodUrl = `${backendUrl}/cashier?store_id=${storeId}`;
    console.log(`Loading production backend: ${prodUrl}`);
    mainWindow.loadURL(prodUrl);
  }

  // Prevent window from being moved (fallback for older Electron versions)
  mainWindow.on('move', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.setPosition(windowX, windowY);
    }
  });

  // Prevent window from being resized (additional protection)
  mainWindow.on('will-resize', (event) => {
    event.preventDefault();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Log when page is ready
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Cashier interface loaded successfully');
  });

  // Log any console messages from the renderer (helpful for debugging)
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (isDev) {
      console.log(`[Renderer] ${message}`);
    }
  });
}

// Initialize app when ready
app.whenReady().then(() => {
  console.log('Electron app ready');
  createWindow();
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Re-create window on macOS when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Log app version
app.on('ready', () => {
  console.log(`Cashier Loyalty System v${app.getVersion()}`);
});
