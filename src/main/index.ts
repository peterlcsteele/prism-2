import { app, BrowserWindow } from 'electron'
import path from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'

// Zustand store
import { store } from './store'
// import { handlers } from '@shared/store/handlers' // TO BE REMOVED
// Menu
import { setupAppMenu } from './menu'
// IPC
import { setupIpcHandlers } from './ipcHandlers'
// API
import { setAPIServerEnabled } from './mainProcesses'
import { cleanupWindows, createMainWindow, getWindowById } from './windowManager'

// async function createWindow(): Promise<void> {
//   // Create the browser window.
//   mainWindow = new BrowserWindow({
//     width: 1024,
//     height: 768,
//     show: false,
//     autoHideMenuBar: true,
//     ...(process.platform === 'linux' ? { icon } : {}),
//     webPreferences: {
//       preload: join(__dirname, '../preload/index.js'),
//       sandbox: false,
//       webSecurity: process.env.NODE_ENV !== 'development'
//     }
//   })

//   // Subscribe window to bridge
//   bridge.subscribe([mainWindow])

//   mainWindow.on('ready-to-show', () => {
//     // Show window
//     mainWindow?.show()
//   })

//   mainWindow.webContents.setWindowOpenHandler((details) => {
//     shell.openExternal(details.url)
//     return { action: 'deny' }
//   })

//   // Open dev tools
//   if (process.env.NODE_ENV === 'development') {
//     mainWindow.webContents.openDevTools()
//   }

//   // HMR for renderer base on electron-vite cli.
//   // Load the remote URL for development or the local html file for production.
//   if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
//     mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
//   } else {
//     mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
//   }
// }

// Check if only instance
const isOnlyInstance = app.requestSingleInstanceLock()
if (!isOnlyInstance) {
  // Quit if another instance is already running
  app.exit()
} else {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(async () => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('dev.xs1.prism')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    createMainWindow()

    // Setup app menu with store
    setupAppMenu(store)

    // Setup IPC handlers (store no longer required as arg)
    setupIpcHandlers()

    // Start/stop API server
    await setAPIServerEnabled(store.getState().settings.apiEnabled, 'launch')

    // Subscribe to store changes and update menu
    const handleUpdate = (): void => {
      const { app } = store.getState()

      // Update window title
      getWindowById('main')!.setTitle(
        app.currentFilePath ? path.basename(app.currentFilePath) : 'Untitled'
      )
    }

    // Store
    store.subscribe(handleUpdate)

    // createWindow()

    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })

  // Zustand: Cleanup
  app.on('quit', () => {
    // Cleanup windows
    cleanupWindows()
  })

  // Quit when all windows are closed
  app.on('window-all-closed', () => {
    app.quit()
  })

  // Handle second instance attempts
  app.on('second-instance', () => {
    // Check for main window
    const mainWindow = getWindowById('main')

    // Return focus to existing window
    if (mainWindow) {
      // Bounce the app icon (macOS)
      if (process.platform === 'darwin') {
        app.dock?.bounce()
      }

      // Restore window if minimized
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }

      // Focus window
      mainWindow.focus()
    }
  })
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
