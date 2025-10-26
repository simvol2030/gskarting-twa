const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script for Electron
 *
 * This script runs in a special context that has access to both
 * Node.js APIs and the browser window. It's used to safely expose
 * specific APIs to the renderer process.
 *
 * Security: contextIsolation is enabled, so we use contextBridge
 * to expose only the APIs we explicitly allow.
 */

// Expose safe APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform information
  platform: process.platform,

  // App version (if needed)
  version: process.env.npm_package_version || '1.0.0',

  // Environment
  isDev: process.env.NODE_ENV === 'development',

  // Store ID (can be configured)
  storeId: process.env.STORE_ID || '1',

  // Backend URL
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',

  // Future: Add IPC methods if needed for 1C integration
  // Example:
  // send1CData: (data) => ipcRenderer.send('1c-data', data),
  // on1CResponse: (callback) => ipcRenderer.on('1c-response', callback)
});

// Log preload script loaded (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('Preload script loaded');
  console.log('Platform:', process.platform);
  console.log('Backend URL:', process.env.BACKEND_URL || 'http://localhost:3000');
}
