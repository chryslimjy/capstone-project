// import axios from 'axios';

const { app, BrowserWindow, ipcMain } = require('electron');

//const axios = require('axios');

let mainWindow;
let browserView;

function createWindow() {
  // Create the main browser window
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools();

  // Create a BrowserView
  browserView = new BrowserWindow({ webPreferences: { nodeIntegration: false } });
  mainWindow.setBrowserView(browserView);
  browserView.setBounds({ x: 0, y: 0, width: 800, height: 600 });

  // Load the YouTube URL in the BrowserView
  browserView.webContents.loadURL('https://www.google.com');

  // Listen for the 'open-chrome' message from the renderer process
  ipcMain.on('open-chrome', () => {
    browserView.webContents.loadURL('https://www.youtube.com');
  });




  // Listen for the 'execute-command' message from the renderer process
  ipcMain.on('execute-command-click', () => {
    // Execute the command in the current browser window (YouTube)
    browserView.webContents.executeJavaScript(

        `
      var allLinks = document.getElementsByTagName("a");

      // Iterate through the anchor elements
      for (var i = 0; i < allLinks.length; i++) {
        var currentLink = allLinks[i];

        // Highlight the anchor tag (you can modify this part as needed)
        currentLink.style.backgroundColor = "yellow";

        // Perform further actions, such as logging the clickable links
        console.log("Clickable Link: ", currentLink.href);
      }
    `);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    browserView = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
