import { isAxiosError } from 'axios'
import { apiClient } from './client'
import type { RoomPreview } from '@/types/rooms'
import type { JoinedRoomEntry } from '@/composables/useRoomMembership'

type RawRoom = Record<string, unknown>

const CUSTOM_ENDPOINT = import.meta.env.VITE_MY_ROOMS_PATH?.trim()
const ROOMS_ENDPOINT = import.meta.env.VITE_ROOMS_PATH?.trim() || '/api/rooms'
const MY_ROOMS_ENDPOINT = CUSTOM_ENDPOINT || ROOMS_ENDPOINT
const ROOM_DETAIL_PATH = import.meta.env.VITE_ROOM_DETAIL_PATH?.trim() || '/api/rooms'
const LEAVE_TEMPLATE =
  import.meta.env.VITE_ROOM_LEAVE_PATH?.trim() || '/api/rooms/:id/leave'
const LEAVE_METHOD = (import.meta.env.VITE_ROOM_LEAVE_METHOD || 'POST').toUpperCase()
const JOIN_TEMPLATE =
  import.meta.env.VITE_ROOM_JOIN_PATH?.trim() || '/api/rooms/:id/join'
const JOIN_METHOD = (import.meta.env.VITE_ROOM_JOIN_METHOD || 'POST').toUpperCase()
const GOGOTAXI_USER_KEY = 'gogotaxi_user'
const LEGACY_AUTH_USER_KEY = 'auth_user'

const DEFAULT_DEPARTURE = { lat: 37.5665, lng: 126.978 }
const DEFAULT_ARRIVAL = { lat: 37.4602, lng: 126.4407 }

const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
})

export async function fetchMyRooms(): Promise<JoinedRoomEntry[]> {
  if (!import.meta.env.VITE_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL 환경 변수가 설정되어 있지 않아요.')
  }

  try {
    const res = await apiClient.get(MY_ROOMS_ENDPOINT, {
      params: {
        mine: true,
        creatorId: resolveCurrentUserId() ?? undefined,
      },
    })
    const payload = unwrapRoomsPayload(res.data)
    return payload.map((item, index) => normalizeJoinedRoom(item, index))
  } catch (error) {
    throw formatError(error)
  }
}

type FetchRoomsParams = Record<string, string | number | boolean | undefined>

type LocationPayload = {
  label: string
  name?: string
  address?: string
  lat?: number
  lng?: number
  position?: {
    lat: number
    lng: number
  }
}

export type CreateRoomPayload = {
  title: string
  departure: LocationPayload
  arrival: LocationPayload
  departureLabel?: string
  departureLat?: number
  departureLng?: number
  arrivalLabel?: string
  arrivalLat?: number
  arrivalLng?: number
  departureTime?: string
  time?: string
  priority?: string
  paymentMethod?: string
  tags?: string[]
  seats?: number
  capacity?: number
  filled?: number
  fare?: number
  estimatedFare?: number
  estimatedDistanceKm?: number
}

export async function fetchAvailableRooms(params: FetchRoomsParams = {}): Promise<RoomPreview[]> {
  if (!import.meta.env.VITE_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL 환경 변수가 설정되어 있지 않아요.')
  }
  try {
    const res = await apiClient.get(ROOMS_ENDPOINT, { params })
    const payload = unwrapRoomsPayload(res.data)
    return payload.map(item => normalizeRoomPreview(item))
  } catch (error) {
    throw formatError(error)
  }
}

export async function createRoom(payload: CreateRoomPayload): Promise<RoomPreview> {
  if (!import.meta.env.VITE_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL 환경 변수가 설정되어 있지 않아요.')
  }
  try {
    const res = await apiClient.post(ROOMS_ENDPOINT, payload)
    const roomPayload = unwrapSingleRoomPayload(res.data)
    return normalizeRoomPreview(roomPayload)
  } catch (error) {
    throw formatError(error)
  }
}

export type RoomParticipant = {
  id: string
  name: string
  seatNumber: number | null
  role?: string
  status?: string
  joinedAt?: string
  email?: string
}

export async function fetchRoomDetail(roomId: string): Promise<{
  room: RoomPreview
  participants: RoomParticipant[]
}> {
  if (!roomId) {
    throw new Error('방 ID가 필요해요.')
  }
  const url = buildRoomDetailUrl(roomId)
  try {
    const res = await apiClient.get(url)
    return normalizeRoomDetailPayload(res.data, roomId)
  } catch (error) {
    throw formatError(error)
  }
}

export async function leaveRoomFromApi(roomId: string) {
  if (!roomId) {
    throw new Error('방 ID가 필요해요.')
  }
  const url = buildLeaveUrl(roomId)
  try {
    if (LEAVE_METHOD === 'DELETE') {
      await apiClient.delete(url)
      return
    }
    if (LEAVE_METHOD === 'PATCH') {
      await apiClient.patch(url)
      return
    }
    await apiClient.post(url)
  } catch (error) {
    throw formatError(error)
  }
}


export async function joinRoomFromApi(roomId: string, seatNumber?: number | null) {
  if (!roomId) {
    throw new Error('방 ID가 필요해요.')
  }
  const url = buildJoinUrl(roomId)
  const payload: Record<string, unknown> = { roomId }
  if (typeof seatNumber === 'number') {
    payload.seatNumber = seatNumber
  }
  try {
    if (JOIN_METHOD === 'DELETE') {
      await apiClient.delete(url)
      return
    }
    if (JOIN_METHOD === 'PATCH') {
      await apiClient.patch(url, payload)
      return
    }
    await apiClient.post(url, payload)
  } catch (error) {
    throw formatError(error)
  }
}

export async function updateRoomFromApi(
  roomId: string,
  payload: { estimatedFare?: number },
) {
  if (!roomId) {
    throw new Error('방 ID가 필요해요.')
  }
  const url = buildRoomDetailUrl(roomId)
  try {
    await apiClient.patch(url, payload)
  } catch (error) {
    throw formatError(error)
  }
}


function buildLeaveUrl(roomId: string) {
  if (LEAVE_TEMPLATE.includes(':id')) {
    return LEAVE_TEMPLATE.replace(':id', roomId)
  }
  const normalized = LEAVE_TEMPLATE.replace(/\/$/, '')
  return `${normalized}/${roomId}/leave`
}


function buildJoinUrl(roomId: string) {
  if (JOIN_TEMPLATE.includes(':id')) {
    return JOIN_TEMPLATE.replace(':id', roomId)
  }
  if (JOIN_TEMPLATE.includes('{id}')) {
    return JOIN_TEMPLATE.replace('{id}', roomId)
  }
  const normalized = JOIN_TEMPLATE.replace(/\/$/, '')
  if (normalized.endsWith('/join')) {
    return normalized
  }
  return `${normalized}/${roomId}/join`
}

function buildRoomDetailUrl(roomId: string) {
  if (ROOM_DETAIL_PATH.includes(':id')) {
    return ROOM_DETAIL_PATH.replace(':id', roomId)
  }
  const normalized = ROOM_DETAIL_PATH.replace(/\/$/, '')
  return `${normalized}/${roomId}`
}

function resolveCurrentUserId() {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(GOGOTAXI_USER_KEY)
  const legacy = window.localStorage.getItem(LEGACY_AUTH_USER_KEY)

  const candidate = parseUser(stored) ?? parseUser(legacy)
  return candidate?.id ?? null
}

function parseUser(payload: string | null) {
  if (!payload) return null
  try {
    const parsed = JSON.parse(payload) as { id?: string | number }
    if (parsed && (typeof parsed.id === 'string' || typeof parsed.id === 'number')) {
      return { ...parsed, id: String(parsed.id) }
    }
  } catch {
    return null
  }
  return null
}

function unwrapRoomsPayload(payload: unknown): RawRoom[] {
  if (Array.isArray(payload)) return payload as RawRoom[]
  if (payload && typeof payload === 'object') {
    const container = payload as Record<string, unknown>
    const keys = ['rooms', 'data', 'result', 'items', 'content']
    for (const key of keys) {
      const value = container[key]
      if (Array.isArray(value)) return value as RawRoom[]
    }
  }
  return []
}

function unwrapSingleRoomPayload(payload: unknown): RawRoom {
  const container = asRecord(payload)
  if (!container) {
    return (payload && typeof payload === 'object' ? (payload as RawRoom) : {}) as RawRoom
  }
  return (
    asRecord(container.room) ??
    asRecord((asRecord(container.data)?.room as RawRoom) ?? asRecord(container.data)) ??
    asRecord((asRecord(container.result)?.room as RawRoom) ?? asRecord(container.result)) ??
    container
  )
}

function normalizeJoinedRoom(item: unknown, index: number): JoinedRoomEntry {
  const raw = (item && typeof item === 'object' ? (item as RawRoom) : {}) as RawRoom
  const room = normalizeRoomPreview(raw)
  const nestedRoom =
    raw.room && typeof raw.room === 'object' ? (raw.room as RawRoom) : undefined
  const joinedAt =
    pickDateString([
      raw.joinedAt,
      raw.createdAt,
      raw.updatedAt,
      raw.roomJoinedAt,
      nestedRoom?.joinedAt,
    ]) ?? new Date(Date.now() - index * 1000).toISOString()
  const seatNumber = pickNumberOrNull([
    raw.seatNumber,
    raw.mySeatNumber,
    raw.seat,
    raw.reservationSeat,
  ])
  const role = pickString([raw.role, raw.positionName, raw.type, raw.rank])

  return {
    roomId: room.id,
    joinedAt,
    seatNumber,
    role: role ?? undefined,
    roomSnapshot: room,
  }
}

function normalizeRoomDetailPayload(payload: unknown, fallbackId: string) {
  const container = asRecord(payload) ?? {}
  const roomSource =
    asRecord(container.room) ??
    asRecord((asRecord(container.data)?.room as RawRoom) ?? asRecord(container.data)) ??
    asRecord((asRecord(container.result)?.room as RawRoom) ?? asRecord(container.result)) ??
    container
  const room = normalizeRoomPreview({ ...roomSource, id: roomSource.id ?? fallbackId })
  const participants = extractParticipants(container).map((raw, index) =>
    normalizeParticipant(raw, index),
  )
  return { room, participants }
}

function extractParticipants(container: RawRoom): RawRoom[] {
  const sources = [
    container,
    asRecord(container.room),
    asRecord(container.data),
    asRecord(container.result),
    asRecord(container.detail),
    asRecord(container.content),
  ].filter(Boolean) as RawRoom[]
  const keys = ['participants', 'members', 'users', 'entries', 'memberList', 'roomMembers']
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key]
      if (Array.isArray(value)) {
        return value as RawRoom[]
      }
    }
  }
  return []
}

function normalizeParticipant(rawInput: RawRoom, index: number): RoomParticipant {
  const user = asRecord(rawInput.user)
  const profile = asRecord(rawInput.profile)
  const id =
    pickStringOrNumber([rawInput.id, rawInput.userId, rawInput.memberId, user?.id]) ||
    `participant-${index}`
  const name =
    pickString([rawInput.name, rawInput.nickname, user?.name, user?.nickname, profile?.name]) ||
    `참여자 ${index + 1}`
  const seatNumber = pickNumberOrNull([
    rawInput.seatNumber,
    rawInput.seat,
    rawInput.seat_no,
    rawInput.reservationSeat,
    rawInput.position,
  ])
  const role = pickString([rawInput.role, rawInput.positionName, rawInput.type, rawInput.rank])
  const status = pickString([rawInput.status, rawInput.state])
  const joinedAt = pickDateString([rawInput.joinedAt, rawInput.createdAt, rawInput.updatedAt])
  const email = pickString([rawInput.email, user?.email, rawInput.userEmail, profile?.email])

  return {
    id,
    name,
    seatNumber,
    role,
    status,
    joinedAt: joinedAt ?? undefined,
    email: email ?? undefined,
  }
}

function asRecord(value: unknown): RawRoom | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as RawRoom
  }
  return null
}

function normalizeRoomPreview(rawInput: RawRoom): RoomPreview {
  const roomCandidate = extractRoomObject(rawInput)
  const id =
    pickString([rawInput.roomId, roomCandidate.id, roomCandidate.roomId]) ||
    `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const title =
    pickString([roomCandidate.title, roomCandidate.name, rawInput.title, rawInput.name]) ||
    '나의 택시 방'

  const departure = normalizeLocation(roomCandidate, 'departure', DEFAULT_DEPARTURE)
  const arrival = normalizeLocation(roomCandidate, 'arrival', DEFAULT_ARRIVAL)

  const timeRaw = pickString([
    roomCandidate.time,
    roomCandidate.departureTime,
    roomCandidate.startTime,
    rawInput.departureTime,
  ])
  const time = formatTimeLabel(timeRaw)

  const seats = pickNumber(
    [
      roomCandidate.seats,
      roomCandidate.remainingSeats,
      roomCandidate.remainSeats,
      roomCandidate.availableSeats,
    ],
    0,
  )
  const capacity = pickNumber(
    [
      roomCandidate.capacity,
      roomCandidate.maxSeats,
      roomCandidate.totalSeats,
      rawInput.capacity,
      seats ? seats + pickNumber([roomCandidate.filled, roomCandidate.occupiedSeats], 0) : undefined,
    ],
    4,
  )
  const filled = Math.min(
    Math.max(
      pickNumber(
        [
          roomCandidate.filled,
          roomCandidate.occupiedSeats,
          roomCandidate.joinedCount,
          roomCandidate.participants,
        ],
        capacity - seats,
      ),
      0,
    ),
    capacity,
  )

  const tags = normalizeTags(roomCandidate, rawInput)
  const status = mapStatus(roomCandidate.status ?? rawInput.status ?? rawInput.state)
  const eta = pickString([roomCandidate.eta, roomCandidate.estimate])
  const fareValue = pickNumberOrNull([roomCandidate.fare, roomCandidate.estimatedFare])
  const taxi = normalizeTaxi(roomCandidate.taxi ?? rawInput.taxi)

  return {
    id: String(id),
    title,
    departure,
    arrival,
    time,
    seats,
    capacity,
    filled,
    tags,
    status,
    eta,
    fare: typeof fareValue === 'number' ? fareValue : undefined,
    taxi,
  }
}

function extractRoomObject(rawInput: RawRoom): RawRoom {
  const candidate = rawInput.room || rawInput.roomSnapshot
  if (candidate && typeof candidate === 'object') {
    return candidate as RawRoom
  }
  return rawInput
}

function normalizeLocation(
  room: RawRoom,
  type: 'departure' | 'arrival',
  fallback: { lat: number; lng: number },
) {
  const source = room[type]
  const labelCandidates = [
    (source && typeof source === 'object' ? (source as RawRoom).label : null),
    (source && typeof source === 'object' ? (source as RawRoom).name : null),
    room[`${type}Label`],
    room[`${type}Name`],
    room[`${type}Address`],
    room[type],
  ]
  const label =
    pickString(labelCandidates, type === 'departure' ? '출발지 미정' : '도착지 미정') ??
    (type === 'departure' ? '출발지 미정' : '도착지 미정')

  const latCandidates = [
    source && typeof source === 'object' ? (source as RawRoom).lat : null,
    source && typeof source === 'object'
      ? ((source as RawRoom).position as RawRoom)?.lat
      : null,
    room[`${type}Lat`],
    room[`${type}Latitude`],
    room[`${type}_lat`],
  ]
  const lngCandidates = [
    source && typeof source === 'object' ? (source as RawRoom).lng : null,
    source && typeof source === 'object'
      ? ((source as RawRoom).position as RawRoom)?.lng
      : null,
    room[`${type}Lng`],
    room[`${type}Longitude`],
    room[`${type}_lng`],
  ]

  const lat = pickNumber(latCandidates, fallback.lat)
  const lng = pickNumber(lngCandidates, fallback.lng)

  return {
    label,
    position: { lat, lng },
  }
}

function normalizeTags(room: RawRoom, rawInput: RawRoom) {
  const tagsSource = room.tags ?? rawInput.tags
  if (Array.isArray(tagsSource)) {
    return tagsSource.map(tag => String(tag)).filter(Boolean)
  }
  if (typeof tagsSource === 'string' && tagsSource.trim()) {
    return tagsSource
      .split(/[#,]/)
      .map(token => token.trim())
      .filter(Boolean)
  }

  const extra = [room.priority, room.paymentMethod, rawInput.priority, rawInput.category]
    .map(value => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)

  return extra
}

function normalizeTaxi(raw: unknown): RoomPreview['taxi'] | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const taxi = raw as RawRoom
  const carNumber = pickString([taxi.carNumber, taxi.car_no, taxi.plate])
  const driverName = pickString([taxi.driverName, taxi.driver, taxi.captain])
  const carModel = pickString([taxi.carModel, taxi.model])

  if (!carNumber && !driverName && !carModel) return undefined
  return {
    carNumber: carNumber || undefined,
    driverName: driverName || undefined,
    carModel: carModel || undefined,
  }
}

function mapStatus(value: unknown): RoomPreview['status'] | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  const dictionary: Record<string, RoomPreview['status']> = {
    recruiting: 'recruiting',
    recruit: 'recruiting',
    pending: 'recruiting',
    waiting: 'recruiting',
    open: 'recruiting',
    '모집중': 'recruiting',
    '대기': 'recruiting',
    requesting: 'requesting',
    request: 'requesting',
    호출: 'requesting',
    'call-ready': 'requesting',
    matching: 'matching',
    search: 'matching',
    searching: 'matching',
    match: 'matching',
    '매칭중': 'matching',
    dispatching: 'dispatching',
    dispatch: 'dispatching',
    assigned: 'dispatching',
    full: 'dispatching',
    '배차중': 'dispatching',
    driver_assigned: 'driver_assigned',
    assigned_driver: 'driver_assigned',
    accepted: 'driver_assigned',
    '기사배정': 'driver_assigned',
    arriving: 'arriving',
    arrival: 'arriving',
    enroute: 'arriving',
    '오는중': 'arriving',
    aboard: 'aboard',
    riding: 'aboard',
    onboard: 'aboard',
    '탑승': 'aboard',
    success: 'success',
    successed: 'success',
    done: 'success',
    completed: 'success',
    '완료': 'success',
    arrived: 'success',
    closed: 'success',
    failed: 'failed',
    fail: 'failed',
    canceled: 'failed',
    cancelled: 'failed',
    '취소': 'failed',
  }
  return dictionary[normalized]
}

function pickString(values: unknown[], fallback?: string) {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) return trimmed
    }
  }
  return fallback
}

function pickStringOrNumber(values: unknown[], fallback?: string) {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) return trimmed
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value)
    }
  }
  return fallback
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function pickNumber(values: unknown[], fallback: number) {
  for (const value of values) {
    const parsed = parseNumber(value)
    if (parsed !== null) return parsed
  }
  return fallback
}

function pickNumberOrNull(values: unknown[]) {
  for (const value of values) {
    const parsed = parseNumber(value)
    if (parsed !== null) return parsed
  }
  return null
}

function pickDateString(values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      const parsed = new Date(value)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString()
      }
    }
  }
  return null
}

function formatTimeLabel(value?: string) {
  if (!value) return '시간 미정'
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return `${timeFormatter.format(date)} 출발`
  }
  return value
}

function formatError(error: unknown) {
  if (isAxiosError(error)) {
    const message =
      (typeof error.response?.data === 'string' && error.response.data) ||
      (error.response?.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data &&
        String((error.response.data as { message?: unknown }).message)) ||
      error.message
    return new Error(message || '내 방 목록을 불러오지 못했어요.')
  }
  return error instanceof Error
    ? error
    : new Error('내 방 목록을 불러오는 중 문제가 발생했어요.')
}
