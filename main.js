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
      enableRemoteModule: false,
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

  // Create a text node with the position and append it to the anchor element
  var positionText = document.createTextNode((i + 1));
  var textBox = document.createElement("div");
  textBox.style.position = "absolute";
  textBox.style.left = "0";
  textBox.style.top = "0";
  textBox.style.background = "rgba(255, 255, 255, 0.7)";
  textBox.style.padding = "5px";
  textBox.appendChild(positionText);
  currentLink.appendChild(textBox);

  // Perform further actions, such as logging the clickable links
  console.log("Clickable Link: ", currentLink.href);
}

    `);
  });


  ipcMain.on('search-query', (event, query) => {
    // Assuming browserView is your BrowserView instance
    if (browserView) {
      const searchEngineUrl = 'https://www.google.com/search?q=';
      const searchUrl = `${searchEngineUrl}${encodeURIComponent(query)}`;
  
      browserView.webContents.loadURL(searchUrl);
    }
  });



  ipcMain.on('search-bar', (event, query) => {
    browserView.webContents.executeJavaScript(
      `
    // Select the input field (modify the selector based on your HTML structure)
    var inputField = document.querySelector('input[type="text"]');
    
    if (inputField) {
      // Fill the input field with the provided query
      inputField.value = '${query}';
      
    
    }
    `);
  });


  ipcMain.on('submit', () => {

    `
    // Select the input field (modify the selector based on your HTML structure)
    var inputField = document.querySelector('input[type="text"]');
    
    if (inputField !=='') {
      inputField.form.submit();
    }
    `
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
