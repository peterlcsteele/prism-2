import { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  RootState,
  setData,
  setIsBusy,
  clearData,
  setCurrentFilePath,
  addRecentFile
} from '@shared/store'
import {
  readFile,
  writeFile,
  showInFinder,
  exportFile,
  importFile,
  showOpenFileDialog,
  showImportFileDialog,
  showExportFileDialog,
  showExportSuccessDialog,
  showErrorDialog,
  showSaveAsDialog
} from '../services'

const { api } = window

export function useMenuEvents(): void {
  const dispatch = useDispatch()
  const { data, currentFilePath } = useSelector((state: RootState) => state.app)

  const handleMenuOpen = useCallback(
    async (path: string | undefined) => {
      dispatch(setIsBusy(true))
      try {
        if (!path) {
          path = await showOpenFileDialog()
        }
        if (path) {
          const fileData = await readFile(path)
          dispatch(setData(fileData))
          dispatch(setCurrentFilePath(path))
          dispatch(addRecentFile(path))
        }
      } finally {
        dispatch(setIsBusy(false))
      }
    },
    [dispatch]
  )

  const handleMenuImport = useCallback(
    async ({ format }: { format: string }) => {
      dispatch(setIsBusy(true))
      try {
        const path = await showImportFileDialog()
        if (path) {
          const fileData = await importFile(path, format)
          dispatch(setData(fileData))
        }
      } finally {
        dispatch(setIsBusy(false))
      }
    },
    [dispatch]
  )

  const handleMenuClose = useCallback(() => {
    dispatch(clearData())
  }, [dispatch])

  const handleMenuSave = useCallback(async () => {
    if (!data) {
      console.log('No data to save')
      return
    }

    dispatch(setIsBusy(true))
    let path = currentFilePath
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
  }, [data, currentFilePath, dispatch])

  const handleMenuSaveAs = useCallback(async () => {
    if (!data) {
      console.log('No data to save')
      return
    }

    dispatch(setIsBusy(true))
    const path = await showSaveAsDialog()
    if (!path) {
      dispatch(setIsBusy(false))
      return
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
  }, [data, dispatch])

  const handleMenuExport = useCallback(
    async ({ format }: { format: string }) => {
      dispatch(setIsBusy(true))
      try {
        const path = await showExportFileDialog(format)
        if (path) {
          await exportFile(format, path, data)
          const shouldShowInFinder = await showExportSuccessDialog(path)
          if (shouldShowInFinder) {
            showInFinder(path)
          }
        }
      } catch (error) {
        console.error('Error exporting file:', error)
        await showErrorDialog('Export failed', `Failed to export file: ${error}`)
      } finally {
        dispatch(setIsBusy(false))
      }
    },
    [data, dispatch]
  )

  useEffect(() => {
    const removeMenuOpen = api.onMenuOpen(handleMenuOpen)
    const removeMenuImport = api.onMenuImport(handleMenuImport)
    const removeMenuClose = api.onMenuClose(handleMenuClose)
    const removeMenuSave = api.onMenuSave(handleMenuSave)
    const removeMenuSaveAs = api.onMenuSaveAs(handleMenuSaveAs)
    const removeMenuExport = api.onMenuExport(handleMenuExport)

    return () => {
      removeMenuOpen()
      removeMenuImport()
      removeMenuClose()
      removeMenuSave()
      removeMenuSaveAs()
      removeMenuExport()
    }
  }, [
    handleMenuOpen,
    handleMenuImport,
    handleMenuClose,
    handleMenuSave,
    handleMenuSaveAs,
    handleMenuExport
  ])
}
