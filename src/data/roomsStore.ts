import type { RoomPreview } from '@/types/rooms'

export const ROOMS_STORAGE_KEY = 'gtx_rooms'

const seedRooms: RoomPreview[] = [
  {
    id: 'room-101',
    title: '강남 → 인천공항 야간 합승',
    departure: {
      label: '강남역 5번 출구',
      position: { lat: 37.498095, lng: 127.02761 },
    },
    arrival: {
      label: '인천국제공항 T1',
      position: { lat: 37.4602, lng: 126.4407 },
    },
    time: '오늘 23:30 출발',
    seats: 2,
    capacity: 4,
    filled: 2,
    tags: ['공항', '야간'],
  },
  {
    id: 'room-102',
    title: '홍대입구 → 서현역 출근',
    departure: {
      label: '홍대입구역 9번 출구',
      position: { lat: 37.5575, lng: 126.9242 },
    },
    arrival: {
      label: '서현역 AK플라자',
      position: { lat: 37.3851, lng: 127.1238 },
    },
    time: '내일 07:10 출발',
    seats: 1,
    capacity: 4,
    filled: 3,
    tags: ['출근', '아침'],
  },
  {
    id: 'room-103',
    title: '여의도 → 판교 퇴근길',
    departure: {
      label: '여의도역 5번 출구',
      position: { lat: 37.5219, lng: 126.9241 },
    },
    arrival: {
      label: '판교역 2번 출구',
      position: { lat: 37.3948, lng: 127.1109 },
    },
    time: '오늘 20:00 출발',
    seats: 3,
    capacity: 4,
    filled: 1,
    tags: ['직장인', '조용한분'],
  },
]

function hasWindow() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function cloneRooms(rooms: RoomPreview[]) {
  return rooms.map((room) => ({
    ...room,
    departure: { ...room.departure, position: { ...room.departure.position } },
    arrival: { ...room.arrival, position: { ...room.arrival.position } },
    tags: [...room.tags],
  }))
}

export function loadRooms(): RoomPreview[] {
  if (!hasWindow()) return cloneRooms(seedRooms)
  const storage = window.localStorage
  const raw = storage.getItem(ROOMS_STORAGE_KEY)
  if (!raw) {
    storage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(seedRooms))
    return cloneRooms(seedRooms)
  }
  try {
    const parsed = JSON.parse(raw) as RoomPreview[]
    return cloneRooms(parsed.length ? parsed : seedRooms)
  } catch {
    storage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(seedRooms))
    return cloneRooms(seedRooms)
  }
}

function saveRooms(rooms: RoomPreview[]) {
  if (!hasWindow()) return
  window.localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms))
}

export function addRoom(room: RoomPreview) {
  const rooms = loadRooms()
  rooms.unshift(room)
  saveRooms(rooms)
  return rooms
}
