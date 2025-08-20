import { app, BrowserWindow, Menu, MenuItemConstructorOptions, shell } from 'electron'
import { StoreApi } from 'zustand/vanilla'
import type { StoreState } from '@shared/types'

import { openFile, importFile, saveFile, showSettings, exportFile } from './mainProcesses'

const buildMenuTemplate = (
  focusedWindow: BrowserWindow,
  state: StoreState
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
        label: 'Settings...',
        click: () => {
          showSettings()
        }
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
          openFile()
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
          importFile()
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
          saveFile()
        }
      },
      {
        label: 'Save as...',
        accelerator: 'CmdOrCtrl+Shift+S',
        enabled: state.app.data !== null && !state.app.isBusy,
        click: () => {
          saveFile()
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
              exportFile('html')
            }
          },
          {
            type: 'separator'
          },
          {
            label: 'Package for Canvas',
            accelerator: 'CmdOrCtrl+1',
            click: () => {
              exportFile('canvas')
            }
          },
          {
            label: 'Package for Learn 9',
            accelerator: 'CmdOrCtrl+2',
            click: () => {
              exportFile('learn9')
            }
          },
          {
            label: 'Package for Moodle',
            accelerator: 'CmdOrCtrl+3',
            click: () => {
              exportFile('moodle')
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

export const setupAppMenu = (store: StoreApi<StoreState>): void => {
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

  // Menu: Open recent handler
  app.on('open-file', (_event, filePath) => {
    openFile(filePath)
  })
}
