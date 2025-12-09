import type { JoinedRoomEntry } from '@/composables/useRoomMembership'
import type { CreateRoomPayload } from '@/api/rooms'
import type { RoomParticipant, RoomPreview } from '@/types/rooms'
import { getCurrentUser } from '@/services/auth'

const baseRooms: RoomPreview[] = [
  {
    id: 'mock-room-1',
    title: '서울역 → 김포공항 새벽 셔틀',
    departure: { label: '서울역 1번 출구', position: { lat: 37.5551, lng: 126.9723 } },
    arrival: { label: '김포공항 국내선', position: { lat: 37.561, lng: 126.8015 } },
    time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    seats: 4,
    capacity: 4,
    filled: 2,
    tags: ['공항', '새벽'],
    fare: 26000,
    status: 'recruiting',
  },
  {
    id: 'mock-room-2',
    title: '판교 테크노밸리 → 인천국제공항',
    departure: { label: '판교역 1번 출구', position: { lat: 37.3943, lng: 127.1107 } },
    arrival: { label: '인천공항 제2터미널', position: { lat: 37.4602, lng: 126.4407 } },
    time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    seats: 4,
    capacity: 4,
    filled: 3,
    tags: ['업무', '공항'],
    fare: 47000,
    status: 'dispatching',
  },
  {
    id: 'mock-room-3',
    title: '홍대입구역 → 여의도 IFC',
    departure: { label: '홍대입구역 8번 출구', position: { lat: 37.5563, lng: 126.9196 } },
    arrival: { label: '여의도 IFC몰', position: { lat: 37.5258, lng: 126.9254 } },
    time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    seats: 4,
    capacity: 4,
    filled: 4,
    tags: ['야근', '업무'],
    fare: 18000,
    status: 'success',
  },
]

let mockRooms: RoomPreview[] = baseRooms.map(room => cloneRoom(room))

let mockMemberships: JoinedRoomEntry[] = [
  {
    roomId: mockRooms[0].id,
    joinedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    seatNumber: 2,
    roomSnapshot: cloneRoom(mockRooms[0]),
  },
  {
    roomId: mockRooms[1].id,
    joinedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    seatNumber: null,
    roomSnapshot: cloneRoom(mockRooms[1]),
  },
]

const participantSeed: Record<string, RoomParticipant[]> = {
  [mockRooms[0].id]: [
    { id: 'host-1', name: '이방장', seatNumber: 1, role: 'HOST', status: '확정' },
    { id: 'guest-1', name: '김참가', seatNumber: 2, status: '확정' },
  ],
  [mockRooms[1].id]: [
    { id: 'host-2', name: '정방장', seatNumber: 1, role: 'HOST', status: '대기' },
    { id: 'guest-2', name: '홍길동', seatNumber: 3, status: '확정' },
  ],
}

const mockParticipants: Record<string, RoomParticipant[]> = Object.fromEntries(
  Object.entries(participantSeed).map(([roomId, list]) => [roomId, list.map(cloneParticipant)]),
)

const delay = <T>(value: T, ms = 300) => new Promise<T>(resolve => setTimeout(() => resolve(value), ms))

function cloneRoom(room: RoomPreview): RoomPreview {
  return {
    ...room,
    departure: {
      ...room.departure,
      position: { ...room.departure.position },
    },
    arrival: {
      ...room.arrival,
      position: { ...room.arrival.position },
    },
    tags: [...room.tags],
  }
}

function cloneMembership(entry: JoinedRoomEntry): JoinedRoomEntry {
  return {
    roomId: entry.roomId,
    joinedAt: entry.joinedAt,
    seatNumber: entry.seatNumber,
    roomSnapshot: cloneRoom(entry.roomSnapshot),
  }
}

function cloneParticipant(member: RoomParticipant): RoomParticipant {
  return { ...member }
}

function ensureRoom(roomId: string): RoomPreview {
  const target = mockRooms.find(room => room.id === roomId)
  if (!target) {
    throw new Error('해당 방을 찾을 수 없어요.')
  }
  return target
}

export async function mockFetchMyRooms(): Promise<JoinedRoomEntry[]> {
  return delay(mockMemberships.map(cloneMembership))
}

export async function mockFetchAvailableRooms(): Promise<RoomPreview[]> {
  return delay(mockRooms.map(cloneRoom))
}

export async function mockCreateRoom(payload: CreateRoomPayload): Promise<RoomPreview> {
  const id = `mock-room-${Date.now()}`
  const departureLabel = payload.departure?.label || payload.departureLabel || '출발지 미정'
  const arrivalLabel = payload.arrival?.label || payload.arrivalLabel || '도착지 미정'
  const newRoom: RoomPreview = {
    id,
    title: payload.title || `${departureLabel} → ${arrivalLabel}`,
    departure: {
      label: departureLabel,
      position: payload.departure?.position ?? {
        lat: payload.departure?.lat ?? 37.5665,
        lng: payload.departure?.lng ?? 126.978,
      },
    },
    arrival: {
      label: arrivalLabel,
      position: payload.arrival?.position ?? {
        lat: payload.arrival?.lat ?? 37.4602,
        lng: payload.arrival?.lng ?? 126.4407,
      },
    },
    time: payload.time || payload.departureTime || new Date().toISOString(),
    seats: payload.seats ?? payload.capacity ?? 4,
    capacity: payload.capacity ?? payload.seats ?? 4,
    filled: payload.filled ?? 1,
    tags: payload.tags ?? [],
    fare: payload.fare ?? payload.estimatedFare ?? 20000,
    status: 'recruiting',
  }
  mockRooms = [newRoom, ...mockRooms]
  mockParticipants[id] = [
    {
      id: getCurrentUser()?.id ?? 'mock-host',
      name: getCurrentUser()?.name ?? '내가 방장',
      seatNumber: 1,
      role: 'HOST',
      status: '확정',
    },
  ]
  return delay(cloneRoom(newRoom))
}

export async function mockFetchRoomDetail(roomId: string) {
  const room = ensureRoom(roomId)
  const participants = mockParticipants[roomId] ?? []
  return delay({
    room: cloneRoom(room),
    participants: participants.map(cloneParticipant),
  })
}

export async function mockLeaveRoom(roomId: string) {
  mockMemberships = mockMemberships.filter(entry => entry.roomId !== roomId)
  const participants = mockParticipants[roomId]
  if (participants) {
    const currentId = getCurrentUser()?.id
    if (currentId) {
      mockParticipants[roomId] = participants.filter(member => member.id !== currentId)
    }
  }
  await delay(null)
}

export async function mockJoinRoom(roomId: string, seatNumber?: number | null) {
  const room = ensureRoom(roomId)
  const now = new Date().toISOString()
  const snapshot = cloneRoom(room)
  const existing = mockMemberships.find(entry => entry.roomId === roomId)
  const seatValue = typeof seatNumber === 'number' ? seatNumber : null
  if (existing) {
    existing.joinedAt = now
    existing.seatNumber = seatValue
    existing.roomSnapshot = snapshot
  } else {
    mockMemberships.unshift({
      roomId,
      joinedAt: now,
      seatNumber: seatValue,
      roomSnapshot: snapshot,
    })
  }
  if (seatValue !== null) {
    room.filled = Math.min(room.capacity, seatValue)
  }
  const current = getCurrentUser()
  if (current) {
    const members = mockParticipants[roomId] ?? []
    const target = members.find(member => member.id === current.id)
    if (target) {
      target.seatNumber = seatValue
    } else {
      members.push({
        id: current.id,
        name: current.name,
        seatNumber: seatValue,
        status: seatValue ? '확정' : '대기',
      })
    }
    mockParticipants[roomId] = members
  }
  await delay(null)
}
