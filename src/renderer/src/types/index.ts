export interface TerminalMessage {
  timestamp: string
  color: string
  text: string
}

export interface DriveErrorMessage {
  message: string
  plural: string
}

export interface Drive {
  isDisabled: boolean
  title: string
  message: string
}
