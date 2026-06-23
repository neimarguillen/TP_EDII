const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

function configPath() {
  return path.join(app.getPath("userData"), "simor-config.json");
}

function readConfig() {
  try {
    const file = configPath();
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    }
  } catch {
    /* ignore */
  }
  return {};
}

function writeConfig(data) {
  try {
    fs.writeFileSync(configPath(), JSON.stringify(data, null, 2), "utf-8");
  } catch {
    /* ignore */
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: "#050505",
    titleBarStyle: "hiddenInset",
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

ipcMain.handle("read-file", async (_event, filePath) => {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    throw new Error(`Failed to read file: ${err.message}`);
  }
});

ipcMain.handle("select-file", async () => {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(win, {
    title: "Select Respiration Data File",
    filters: [
      { name: "Text Files", extensions: ["txt", "csv", "dat"] },
      { name: "All Files", extensions: ["*"] },
    ],
    properties: ["openFile"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const selectedPath = result.filePaths[0];
  const config = readConfig();
  config.dataPath = selectedPath;
  writeConfig(config);

  return selectedPath;
});

ipcMain.handle("get-data-path", async () => {
  const config = readConfig();
  if (config.dataPath && fs.existsSync(config.dataPath)) return config.dataPath;
  return path.join(__dirname, "..", "dist", "data", "waveform.txt");
});

ipcMain.handle("clear-data-path", async () => {
  const config = readConfig();
  delete config.dataPath;
  writeConfig(config);
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
