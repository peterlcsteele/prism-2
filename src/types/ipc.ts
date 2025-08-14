// IPC-related interfaces (moved from src/shared/types/ipc.ts)
export interface DownloadParams {
  url: string
  saveAs: string
}

export interface UnzipParams {
  zipPath: string
  unzipPath: string
}

export interface ZipParams {
  dirPath: string
  zipPath: string
}

export interface ReadFileParams {
  path: string
  encoding?: string
}

export interface WriteFileParams {
  path: string
  data: string
  encoding?: string
}

export interface MenuState {
  hasData: boolean
  isBusy: boolean
}

export interface Channels {
  'app:get-version': {
    request: void
    response: string
  }
}
