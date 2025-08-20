import { createZustandBridge } from '@zubridge/electron/main'
import { store } from './store'

// Export bridge instance and helpers
export const bridge = createZustandBridge(store)

// Zustand
// const { unsubscribe, dispatch } = createReduxBridge(store, [mainWindow], { handlers })
// const { unsubscribe, dispatch } = createZustandBridge(store, [mainWindow], { handlers })
