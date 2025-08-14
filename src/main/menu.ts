import { app, BrowserWindow, Menu, MenuItemConstructorOptions, shell } from 'electron'
import { Store } from '@reduxjs/toolkit'

import type { RootState } from './store'

const buildMenuTemplate = (
  focusedWindow: BrowserWindow,
  state: RootState
): MenuItemConstructorOptions[] => [
  {
    label: app.getName(),
    submenu: [
      {
        role: 'about' // Uses the predefined role for 'About' on macOS
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.quit()
        }
      }
    ]
  },
  {
    label: 'File',
    submenu: [
      {
        label: 'Open',
        accelerator: 'CmdOrCtrl+O',
        enabled: !state.app.isBusy,
        click: () => {
          focusedWindow.webContents.send('menu:open')
        }
      },
      {
        label: 'Open Recent',
        role: 'recentDocuments',
        submenu: [
          {
            label: 'Clear Recent',
            role: 'clearRecentDocuments'
          }
        ]
      },
      {
        type: 'separator'
      },
      {
        label: 'Import',
        accelerator: 'CmdOrCtrl+I',
        enabled: !state.app.isBusy,
        click: () => {
          focusedWindow.webContents.send('menu:import', { format: 'learn9' })
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        enabled: state.app.data !== null && !state.app.isBusy,
        click: () => {
          focusedWindow.webContents.send('menu:close')
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        enabled: state.app.data !== null && !state.app.isBusy,
        click: () => {
          focusedWindow.webContents.send('menu:save')
        }
      },
      {
        label: 'Save as...',
        accelerator: 'CmdOrCtrl+Shift+S',
        enabled: state.app.data !== null && !state.app.isBusy,
        click: () => {
          focusedWindow.webContents.send('menu:save-as')
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Export as...',
        enabled: state.app.data !== null && !state.app.isBusy,
        submenu: [
          {
            label: 'HTML',
            accelerator: 'CmdOrCtrl+0',
            click: () => {
              focusedWindow.webContents.send('menu:export', { format: 'html' })
            }
          },
          {
            type: 'separator'
          },
          {
            label: 'Package for Canvas',
            accelerator: 'CmdOrCtrl+1',
            click: () => {
              focusedWindow.webContents.send('menu:export', { format: 'canvas' })
            }
          },
          {
            label: 'Package for Learn 9',
            accelerator: 'CmdOrCtrl+2',
            click: () => {
              focusedWindow.webContents.send('menu:export', { format: 'learn9' })
            }
          },
          {
            label: 'Package for Moodle',
            accelerator: 'CmdOrCtrl+3',
            click: () => {
              focusedWindow.webContents.send('menu:export', { format: 'moodle' })
            }
          }
        ]
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        role: 'undo'
      },
      {
        role: 'redo'
      },
      {
        type: 'separator'
      },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteAndMatchStyle' }, // Optional: platform-dependent
      { role: 'delete' }, // Optional: platform-dependent
      {
        role: 'selectAll'
      }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Documentation',
        click: () => {
          shell.openExternal('https://www.xs1.dev/prism/help')
        }
      }
    ]
  }
]

export const setupAppMenu = (store: Store<RootState>): void => {
  // Get currently focused window
  const focusedWindow = BrowserWindow.getAllWindows()[0]!

  // Subscribe to store changes and update menu
  const updateMenu = (): void => {
    const state = store.getState()
    const newMenu = Menu.buildFromTemplate(buildMenuTemplate(focusedWindow, state))
    Menu.setApplicationMenu(newMenu)
  }

  // Initial menu setup
  updateMenu()

  // Subscribe to store changes
  store.subscribe(updateMenu)

  // App Menu: Handlers
  app.on('open-file', (_event, path) => {
    focusedWindow.webContents.send('menu:open', path)
  })
}
