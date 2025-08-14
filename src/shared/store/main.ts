import { stateSyncEnhancer } from 'electron-redux/main'
import { createStore } from '@shared/store/base'

export const store = createStore(stateSyncEnhancer())
