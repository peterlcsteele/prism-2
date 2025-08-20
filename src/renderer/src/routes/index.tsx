import { createFileRoute } from '@tanstack/react-router'

// Zustand
import { StoreState } from '@shared/types'
import { useStore } from '@renderer/hooks/useStore'
import { useDispatch } from '@zubridge/electron'

// Assets
// import electronLogo from '../assets/electron.svg'

// Services
import { showCustomDialog } from '@renderer/services'
import { ModeToggle } from '@renderer/components/mode-toggle'

// UI
import { Button } from '@renderer/components/ui/button'
import { Textarea } from '@renderer/components/ui/textarea'
import { Spinner } from '@renderer/components/ui/spinner'

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
        <p className="text-green-700">Testing 20 size font</p>
        <ModeToggle />
        <Button onClick={() => api.openFile()} disabled={isBusy}>
          Open file
        </Button>
        <Button onClick={onClickMessageBox} disabled={isBusy}>
          Show message box
        </Button>
        <Button onClick={() => api.saveFile()} disabled={isBusy || !data}>
          Save file
        </Button>
        <div style={{ margin: '10px 0' }}>
          {isBusy && <Spinner />}
          {data && <p>File loaded: {data.length} characters</p>}
        </div>
      </div>
      {/* Right column - 2/3 width */}
      <div className="main">
        <Textarea value={data || ''} onChange={(e) => dispatch('app.setData', e.target.value)} />
      </div>
    </div>
  )
}
