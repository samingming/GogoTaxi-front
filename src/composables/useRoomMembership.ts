import { computed, ref, watch } from 'vue'
import type { RoomPreview } from '@/types/rooms'
import { getCurrentUser } from '@/services/auth'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const STORAGE_KEY = 'gtx_room_memberships'

export type JoinedRoomEntry = {
  roomId: string
  joinedAt: string
  seatNumber: number | null
  role?: string
  roomSnapshot: RoomPreview
}

type MembershipBucket = Record<string, JoinedRoomEntry[]>

const memoryStorage: StorageLike = (() => {
  const map = new Map<string, string>()
  return {
    getItem(key) {
      return map.has(key) ? map.get(key)! : null
    },
    setItem(key, value) {
      map.set(key, value)
    },
    removeItem(key) {
      map.delete(key)
    },
  }
})()

function getStorage(): StorageLike {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  return memoryStorage
}

function readBucket(): MembershipBucket {
  const storage = getStorage()
  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as MembershipBucket
  } catch {
    return {}
  }
}

function writeBucket(next: MembershipBucket) {
  const storage = getStorage()
  if (Object.keys(next).length === 0) {
    storage.removeItem(STORAGE_KEY)
    return
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(next))
}

function currentUserKey() {
  return getCurrentUser()?.id ?? 'guest'
}

function loadInitialMemberships(): JoinedRoomEntry[] {
  const bucket = readBucket()
  return bucket[currentUserKey()] ?? []
}

const joinedRooms = ref<JoinedRoomEntry[]>(loadInitialMemberships())
const activeRoomId = ref<string | null>(joinedRooms.value[0]?.roomId ?? null)

function cloneEntry(entry: JoinedRoomEntry): JoinedRoomEntry {
  return {
    roomId: entry.roomId,
    joinedAt: entry.joinedAt,
    seatNumber: entry.seatNumber,
    role: entry.role,
    roomSnapshot: {
      ...entry.roomSnapshot,
      departure: {
        ...entry.roomSnapshot.departure,
        position: { ...entry.roomSnapshot.departure.position },
      },
      arrival: {
        ...entry.roomSnapshot.arrival,
        position: { ...entry.roomSnapshot.arrival.position },
      },
      tags: [...(entry.roomSnapshot.tags ?? [])],
    },
  }
}

function persistMemberships() {
  const bucket = readBucket()
  const key = currentUserKey()
  if (joinedRooms.value.length === 0) {
    if (bucket[key]) {
      delete bucket[key]
      writeBucket(bucket)
    } else if (Object.keys(bucket).length === 0) {
      getStorage().removeItem(STORAGE_KEY)
    }
    return
  }
  bucket[key] = joinedRooms.value
  writeBucket(bucket)
}

watch(
  joinedRooms,
  () => {
    persistMemberships()
  },
  { deep: true },
)

function joinRoom(room: RoomPreview) {
  const now = new Date().toISOString()
  const existing = joinedRooms.value.find(entry => entry.roomId === room.id)
  if (existing) {
    existing.joinedAt = now
    existing.roomSnapshot = room
    activeRoomId.value = room.id
    return
  }
  joinedRooms.value = [
    {
      roomId: room.id,
      joinedAt: now,
      seatNumber: null,
      role: undefined,
      roomSnapshot: room,
    },
    ...joinedRooms.value,
  ]
  activeRoomId.value = room.id
}

function updateSeat(roomId: string, seatNumber: number | null) {
  const target = joinedRooms.value.find(entry => entry.roomId === roomId)
  if (!target) return
  target.seatNumber = seatNumber
}

function leaveRoom(roomId: string) {
  joinedRooms.value = joinedRooms.value.filter(entry => entry.roomId !== roomId)
  if (activeRoomId.value === roomId) {
    activeRoomId.value = joinedRooms.value[0]?.roomId ?? null
  }
}

function setActiveRoom(roomId: string) {
  if (joinedRooms.value.some(entry => entry.roomId === roomId)) {
    activeRoomId.value = roomId
  }
}

function replaceRooms(entries: JoinedRoomEntry[]) {
  if (!Array.isArray(entries)) return
  joinedRooms.value = entries.map(cloneEntry)
  if (!joinedRooms.value.some(entry => entry.roomId === activeRoomId.value)) {
    activeRoomId.value = joinedRooms.value[0]?.roomId ?? null
  }
}

function syncRoomSnapshot(roomId: string, nextSnapshot: RoomPreview | null | undefined) {
  if (!nextSnapshot) return
  const target = joinedRooms.value.find(entry => entry.roomId === roomId)
  if (!target) return
  target.roomSnapshot = nextSnapshot
}

export function useRoomMembership() {
  const activeRoom = computed(() =>
    activeRoomId.value
      ? joinedRooms.value.find(entry => entry.roomId === activeRoomId.value) ?? null
      : null,
  )

  return {
    joinedRooms,
    activeRoomId,
    activeRoom,
    hasJoinedRoom: computed(() => joinedRooms.value.length > 0),
    joinRoom,
    leaveRoom,
    updateSeat,
    setActiveRoom,
    replaceRooms,
    syncRoomSnapshot,
  }
}
