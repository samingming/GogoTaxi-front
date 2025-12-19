import { computed, ref, watch } from 'vue'
import type { RoomPreview } from '@/types/rooms'
import type { DispatchAnalysis } from '@/api/ride'
import type { ReceiptAnalysis } from '@/services/receiptService'
import { getCurrentUser } from '@/services/auth'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const STORAGE_KEY = 'gtx_room_memberships'
const HISTORY_STORAGE_KEY = 'gtx_room_history'

type DispatchSnapshot = {
  analysis: DispatchAnalysis | null
  message: string
  holdResult: { perHead: number; collectedFrom: number } | null
  holdError: string
  completedAt?: string
}

type SettlementSnapshot = {
  analysis: ReceiptAnalysis | null
  completedAt?: string
  fileName?: string
}

function cloneDispatchSnapshot(snapshot?: DispatchSnapshot) {
  if (!snapshot) return undefined
  return {
    ...snapshot,
    analysis: snapshot.analysis ? { ...snapshot.analysis } : null,
    holdResult: snapshot.holdResult ? { ...snapshot.holdResult } : null,
  }
}

function cloneSettlementSnapshot(snapshot?: SettlementSnapshot) {
  if (!snapshot) return undefined
  return {
    ...snapshot,
    analysis: snapshot.analysis ? { ...snapshot.analysis } : null,
  }
}

export type JoinedRoomEntry = {
  roomId: string
  joinedAt: string
  seatNumber: number | null
  role?: string
  roomSnapshot: RoomPreview
  dispatchSnapshot?: DispatchSnapshot
  settlementSnapshot?: SettlementSnapshot
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

export type CompletedRoomEntry = {
  roomId: string
  completedAt: string
  roomSnapshot: RoomPreview
  settlementSnapshot: SettlementSnapshot | null | undefined
  dispatchSnapshot?: DispatchSnapshot
}

type HistoryBucket = Record<string, CompletedRoomEntry[]>

function readHistoryBucket(): HistoryBucket {
  const storage = getStorage()
  const raw = storage.getItem(HISTORY_STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as HistoryBucket
  } catch {
    return {}
  }
}

function writeHistoryBucket(next: HistoryBucket) {
  const storage = getStorage()
  if (Object.keys(next).length === 0) {
    storage.removeItem(HISTORY_STORAGE_KEY)
    return
  }
  storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next))
}

function currentUserKey() {
  return getCurrentUser()?.id ?? 'guest'
}

function loadInitialMemberships(): JoinedRoomEntry[] {
  const bucket = readBucket()
  return bucket[currentUserKey()] ?? []
}

function cloneCompletedEntry(entry: CompletedRoomEntry): CompletedRoomEntry {
  return {
    roomId: entry.roomId,
    completedAt: entry.completedAt,
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
    settlementSnapshot: cloneSettlementSnapshot(entry.settlementSnapshot ?? undefined) ?? null,
    dispatchSnapshot: entry.dispatchSnapshot ? cloneDispatchSnapshot(entry.dispatchSnapshot) : undefined,
  }
}

function loadInitialHistory(): CompletedRoomEntry[] {
  const bucket = readHistoryBucket()
  return bucket[currentUserKey()]?.map(cloneCompletedEntry) ?? []
}

const joinedRooms = ref<JoinedRoomEntry[]>(loadInitialMemberships())
const activeRoomId = ref<string | null>(joinedRooms.value[0]?.roomId ?? null)
const completedRooms = ref<CompletedRoomEntry[]>(loadInitialHistory())

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
    ...(entry.dispatchSnapshot ? { dispatchSnapshot: cloneDispatchSnapshot(entry.dispatchSnapshot) } : {}),
    ...(entry.settlementSnapshot
      ? { settlementSnapshot: cloneSettlementSnapshot(entry.settlementSnapshot) }
      : {}),
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

function persistHistory() {
  const bucket = readHistoryBucket()
  const key = currentUserKey()
  if (completedRooms.value.length === 0) {
    if (bucket[key]) {
      delete bucket[key]
      writeHistoryBucket(bucket)
    } else if (Object.keys(bucket).length === 0) {
      getStorage().removeItem(HISTORY_STORAGE_KEY)
    }
    return
  }
  bucket[key] = completedRooms.value.map(cloneCompletedEntry)
  writeHistoryBucket(bucket)
}

watch(
  joinedRooms,
  () => {
    persistMemberships()
  },
  { deep: true },
)

watch(
  completedRooms,
  () => {
    persistHistory()
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
  const existingDispatchSnapshots = new Map(
    joinedRooms.value.map(entry => [entry.roomId, entry.dispatchSnapshot]),
  )
  const existingSettlementSnapshots = new Map(
    joinedRooms.value.map(entry => [entry.roomId, entry.settlementSnapshot]),
  )
  const completedIds = new Set(completedRooms.value.map(entry => entry.roomId))
  joinedRooms.value = entries
    .filter(entry => !completedIds.has(entry.roomId))
    .map(entry => {
      const cloned = cloneEntry(entry)
      if (!cloned.dispatchSnapshot) {
        const snapshot = existingDispatchSnapshots.get(cloned.roomId)
        if (snapshot) {
          cloned.dispatchSnapshot = cloneDispatchSnapshot(snapshot)
        }
      }
      if (!cloned.settlementSnapshot) {
        const settlement = existingSettlementSnapshots.get(cloned.roomId)
        if (settlement) {
          cloned.settlementSnapshot = cloneSettlementSnapshot(settlement)
        }
      }
      return cloned
    })
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

function syncDispatchSnapshot(roomId: string, snapshot: DispatchSnapshot | null | undefined) {
  const target = joinedRooms.value.find(entry => entry.roomId === roomId)
  if (!target) return
  if (snapshot) {
    target.dispatchSnapshot = cloneDispatchSnapshot(snapshot)
    if (target.roomSnapshot) {
      if (!target.roomSnapshot.status || target.roomSnapshot.status === 'recruiting') {
        target.roomSnapshot = {
          ...target.roomSnapshot,
          status: 'driver_assigned',
        }
      }
    }
  } else if (target.dispatchSnapshot) {
    delete target.dispatchSnapshot
  }
}

function syncSettlementSnapshot(roomId: string, snapshot: SettlementSnapshot | null | undefined) {
  const target = joinedRooms.value.find(entry => entry.roomId === roomId)
  if (!target) return
  if (snapshot) {
    target.settlementSnapshot = cloneSettlementSnapshot(snapshot)
    if (snapshot.analysis) {
      completeRoom(roomId, snapshot.completedAt)
      return
    }
  } else if (target.settlementSnapshot) {
    delete target.settlementSnapshot
  }
}

function completeRoom(roomId: string, completedAt?: string) {
  const index = joinedRooms.value.findIndex(entry => entry.roomId === roomId)
  if (index === -1) return
  const [entry] = joinedRooms.value.splice(index, 1)
  if (!entry) return
  const historyEntry: CompletedRoomEntry = {
    roomId: entry.roomId,
    completedAt: completedAt ?? new Date().toISOString(),
    roomSnapshot: entry.roomSnapshot,
    settlementSnapshot: entry.settlementSnapshot
      ? cloneSettlementSnapshot(entry.settlementSnapshot)
      : null,
    dispatchSnapshot: entry.dispatchSnapshot ? cloneDispatchSnapshot(entry.dispatchSnapshot) : undefined,
  }
  completedRooms.value = [
    cloneCompletedEntry(historyEntry),
    ...completedRooms.value.filter(record => record.roomId !== roomId),
  ]
  if (activeRoomId.value === roomId) {
    activeRoomId.value = joinedRooms.value[0]?.roomId ?? null
  }
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
    completedRooms,
    hasJoinedRoom: computed(() => joinedRooms.value.length > 0),
    joinRoom,
    leaveRoom,
    updateSeat,
    setActiveRoom,
    replaceRooms,
    syncRoomSnapshot,
    syncDispatchSnapshot,
    syncSettlementSnapshot,
    completeRoom,
  }
}
