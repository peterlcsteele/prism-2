import { BrowserWindow, app, shell } from 'electron'
import path from 'path'
import { is } from '@electron-toolkit/utils'
// Zustand bridge
import { bridge } from './bridge'

const windows: Record<string, BrowserWindow | undefined> = {}

export function createMainWindow(): BrowserWindow {
  if (windows.main) {
    windows.main.focus()
    return windows.main
  }

  windows.main = new BrowserWindow({
    width: 1024,
    height: 768,
    show: true,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    ...(process.platform === 'linux'
      ? { icon: path.join(__dirname, '../../resources/icon.png') }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: process.env.NODE_ENV !== 'development'
    }
  })

  bridge.subscribe([windows.main]) // <== Register with bridge

  windows.main.on('ready-to-show', () => windows.main!.show())
  windows.main.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Open dev tools
  if (process.env.NODE_ENV === 'development') {
    windows.main.webContents.openDevTools()
  }

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    windows.main.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    windows.main.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return windows.main
}

export function createSettingsWindow(): BrowserWindow {
  if (windows.settings) {
    windows.settings.focus()
    return windows.settings
  }

  const parent = windows.main
  windows.settings = new BrowserWindow({
    parent,
    title: app.getName() + ' - Settings',
    width: 640,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: process.env.NODE_ENV !== 'development'
    }
  })

  bridge.subscribe([windows.settings]) // <== Register with bridge

  windows.settings.once('ready-to-show', () => windows.settings!.show())
  windows.settings.on('closed', () => {
    windows.settings = undefined
  })

  // Open dev tools
  if (process.env.NODE_ENV === 'development') {
    windows.settings.webContents.openDevTools()
  }

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    windows.settings.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#/settings')
  } else {
    windows.settings.loadFile(path.join(__dirname, '../renderer/index.html/#/settings'))
  }

  return windows.settings
}

export function getWindowById(key: WindowId): BrowserWindow | undefined {
  return windows[key]
}

export function cleanupWindows(): void {
  // Unsubscribe all windows from bridge
  bridge.unsubscribe()
  // Destroy all windows
  Object.values(windows).forEach((w) => w?.destroy())
}

export type WindowId = 'main' | 'settings'
