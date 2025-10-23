const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const Store = require('electron-store');
const path = require('path');

const store = new Store();

// Конфигурация по умолчанию
const DEFAULT_CONFIG = {
	storeId: 1,
	storeName: 'Магазин на Зеленоградской',
	apiUrl: 'https://murzicoin.murzico.ru',
	kioskMode: false, // Киоск-режим (полноэкранный без выхода)
	autoStart: true
};

// Получить конфигурацию
function getConfig() {
	return {
		storeId: store.get('storeId', DEFAULT_CONFIG.storeId),
		storeName: store.get('storeName', DEFAULT_CONFIG.storeName),
		apiUrl: store.get('apiUrl', DEFAULT_CONFIG.apiUrl),
		kioskMode: store.get('kioskMode', DEFAULT_CONFIG.kioskMode),
		autoStart: store.get('autoStart', DEFAULT_CONFIG.autoStart)
	};
}

// Сохранить конфигурацию
function saveConfig(config) {
	Object.keys(config).forEach((key) => {
		store.set(key, config[key]);
	});
}

let mainWindow = null;

function createWindow() {
	const config = getConfig();

	mainWindow = new BrowserWindow({
		width: 1280,
		height: 800,
		fullscreen: config.kioskMode,
		kiosk: config.kioskMode,
		autoHideMenuBar: true,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: false,
			contextIsolation: true
		},
		title: `Мурзико Касса - ${config.storeName}`,
		icon: path.join(__dirname, 'assets', 'icon.png')
	});

	// Убрать меню в киоск-режиме
	if (config.kioskMode) {
		Menu.setApplicationMenu(null);
	}

	// Загрузить страницу кассира с нужным store_id
	const cashierUrl = `${config.apiUrl}/cashier?store_id=${config.storeId}`;
	mainWindow.loadURL(cashierUrl);

	// Открыть DevTools в dev режиме
	if (process.env.NODE_ENV === 'development') {
		mainWindow.webContents.openDevTools();
	}

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

// Создать окно настроек
function createSettingsWindow() {
	const settingsWindow = new BrowserWindow({
		width: 600,
		height: 700,
		parent: mainWindow,
		modal: true,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: false,
			contextIsolation: true
		},
		title: 'Настройки кассы'
	});

	settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
}

// IPC обработчики
ipcMain.handle('get-config', () => {
	return getConfig();
});

ipcMain.handle('save-config', (event, config) => {
	saveConfig(config);
	return { success: true };
});

ipcMain.handle('restart-app', () => {
	app.relaunch();
	app.quit();
});

ipcMain.handle('open-settings', () => {
	createSettingsWindow();
});

// Готовность приложения
app.whenReady().then(() => {
	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

// Закрытие всех окон
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

// Аргументы командной строки для установки store_id при инсталляции
const storeIdArg = process.argv.find((arg) => arg.startsWith('--store-id='));
if (storeIdArg) {
	const storeId = parseInt(storeIdArg.split('=')[1]);
	if (!isNaN(storeId) && storeId >= 1 && storeId <= 6) {
		store.set('storeId', storeId);
		console.log(`Store ID установлен: ${storeId}`);
	}
}
