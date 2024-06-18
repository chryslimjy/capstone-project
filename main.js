const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

//const pythonMic = path.join(__dirname, 'python_script', 'app.py');
//add comment for commit
function runPythonScript() {
  //const pythonProcess = spawn('python', ['python_script/app.py']);

  const pythonScriptPath = path.join(__dirname, 'python_script', 'app.py');
  const pythonProcess = spawn('python', [pythonScriptPath], { cwd: path.join(__dirname, 'python_script') });

  // Handle output
  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python stdout: ${data}`);
  });

  console.log("test");

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`);
  });

  // Handle exit
  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
  });
}

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

  //use google as default web browser
  browserView.webContents.loadURL('https://www.google.com');

  ipcMain.on('search-query', (event, query) => {
    // Assuming browserView is your BrowserView instance
    if (browserView) {
      const searchEngineUrl = 'https://www.google.com/search?q=';
      const searchUrl = `${searchEngineUrl}${encodeURIComponent(query)}`;

      browserView.webContents.loadURL(searchUrl);
    }
  });

  
  ipcMain.on('browser-command', (event, query) => {
    // Assuming browserView is your BrowserView instance
    var command = query;
    if (command.includes("up")){
      browserView.webContents.executeJavaScript(
        `
        window.scrollTo({
          top: window.scrollY - 120,
          behavior: 'smooth'
        });
      `);
    }else if (command.includes("down")){
      browserView.webContents.executeJavaScript(
        `
        window.scrollTo({
        top: window.scrollY + 135,
        behavior: 'smooth'
      });
      `);
    }
    
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

  // ipcMain.on('move-down', () => {
  //   browserView.webContents.executeJavaScript(
  //     `
  //     window.scrollTo({
  //       top: window.scrollY + 135,
  //       behavior: 'smooth'
  //     });
  //   `);
  //   // browserView.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'ArrowDown' });
  // });

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

  // ipcMain.on('move-up', () => {
  //   browserView.webContents.executeJavaScript(
  //     `
  //     window.scrollTo({
  //       top: window.scrollY - 120,
  //       behavior: 'smooth'
  //     });
  //   `);
  //   // browserView.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'ArrowDown' });
  // });

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

app.whenReady().then(() => {
  runPythonScript();
  createWindow();
  
});

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
