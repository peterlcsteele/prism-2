import electronLogo from './assets/electron.svg'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, setData } from '@shared/store'
import { showCustomDialog } from './services'
import { useMenuEvents } from './hooks/useMenuEvents'
import { useFileOperations } from './hooks/useFileOperations'
function App(): React.JSX.Element {
  const dispatch = useDispatch()
  const { data, isBusy } = useSelector((state: RootState) => state.app)

  // Custom hooks handle all the complex logic
  useMenuEvents()
  const { openFile, saveFile, closeFile } = useFileOperations()
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
      <div className="sidebar">
        <img alt="logo" className="logo" src={electronLogo} width={80} height={80} />
        <button onClick={() => openFile()} disabled={isBusy}>
          Open file
        </button>
        <button onClick={onClickMessageBox} disabled={isBusy}>
          Show message box
        </button>
        <button onClick={() => saveFile()} disabled={isBusy || !data}>
          Save file
        </button>
        <button onClick={() => closeFile()} disabled={isBusy || !data}>
          Close file
        </button>
        <div style={{ margin: '10px 0' }}>
          {isBusy && <p>Loading...</p>}
          {data && <p>File loaded: {data.length} characters</p>}
        </div>
      </div>
      {/* Right column - 2/3 width */}
      <div className="main">
        <textarea
          value={data || ''}
          onChange={(e) => dispatch(setData(e.target.value))}
          placeholder="Type here or open a file..."
        />
      </div>
    </div>
  )
}

export default App
