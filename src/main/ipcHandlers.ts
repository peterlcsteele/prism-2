import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  shell,
  IpcMainInvokeEvent,
  IpcMainEvent,
  MessageBoxOptions,
  OpenDialogOptions,
  SaveDialogOptions,
  OpenDialogReturnValue,
  SaveDialogReturnValue,
  MessageBoxReturnValue
} from 'electron'
import path from 'node:path'
import os from 'node:os'
import process from 'node:process'
import fs from 'fs-extra'

// Types
import {
  EnvironmentData,
  DownloadParams,
  ReadFileParams,
  WriteFileParams,
  UnzipParams,
  ZipParams
} from '@types'

// Redux
import { Store } from '@reduxjs/toolkit'
import { RootState } from './store'
import { addRecentFile } from '../features/settings/settingsSlice'

// Zip / Unzip
import archiver from 'archiver'
import extract from 'extract-zip'

// Download
import { download } from 'electron-dl'

// Machine ID
import { machineId } from 'node-machine-id'

export const setupIpcHandlers = (store: Store<RootState>): void => {
  const focusedWindow = BrowserWindow.getAllWindows()[0]!

  // System
  ipcMain.handle('system:get-machine-id', async (): Promise<string> => {
    console.log('[ipcMain] app:get-machine-id')
    return machineId()
  })
  ipcMain.handle('system:get-environment-data', (): EnvironmentData => {
    console.log('[ipcMain] system:get-environment-data')
    const envData: EnvironmentData = {
      filePrefix: os.platform() === `win32` ? `file:///` : `file://`,
      installDir: app.getAppPath(),
      platform: os.platform(),
      release: os.release(),
      workingDir: ''
    }
    if (process.platform === 'win32') {
      const baseDir = path.join(app.getPath('home'), 'AppData', 'Local')
      envData.workingDir = path.join(baseDir, 'PRISM-data')
    } else {
      envData.workingDir = path.join(app.getPath('documents'), 'PRISM')
    }
    return envData
  })

  // App
  ipcMain.on('app:quit', (): void => {
    console.log('[ipcMain] app:quit')
    app.quit()
  })
  ipcMain.handle('app:get-version', (): string => {
    console.log('[ipcMain] app:get-version')
    return app.getVersion()
  })
  ipcMain.handle('app:get-electron-version', (): string => {
    console.log('[ipcMain] app:get-electron-version')
    return process.versions.electron
  })
  ipcMain.handle(
    'app:add-recent-document',
    (_event: IpcMainInvokeEvent, filePath: string): void => {
      console.log(`[ipcMain] app:add-recent-document: ${filePath}`)
      app.addRecentDocument(filePath)
    }
  )

  // File
  ipcMain.handle(
    'file:download',
    async (_event: IpcMainInvokeEvent, { url, saveAs }: DownloadParams): Promise<boolean> => {
      console.log(`[ipcMain] file:download: ${url}`)
      const { base, dir } = path.parse(saveAs)
      try {
        await download(focusedWindow, url, {
          directory: dir,
          filename: base
        })
        return true
      } catch (err: unknown) {
        console.error(err)
        return false
      }
    }
  )
  ipcMain.handle(
    'file:read',
    async (
      _event: IpcMainInvokeEvent,
      { path, encoding = 'utf8' }: ReadFileParams
    ): Promise<string> => {
      console.log('[ipcMain] file:read')
      return fs.readFile(path, encoding)
    }
  )
  ipcMain.handle(
    'file:write',
    async (
      _event: IpcMainInvokeEvent,
      { path, data, encoding = 'utf8' }: WriteFileParams
    ): Promise<void> => {
      console.log(`[ipcMain] file:write (${path}`)
      return fs.writeFile(path, data, encoding)
    }
  )

  // Window
  ipcMain.handle(
    'window:set-title',
    async (_event: IpcMainInvokeEvent, title: string): Promise<void> => {
      console.log(`[ipcMain] window:set-title: '${title}'`)
      focusedWindow.setTitle(`${app.getName()}: ${title}`)
    }
  )

  // Archive
  ipcMain.handle(
    'archive:unzip',
    async (_event: IpcMainInvokeEvent, { zipPath, unzipPath }: UnzipParams): Promise<void> => {
      console.log(`[ipcMain] archive:unzip: '${zipPath}'`)
      return extract(zipPath, {
        dir: unzipPath
      })
    }
  )
  ipcMain.handle(
    'archive:zip',
    async (_event: IpcMainInvokeEvent, { dirPath, zipPath }: ZipParams): Promise<string> => {
      console.log(`[ipcMain] archive:zip: '${dirPath}'`)
      return new Promise<string>((resolve, reject) => {
        const output = fs.createWriteStream(zipPath)
        const archive = archiver('zip', { zlib: { level: 0 } })
        output.on('close', () => {
          console.log(`Zip created`)
          resolve(zipPath)
        })
        archive.on('warning', (data: archiver.ArchiverError) => {
          console.warn(data)
        })
        archive.on('error', (err: archiver.ArchiverError) => {
          reject(err)
        })
        archive.pipe(output)
        archive.directory(dirPath, false)
        archive.finalize()
      })
    }
  )

  // Dialog
  ipcMain.handle(
    'dialog:show-message-box',
    async (
      _event: IpcMainInvokeEvent,
      options: MessageBoxOptions
    ): Promise<MessageBoxReturnValue> => {
      console.log('[ipcMain] showMessageBox')
      return dialog.showMessageBox(focusedWindow, {
        ...options
      })
    }
  )
  ipcMain.handle(
    'dialog:show-open-dialog',
    async (
      _event: IpcMainInvokeEvent,
      options: OpenDialogOptions
    ): Promise<OpenDialogReturnValue> => {
      console.log(`[ipcMain] dialog:show-open-dialog`)
      const response = await dialog.showOpenDialog(focusedWindow, options)
      // Add to recent
      if (response.filePaths[0]) {
        app.addRecentDocument(response.filePaths[0])
        store.dispatch(addRecentFile(response.filePaths[0]))
      }
      return response
    }
  )
  ipcMain.handle(
    'dialog:show-save-dialog',
    (_event: IpcMainInvokeEvent, options: SaveDialogOptions): Promise<SaveDialogReturnValue> => {
      console.log(`[ipcMain] dialog:show-save-dialog`)
      return dialog.showSaveDialog(focusedWindow, options)
    }
  )

  // Shell
  ipcMain.on('shell:open-path', (_event: IpcMainEvent, path: string): void => {
    console.log(`[ipcMain] shell:open-path: ${path}`)
    shell.openPath(path)
  })
  ipcMain.on('shell:open-external', (_event: IpcMainEvent, url: string): void => {
    console.log(`[ipcMain] shell:open-external: ${url}`)
    shell.openExternal(url)
  })
  ipcMain.on('shell:show-item-in-folder', (_event: IpcMainEvent, fullPath: string): void => {
    console.log(`[ipcMain] shell:show-item-in-folder: ${fullPath}`)
    shell.showItemInFolder(fullPath)
  })
}
