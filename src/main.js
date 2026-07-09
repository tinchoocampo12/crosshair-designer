const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('node:path');

if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let overlayWindow;
let lastConfig = null;

function loadRendererWindow(targetWindow, isOverlay = false) {
  const query = isOverlay ? '?overlay=1' : '';

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    targetWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}${query}`);
    return;
  }

  targetWindow.loadFile(
    path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    isOverlay
      ? {
          query: {
            overlay: '1',
          },
        }
      : undefined
  );
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 650,
    minWidth: 900,
    minHeight: 560,
    title: 'Crosshair Designer',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  loadRendererWindow(mainWindow, false);
}

function createOverlayWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();

  // Usamos bounds, NO workArea.
  // bounds = pantalla completa.
  // workArea descuenta la barra de Windows y puede dejar la mira más arriba.
  const { x, y, width, height } = primaryDisplay.bounds;

  overlayWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWindow.setIgnoreMouseEvents(true);
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');

  loadRendererWindow(overlayWindow, true);

  overlayWindow.webContents.once('did-finish-load', () => {
    if (lastConfig) {
      overlayWindow.webContents.send('crosshair:update', lastConfig);
    }
  });
}

app.whenReady().then(() => {
  createMainWindow();
  createOverlayWindow();

  ipcMain.on('crosshair:update', (_event, config) => {
    lastConfig = config;

    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('crosshair:update', config);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      createOverlayWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});