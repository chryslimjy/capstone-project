// import axios from 'axios';

const { app, BrowserWindow, ipcMain } = require('electron');

//const axios = require('axios');

let mainWindow;
let browserView;

function createWindow() {
  // Create the main browser window
  mainWindow = new BrowserWindow({
    width: 900,
    height: 750,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false,
    },
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools();


  browserView = new BrowserWindow({ webPreferences: { nodeIntegration: false } });
  mainWindow.setBrowserView(browserView);
  browserView.setBounds({ x: 0, y: 0, width: 800, height: 600 });

  
  browserView.webContents.loadURL('https://www.google.com');


  ipcMain.on('execute-command-click', () => {
    browserView.webContents.executeJavaScript(`
      var h3Tags = document.getElementsByTagName("h3");
      var hyperlinks = ['']; // Initialize with empty string to match div numbering
  
      for (var i = 0; i < h3Tags.length; i++) {
        var div = document.createElement("div");
        div.style.position = "absolute";
        div.style.top = "0";
        div.style.right = "0"; //place number in top right
        div.style.backgroundColor = "red";
        div.innerText = (i + 1).toString();
        div.classList.add("numTag"); // Add your class name here
        h3Tags[i].insertBefore(div, h3Tags[i].firstChild);
        h3Tags[i].style.backgroundColor = "yellow";
  
        // Get hyperlink tied to h3 tag
        var anchor = h3Tags[i].closest('a');
        if (anchor) {
          hyperlinks.push(anchor.href); // Store hyperlink in the array
        }
      }
  
      console.log(hyperlinks); // Log the contents of the array
    `);
  });
  
  ipcMain.on('goto-link', (event, query) => {
    browserView.webContents.executeJavaScript(`
      var num = ${query}; // Number received from the event
      if (hyperlinks && Array.isArray(hyperlinks)) {
        if (num >= 0 && num < hyperlinks.length) {
          window.location.href = hyperlinks[num]; // Navigate to the corresponding link
        } else {
          console.error("Invalid number received or hyperlink not found for the given number.");
        }
      } else {
        console.error("Hyperlinks array is not accessible or invalid.");
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

  ipcMain.on('move-down', () => {
    browserView.webContents.executeJavaScript(
      `
      window.scrollTo({
        top: window.scrollY + 135,
        behavior: 'smooth'
      });
    `);
    // browserView.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'ArrowDown' });
  });

  ipcMain.on('move-bottom', () => {
    browserView.webContents.executeJavaScript(
      `
      window.scrollTo({
        top: document.body.scrollHeight,
          behavior: 'smooth'
      });
    `);
    // browserView.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'ArrowDown' });
  });


  ipcMain.on('move-up', () => {
    browserView.webContents.executeJavaScript(
      `
      window.scrollTo({
        top: window.scrollY - 120,
        behavior: 'smooth'
      });
    `);
    // browserView.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'ArrowDown' });
  });


  ipcMain.on('move-top', () => {
    browserView.webContents.executeJavaScript(
      `
      window.scrollTo({
        top: 0,
          behavior: 'smooth'
      });
    `);
    // browserView.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'ArrowDown' });
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
