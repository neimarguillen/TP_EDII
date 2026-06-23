const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
  selectFile: () => ipcRenderer.invoke("select-file"),
  getDataPath: () => ipcRenderer.invoke("get-data-path"),
  clearDataPath: () => ipcRenderer.invoke("clear-data-path"),
});
