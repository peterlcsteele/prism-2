export interface DownloadParams {
  url: string
  saveAs: string
}

// archive:unzip, archive:zip
export interface UnzipParams {
  zipPath: string
  unzipPath: string
}
export interface ZipParams {
  dirPath: string
  zipPath: string
}

// file:read, file:write
export interface ReadFileParams {
  path: string
  encoding?: string
}
export interface WriteFileParams {
  path: string
  data: string
  encoding?: string
}

// menu: update
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
