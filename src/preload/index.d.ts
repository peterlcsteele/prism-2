import { ElectronAPI } from '@electron-toolkit/preload'
import {
  OpenDialogOptions,
  OpenDialogReturnValue,
  MessageBoxOptions,
  MessageBoxReturnValue,
  SaveDialogOptions,
  SaveDialogReturnValue
} from 'electron'
import { ReadFileParams, WriteFileParams, MenuState } from '@shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // New
      openFile(filePath?: string): void
      saveFile(): void
      setOutputDir(): void
      setLogoPath(): void
      clearLogoPath(): void
      setPreRunScript(): void
      setPostRunScript(): void
      // Dialog
      showOpenDialog(options: OpenDialogOptions): Promise<OpenDialogReturnValue>
      showMessageBox(options: MessageBoxOptions): Promise<MessageBoxReturnValue>
      showSaveDialog(options: SaveDialogOptions): Promise<SaveDialogReturnValue>
      // File
      readFile(options: ReadFileParams): Promise<string>
      writeFile(options: WriteFileParams): Promise<void>
      //
      showItemInFolder(fullPath: string): void
      updateMenuState(state: MenuState): void
      // Event handlers (returns)
      onMenuOpen(callback: (...args) => void): () => void
      onMenuImport(callback: (...args) => void): () => void
      onMenuClose(callback: (...args) => void): () => void
      onMenuSave(callback: (...args) => void): () => void
      onMenuSaveAs(callback: (...args) => void): () => void
      onMenuExport(callback: (...args) => void): () => void
    }
    // TODO: Define zubridge definitions here
    // zubridge: {}
  }
}
