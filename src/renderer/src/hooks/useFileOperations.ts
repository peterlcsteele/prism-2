import { useCallback } from 'react'

// Add Zustand bridge imports
import { useStore } from './useStore'

// Services
import {
  readFile,
  writeFile,
  showOpenFileDialog,
  showSaveAsDialog,
  showErrorDialog
} from '../services'

export function useFileOperations(): {
  openFile: (path?: string) => Promise<void>
  saveFile: (saveAs?: boolean) => Promise<void>
  closeFile: () => void
} {
  // Debug: Check what we're getting from the store
  console.log('Store state:', useStore.getState())

  const { data, currentFilePath, setData, setIsBusy, setCurrentFilePath, clearData } = useStore(
    (store) => store.app
  )
  const { addRecentFile } = useStore((store) => store.settings)

  // Debug: Check if actions are functions
  console.log('Actions:', {
    setData: typeof setData,
    setIsBusy: typeof setIsBusy,
    setCurrentFilePath: typeof setCurrentFilePath,
    addRecentFile: typeof addRecentFile,
    clearData: typeof clearData
  })

  const openFile = useCallback(
    async (path?: string) => {
      setIsBusy(true)
      try {
        const filePath = path || (await showOpenFileDialog())
        if (filePath) {
          const fileData = await readFile(filePath)
          setData(fileData)
          setCurrentFilePath(filePath)
          addRecentFile(filePath)
        }
      } finally {
        setIsBusy(false)
      }
    },
    [setIsBusy, addRecentFile, setCurrentFilePath, setData]
  )

  const saveFile = useCallback(
    async (saveAs = false) => {
      if (!data) {
        console.log('No data to save')
        return
      }

      setIsBusy(true)
      let path = saveAs ? null : currentFilePath
      if (!path) {
        path = await showSaveAsDialog()
        if (!path) {
          setIsBusy(false)
          return
        }
      }

      try {
        await writeFile(path, data)
        setCurrentFilePath(path)
        addRecentFile(path)
      } catch (error) {
        console.error('Error saving file:', error)
        await showErrorDialog('Save failed', `Failed to save file: ${error}`)
      } finally {
        setIsBusy(false)
      }
    },
    [data, currentFilePath, setIsBusy, addRecentFile, setCurrentFilePath]
  )

  const closeFile = useCallback(() => {
    clearData()
  }, [clearData])

  return { openFile, saveFile, closeFile }
}
