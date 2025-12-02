const SOCKET_IO_CDN = 'https://cdn.socket.io/4.8.1/socket.io.esm.min.js'

type SocketEventArgs = unknown[]

export type Socket = {
  on(event: string, callback: (...args: SocketEventArgs) => void): Socket
  off(event: string, callback?: (...args: SocketEventArgs) => void): Socket
  emit(event: string, ...args: SocketEventArgs): Socket
  disconnect(): void
  connect(): void
  connected: boolean
}

export type SocketIoModule = {
  io: (url: string, options?: Record<string, unknown>) => Socket
}

let modulePromise: Promise<SocketIoModule> | null = null

async function loadSocketIo(): Promise<SocketIoModule> {
  if (!modulePromise) {
    modulePromise = import(/* @vite-ignore */ SOCKET_IO_CDN) as Promise<SocketIoModule>
  }
  return modulePromise
}

export async function getSocketIoModule() {
  return loadSocketIo()
}
