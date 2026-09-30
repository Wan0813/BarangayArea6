// Preload script: the ONLY bridge between the Electron shell and the page.
// Keep this surface tiny on purpose. The React app does not need Node APIs;
// it only needs to know it is running inside the desktop shell (for routing).

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('barangayDesktop', {
  /** Always true here; the web build never defines this object. */
  isDesktop: true,
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  onMainMessage: (callback) => ipcRenderer.on('main-process-message', (_event, ...args) => callback(...args)),
});
