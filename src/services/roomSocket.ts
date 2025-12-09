import type { RoomParticipant } from '@/types/rooms'
import type { RoomPreview } from '@/types/rooms'
import { getSocketIoModule } from './socketLoader'

export type RoomRealtimeHandlers = {
  onRoomUpdated?: (patch: RoomRealtimePatch) => void
  onParticipantsUpdated?: (participants: RoomParticipant[]) => void
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

    const joinPayload = { roomId }
    socket.emit('room:join', joinPayload)

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

    const handleError = (...args: unknown[]) => {
      const [error] = args
      const message =
        error instanceof Error ? error.message : typeof error === 'string' ? error : '알 수 없는 오류가 발생했어요.'
      handlers.onError?.(message)
    }

    socket.on('room:update', handleRoomUpdate)
    socket.on('room:participants', handleParticipants)
    socket.on('error', handleError)
    socket.on('connect_error', handleError)

    return () => {
      socket.emit('room:leave', joinPayload)
      socket.off('room:update', handleRoomUpdate)
      socket.off('room:participants', handleParticipants)
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
