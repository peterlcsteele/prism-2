// React Router
import { createFileRoute } from '@tanstack/react-router'

// Zustand
import { StoreState } from '@shared/types'
import { useStore } from '@renderer/hooks/useStore'
import { useDispatch } from '@zubridge/electron'

// Services
import { showCustomDialog } from '@renderer/services'

// UI
import { Button, Group, Textarea } from '@mantine/core'

// Icons
import { FaFolderOpen, FaSave } from 'react-icons/fa'
import Menu from '@renderer/components/menu'

// Hooks
// import { useMenuEvents } from '@renderer/hooks/useMenuEvents'
// import { useFileOperations } from '@renderer/hooks/useFileOperations'

// API
const api = window.api

export const Route = createFileRoute('/')({
  component: Index
})

function Index(): React.JSX.Element {
  // Zustand store
  const { data, isBusy } = useStore((store) => store.app)
  const dispatch = useDispatch<StoreState>()

  // Handle app menu events (File > Open, Save, etc.)
  // useMenuEvents()

  // File operations
  // const { openFile, saveFile, closeFile } = useFileOperations()

  // Handlers
  const onClickMessageBox = async (): Promise<void> => {
    const response = await showCustomDialog('How are you today', ['Good', 'Bad'])
    if (response === 0) {
      console.log('Good')
    } else if (response === 1) {
      console.log('Bad')
    }
  }

  return (
    <div className="app-container">
      {/* Left column - 1/3 width */}
      <div className="sidebar bg-teal">
        <Group>
          <Button leftSection={<FaFolderOpen />} onClick={() => api.openFile()} disabled={isBusy}>
            Open file
          </Button>
          <Button onClick={onClickMessageBox} disabled={isBusy}>
            Show message box
          </Button>
          <Button
            leftSection={<FaSave />}
            onClick={() => api.saveFile()}
            disabled={isBusy || !data}
          >
            Save file
          </Button>
        </Group>
        <Menu />
        <div style={{ margin: '10px 0' }}>
          {data && <p>File loaded: {data.length} characters</p>}
        </div>
      </div>
      {/* Right column - 2/3 width */}
      <div className="main">
        <Textarea
          h={'100vh'}
          value={data || 'No data to display yet'}
          onChange={(e) => dispatch('app.setData', e.target.value)}
        />
      </div>
    </div>
  )
}
