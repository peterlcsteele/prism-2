import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  RootState,
  setData,
  setIsBusy,
  setCurrentFilePath,
  addRecentFile,
  clearData
} from '@shared/store'
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
  const dispatch = useDispatch()
  const { data, currentFilePath } = useSelector((state: RootState) => state.app)

  const openFile = useCallback(
    async (path?: string) => {
      dispatch(setIsBusy(true))
      try {
        const filePath = path || (await showOpenFileDialog())
        if (filePath) {
          const fileData = await readFile(filePath)
          dispatch(setData(fileData))
          dispatch(setCurrentFilePath(filePath))
          dispatch(addRecentFile(filePath))
        }
      } finally {
        dispatch(setIsBusy(false))
      }
    },
    [dispatch]
  )

  const saveFile = useCallback(
    async (saveAs = false) => {
      if (!data) {
        console.log('No data to save')
        return
      }

      dispatch(setIsBusy(true))
      let path = saveAs ? null : currentFilePath
      if (!path) {
        path = await showSaveAsDialog()
        if (!path) {
          dispatch(setIsBusy(false))
          return
        }
      }

      try {
        await writeFile(path, data)
        dispatch(setCurrentFilePath(path))
        dispatch(addRecentFile(path))
      } catch (error) {
        console.error('Error saving file:', error)
        await showErrorDialog('Save failed', `Failed to save file: ${error}`)
      } finally {
        dispatch(setIsBusy(false))
      }
    },
    [data, currentFilePath, dispatch]
  )

  const closeFile = useCallback(() => {
    dispatch(clearData())
  }, [dispatch])

  return { openFile, saveFile, closeFile }
}
