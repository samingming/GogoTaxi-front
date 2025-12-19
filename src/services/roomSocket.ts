import type { RoomParticipant } from '@/api/rooms'
import type { RoomPreview } from '@/types/rooms'
import { getSocketIoModule } from './socketLoader'

export type RoomsRefreshPayload = {
  roomId: string | null
  reason: string
  at?: string
}

export type RoomRealtimeHandlers = {
  onRoomUpdated?: (patch: RoomRealtimePatch) => void
  onParticipantsUpdated?: (participants: RoomParticipant[]) => void
  onRoomsRefresh?: (payload: RoomsRefreshPayload) => void
  onError?: (message: string) => void
}

export type RoomRealtimePatch = Partial<
  Pick<RoomPreview, 'title' | 'eta' | 'fare' | 'status' | 'taxi' | 'departure' | 'arrival'>
> & { id?: string; roomId?: string }

type ParticipantPayload = { roomId?: string; participants?: RoomParticipant[] } | RoomParticipant[]

export async function connectRoomChannel(
  roomId: string,
  handlers: RoomRealtimeHandlers,
  options: { token?: string } = {},
) {
  const endpoint = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL
  if (!endpoint) {
    handlers.onError?.('소켓 서버 주소가 설정되지 않았어요.')
    return () => {}
  }

  try {
    const { io } = await getSocketIoModule()
    const socket = io(endpoint, {
      transports: ['websocket', 'polling'],
      auth: options.token ? { token: options.token } : undefined,
    })

    const joinPayload = roomId
    socket.emit('room:subscribe', joinPayload)

    const handleRoomUpdate = (...args: unknown[]) => {
      const [payload] = args
      if (!isRoomRealtimePatch(payload)) return
      if (payload.roomId && payload.roomId !== roomId) return
      handlers.onRoomUpdated?.(payload)
    }

    const handleParticipants = (...args: unknown[]) => {
      const [payload] = args
      if (!isParticipantPayload(payload)) return
      const participants = Array.isArray(payload) ? payload : payload.participants
      const payloadRoomId = Array.isArray(payload) ? undefined : payload.roomId
      if (payloadRoomId && payloadRoomId !== roomId) return
      if (participants) {
        handlers.onParticipantsUpdated?.(participants)
      }
    }

    const handleRoomsRefresh = (...args: unknown[]) => {
      const [payload] = args
      if (!isRoomsRefreshPayload(payload)) return
      if (payload.roomId && payload.roomId !== roomId) return
      handlers.onRoomsRefresh?.({
        roomId: (payload.roomId as string | null | undefined) ?? null,
        reason: (payload.reason as string | undefined) ?? 'changed',
        at: typeof payload.at === 'string' ? payload.at : undefined,
      })
    }

    const handleError = (...args: unknown[]) => {
      const [error] = args
      const message =
        error instanceof Error ? error.message : typeof error === 'string' ? error : '알 수 없는 오류가 발생했어요.'
      handlers.onError?.(message)
    }

    socket.on('room:update', handleRoomUpdate)
    socket.on('room:participants', handleParticipants)
    socket.on('rooms:refresh', handleRoomsRefresh)
    socket.on('error', handleError)
    socket.on('connect_error', handleError)

    return () => {
      socket.emit('room:unsubscribe', joinPayload)
      socket.off('room:update', handleRoomUpdate)
      socket.off('room:participants', handleParticipants)
      socket.off('rooms:refresh', handleRoomsRefresh)
      socket.off('error', handleError)
      socket.off('connect_error', handleError)
      socket.disconnect()
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '소켓 연결에 실패했어요.'
    handlers.onError?.(message)
    return () => {}
  }
}

function isRoomRealtimePatch(value: unknown): value is RoomRealtimePatch {
  return typeof value === 'object' && value !== null
}

function isParticipantPayload(value: unknown): value is ParticipantPayload {
  if (Array.isArray(value)) return true
  if (typeof value !== 'object' || value === null) return false
  const maybe = value as { participants?: unknown }
  return !maybe.participants || Array.isArray(maybe.participants)
}

function isRoomsRefreshPayload(value: unknown): value is RoomsRefreshPayload {
  if (typeof value !== 'object' || value === null) return false
  const payload = value as Record<string, unknown>
  const { roomId, reason } = payload
  const validRoomId = roomId === null || roomId === undefined || typeof roomId === 'string'
  const validReason = typeof reason === 'string' || reason === undefined
  return validRoomId && validReason
}

export async function connectRoomsRefresh(
  handler: (payload: RoomsRefreshPayload) => void,
  options: { token?: string } = {},
) {
  const endpoint = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL
  if (!endpoint) {
    return () => {}
  }
  try {
    const { io } = await getSocketIoModule()
    const socket = io(endpoint, {
      transports: ['websocket', 'polling'],
      auth: options.token ? { token: options.token } : undefined,
    })

    const handleRefresh = (...args: unknown[]) => {
      const [payload] = args
      if (!isRoomsRefreshPayload(payload)) return
      handler({
        roomId: (payload.roomId as string | null | undefined) ?? null,
        reason: (payload.reason as string | undefined) ?? 'changed',
        at: typeof payload.at === 'string' ? payload.at : undefined,
      })
    }

    socket.on('rooms:refresh', handleRefresh)
    return () => {
      socket.off('rooms:refresh', handleRefresh)
      socket.disconnect()
    }
  } catch {
    return () => {}
  }
}
