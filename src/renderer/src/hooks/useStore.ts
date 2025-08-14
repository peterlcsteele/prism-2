import { createUseStore } from '@zubridge/electron'
import type { RootState } from '@types'

// Create a hook to access the store
export const useStore = createUseStore<RootState>()
