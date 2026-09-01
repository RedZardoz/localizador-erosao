const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const http = require("http");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Localizador de Erosão Laminar - PPGTCA 2026",
    icon: path.join(__dirname, "../assets/icon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  const appUrl = "http://localhost:3000";

  // Check if server is running, if not wait and retry
  function loadApp() {
    http
      .get(appUrl, (res) => {
        mainWindow.loadURL(appUrl);
      })
      .on("error", () => {
        setTimeout(loadApp, 1000);
      });
  }

  loadApp();

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
