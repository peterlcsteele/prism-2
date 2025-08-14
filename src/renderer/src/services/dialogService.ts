/**
 * Dialog operations - preconfigured for specific use cases
 */

import { generateDateTimeStamp } from '../utils'

/**
 * File picker dialogs
 */
export async function showOpenFileDialog(): Promise<string | undefined> {
  const { canceled, filePaths } = await window.api.showOpenDialog({
    properties: ['openFile'],
    message: 'Select a file',
    filters: [
      {
        name: 'Text',
        extensions: ['txt']
      }
    ]
  })

  if (canceled || filePaths.length === 0) {
    console.log('File selection canceled')
    return undefined
  }
  return filePaths[0]
}

export async function showImportFileDialog(): Promise<string | undefined> {
  const { canceled, filePaths } = await window.api.showOpenDialog({
    properties: ['openFile'],
    message: 'Import file',
    filters: [
      {
        name: 'Supported files',
        extensions: ['txt']
      }
    ]
  })
  if (canceled || filePaths.length === 0) {
    console.log('File selection canceled')
    return undefined
  }
  return filePaths[0]
}

export async function showSaveAsDialog(): Promise<string | null> {
  // Get current datetimestamp YYYY-DD-MM-HH-MM-SS
  const timestamp = generateDateTimeStamp()

  const { canceled, filePath } = await window.api.showSaveDialog({
    message: `Save as...`,
    defaultPath: `${timestamp}.txt`,
    filters: [{ name: 'Text files', extensions: ['txt'] }]
  })

  if (canceled || !filePath) {
    console.log('Save as operation canceled')
    return null
  }
  return filePath
}
export async function showExportFileDialog(format: string): Promise<string | null> {
  console.log(`Exporting as: ${format}`)

  let filters: { name: string; extensions: string[] }[] = []
  let defaultPath = 'export'
  switch (format) {
    case 'html':
      filters = [{ name: 'HTML', extensions: ['html'] }]
      defaultPath = 'export.html'
      break
    case 'canvas':
    case 'learn9':
    case 'moodle':
      filters = [{ name: 'Package', extensions: ['zip'] }]
      defaultPath = `export-${format}.zip`
      break
    default:
      filters = [{ name: 'All Files', extensions: ['*'] }]
  }

  const { canceled, filePath } = await window.api.showSaveDialog({
    message: `Export file as ${format}`,
    defaultPath,
    filters
  })

  if (canceled || !filePath) {
    console.log('Export operation canceled')
    return null
  }
  return filePath
}

/**
 * Success/confirmation dialogs
 */
export async function showExportSuccessDialog(path: string): Promise<boolean> {
  const { response } = await window.api.showMessageBox({
    message: 'Export completed',
    detail: `File exported to: ${path}`,
    buttons: ['Show in Finder', 'Done']
  })
  return response === 0
}

/**
 * Error dialogs
 */
export async function showErrorDialog(title: string, message: string): Promise<void> {
  await window.api.showMessageBox({
    message: title,
    detail: message,
    buttons: ['OK']
  })
}

/**
 * Custom message dialogs
 */
export async function showCustomDialog(message: string, buttons: string[]): Promise<number> {
  const { response } = await window.api.showMessageBox({
    message,
    buttons
  })
  return response
}
