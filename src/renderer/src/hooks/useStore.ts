import { createUseStore } from '@zubridge/electron'
import type { StoreState } from '@shared/types'

export const useStore = createUseStore<StoreState>()
