/**
 * main.js — Proceso principal de Electron para la Biblioteca Leopoldo Lugones
 * 
 * Crea la ventana principal, inicializa la base de datos SQLite
 * y maneja las comunicaciones IPC desde el renderer.
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const db = require('./db/database');

let mainWindow;

/**
 * Crea la ventana principal de la aplicación.
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Biblioteca Leopoldo Lugones — Inventario',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: !app.isPackaged
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Abrir DevTools solo en desarrollo
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Iniciar la app
app.whenReady().then(() => {
  db.initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Cerrar base de datos y salir correctamente
app.on('window-all-closed', () => {
  db.closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  db.closeDatabase();
});

// ═══════════════════════════════════════════════════
// IPC Handlers — Comunicación con el renderer
// ═══════════════════════════════════════════════════

ipcMain.handle('get-all-books', async () => {
  try {
    return { success: true, data: db.getAllBooks() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('search-books', async (event, query) => {
  try {
    return { success: true, data: db.searchBooks(query) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-book', async (event, book) => {
  try {
    const result = db.addBook(book);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-book', async (event, id, book) => {
  try {
    db.updateBook(id, book);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-book', async (event, id) => {
  try {
    db.deleteBook(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-book-count', async () => {
  try {
    return { success: true, data: db.getBookCount() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
