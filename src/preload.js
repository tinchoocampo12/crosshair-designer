const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('crosshairAPI', {
  sendConfig: (config) => {
    ipcRenderer.send('crosshair:update', config);
  },

  onConfigUpdate: (callback) => {
    ipcRenderer.on('crosshair:update', (_event, config) => {
      callback(config);
    });
  },
});