const { contextBridge, ipcRenderer } = require('electron');

// Безопасный API для рендер-процесса
contextBridge.exposeInMainWorld('electronAPI', {
	getConfig: () => ipcRenderer.invoke('get-config'),
	saveConfig: (config) => ipcRenderer.invoke('save-config', config),
	restartApp: () => ipcRenderer.invoke('restart-app'),
	openSettings: () => ipcRenderer.invoke('open-settings')
});
