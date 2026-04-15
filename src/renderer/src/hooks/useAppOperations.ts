import { useState, useEffect, useRef } from 'react'

const ipcRenderer = window.electron.ipcRenderer

export function useAppOperations(): [boolean, (val: boolean) => Promise<void>] {
  const [isOpenAtLogin, setIsOpenAtLogin] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Get open-at-login status
  const getOpenAtLogin = async (): Promise<void> => {
    const result = await ipcRenderer.invoke('system:get-open-at-login')
    setIsOpenAtLogin(result)
  }

  // Start the polling timer (updates every 10 sec)
  const startTimer = (): void => {
    stopTimer()
    intervalRef.current = setInterval(getOpenAtLogin, 10000)
  }

  // Stop the polling timer
  const stopTimer = (): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // Setter that pauses polling while running
  const setOpenAtLogin = async (newValue: boolean): Promise<void> => {
    stopTimer()
    const result = await ipcRenderer.invoke('system:set-open-at-login', newValue)
    setIsOpenAtLogin(result)
    startTimer()
  }

  useEffect(() => {
    getOpenAtLogin() // Get initial value
    startTimer()
    return () => {
      stopTimer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [isOpenAtLogin, setOpenAtLogin]
}
