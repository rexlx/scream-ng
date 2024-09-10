const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});
contextBridge.exposeInMainWorld('electron', {
  openDialog: (method, config) => ipcRenderer.invoke('dialog', method, config)
});
contextBridge.exposeInMainWorld('readFile', (path) => ipcRenderer.invoke('read-file', path));
// contextBridge.exposeInMainWorld('dialog', dialog)
