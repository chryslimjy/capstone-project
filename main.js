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

  ipcMain.on('intent-open-website', (event, query) => {
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



  ipcMain.on('obtain-link', () => {
    browserView.webContents.executeJavaScript(`
      var resultsArray = [];
      //get the following data: domain/title/url
      console.log("did it reach electron");
      const searchItems = document.querySelectorAll('span[jscontroller="msmzHf"]');

      // Iterate over each search result item
      searchItems.forEach(item => {
        // Extract the domain
        const domainElement = item.querySelector('.VuuXrf');
        const domain = domainElement ? domainElement.textContent : '';

        // Extract the title
        const titleElement = item.querySelector('h3');
        const title = titleElement ? titleElement.textContent : '';

        // Extract the URL
        const linkElement = item.querySelector('a');
        const url = linkElement ? linkElement.href : '';

        // Create the searchResult object
        const searchResult = {
          domain: domain,
          title: title,
          URL: url
        };

        // Push the result into the array
        resultsArray.push(searchResult);
      });

      // Log the results array to the console
      console.log(resultsArray);

    `);
  });

  ipcMain.on('search-result', (event, query) => {
    browserView.webContents.executeJavaScript(
      `
      // Filter results based on query
      const queryWords = ${JSON.stringify(query)}; // Convert query array to JSON string
      const matchedResults = resultsArray.filter(searchResult => {
        return queryWords.some(word =>
          searchResult.title.toLowerCase().includes(word.toLowerCase()) ||
          searchResult.domain.toLowerCase().includes(word.toLowerCase())
        );
      });

      // Extract URLs from matchedResults
      const matchedUrls = matchedResults.map(result => result.URL);
      window.location.href = matchedUrls;
    `);

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
