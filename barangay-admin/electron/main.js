// Electron main process for the Barangay Admin desktop app.
//
// - In development (`npm run electron:dev`) it loads the Vite dev server.
// - In production (packaged .exe) it loads the built dist/index.html file.
// The React code itself is untouched; only the window shell lives here.

import { app, BrowserWindow, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built output of vite-plugin-electron (dist-electron/main.js + preload).
// In dev, VITE_DEV_SERVER_URL is set by the plugin.
const DIST = path.join(__dirname, '../dist');
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.APP_ROOT = path.join(__dirname, '..');

let window = null;

// vite-plugin-electron emits the preload bundle next to main.js, but the exact
// extension depends on the build (preload.js / preload.mjs). Resolve it here
// so the window never fails to start because of a wrong hard-coded name.
function resolvePreload() {
  for (const name of ['preload.js', 'preload.mjs', 'preload.cjs']) {
    const candidate = path.join(__dirname, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  return path.join(__dirname, 'preload.js');
}

function createWindow() {
  window = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 640,
    autoHideMenuBar: true,
    backgroundColor: '#FFF9F4',
    icon: VITE_DEV_SERVER_URL
      ? path.join(process.env.APP_ROOT, 'public/logo.png')
      : path.join(DIST, 'logo.png'),
    webPreferences: {
      preload: resolvePreload(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Running inside Electron: the renderer switches to HashRouter (see App.jsx).
  window.webContents.on('did-finish-load', () => {
    window?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  // Open external links (docs, downloads) in the system browser, not the app.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  if (VITE_DEV_SERVER_URL) {
    window.loadURL(VITE_DEV_SERVER_URL);
  } else {
    window.loadFile(path.join(DIST, 'index.html'));
  }
}

// Single instance: focus the existing window instead of opening a second one.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });

  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    window = null;
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}
