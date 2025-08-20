import { useEffect, useCallback } from 'react'

// Add Zustand bridge imports
import { useStore } from './useStore'

// import type { StoreState } from '@types'
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
  // Use store hook
  const { data, currentFilePath } = useStore((store) => store.app)

  const handleMenuOpen = useCallback(
    async (path: string | undefined) => {
      setIsBusy!(true)
      try {
        if (!path) {
          path = await showOpenFileDialog()
        }
        if (path) {
          const fileData = await readFile(path)
          setData!(fileData)
          setCurrentFilePath!(path)
          addRecentFile!(path)
        }
      } finally {
        setIsBusy!(false)
      }
    },
    [setIsBusy, setData, addRecentFile, setCurrentFilePath]
  )

  const handleMenuImport = useCallback(
    async ({ format }: { format: string }) => {
      setIsBusy!(true)
      try {
        const path = await showImportFileDialog()
        if (path) {
          const fileData = await importFile(path, format)
          setData(fileData)
        }
      } finally {
        setIsBusy!(false)
      }
    },
    [setIsBusy, setData]
  )

  const handleMenuClose = useCallback(() => {
    clearData!()
  }, [clearData])

  const handleMenuSave = useCallback(async () => {
    if (!data) {
      console.log('No data to save')
      return
    }
    setIsBusy!(true)
    let path = currentFilePath
    if (!path) {
      path = await showSaveAsDialog()
      if (!path) {
        setIsBusy!(false)
        return
      }
    }
    try {
      await writeFile(path, data)
      setCurrentFilePath!(path)
      addRecentFile!(path)
    } catch (error) {
      console.error('Error saving file:', error)
      await showErrorDialog('Save failed', `Failed to save file: ${error}`)
    } finally {
      setIsBusy!(false)
    }
  }, [data, currentFilePath, setIsBusy, addRecentFile, setCurrentFilePath])

  const handleMenuSaveAs = useCallback(async () => {
    if (!data) {
      console.log('No data to save')
      return
    }

    setIsBusy!(true)
    const path = await showSaveAsDialog()
    if (!path) {
      setIsBusy!(false)
      return
    }

    try {
      await writeFile(path, data as string)
      setCurrentFilePath!(path)
      addRecentFile!(path)
    } catch (error) {
      console.error('Error saving file:', error)
      await showErrorDialog('Save failed', `Failed to save file: ${error}`)
    } finally {
      setIsBusy!(false)
    }
  }, [data, setIsBusy, setCurrentFilePath, addRecentFile])

  const handleMenuExport = useCallback(
    async ({ format }: { format: string }) => {
      setIsBusy!(true)
      try {
        if (!data) return
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
        setIsBusy!(false)
      }
    },
    [data, setIsBusy]
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
