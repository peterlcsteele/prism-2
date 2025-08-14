import { stateSyncEnhancer } from 'electron-redux/renderer'
import { createStore } from '@shared/store/base'

export const store = createStore(stateSyncEnhancer())
