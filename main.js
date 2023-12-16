// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const WebSocket = require('ws');
const http = require('http');

let mainWindow;
let wss;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools();

  // Create an HTTP server
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World\n');
  });

  wss = new WebSocket.Server({ noServer: true });

  wss.on('connection', (socket) => {
    socket.on('message', (message) => {
      handleMessage(message);
    });
  });

  // Attach the WebSocket server to the HTTP server
  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  server.listen(3000);

  mainWindow.on('closed', () => {
    mainWindow = null;
    wss.close();
  });
}

function handleMessage(message) {
  if (message === 'open-chrome') {
    // Handle opening external browser or trigger actions in external browser
    // (this part depends on how you plan to interact with the external browser)
  } else if (message === 'execute-command') {
    // Send the execute command to the Python WebSocket server
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send('execute-command');
      }
    });
  }
}

ipcMain.on('message-from-renderer', (event, message) => {
  handleMessage(message);
});

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
