const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('node:path')

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
          nodeIntegration: false, // is default value after Electron v5
          contextIsolation: true, // protect against prototype pollution
          enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('index.html')
}


app.whenReady().then(() => {
  ipcMain.handle('dialog', (event, method, params) => {       
    return dialog[method](params);
  });
  ipcMain.handle('read-file', async (event, path) => {
    try {
      const data = await fs.promises.readFile(path, 'utf8');
      return data;
    } catch (error) {
      console.error(error);
      return error.message;
    }
  });
    
    createWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// module.exports = ESQuery;