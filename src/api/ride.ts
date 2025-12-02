import type { RoomLocation } from '@/types/rooms'
import apiClient from '@/services/apiClient'

export type RideStage =
  | 'pending'
  | 'dispatching'
  | 'accepted'
  | 'approaching'
  | 'onboard'
  | 'completed'
  | 'cancelled'

export type RideRequestPayload = {
  pickup: RoomLocation
  dropoff: RoomLocation
  notes?: string
  passengerCount?: number
}

export type RideRequestResponse = {
  requestId?: string
  stage?: RideStage
  deeplink?: string
  deepLink?: string
  appUrl?: string
  url?: string
  createdAt?: string
}

export type RideState = {
  requestId?: string
  stage: RideStage
  driverName?: string
  carModel?: string
  carNumber?: string
  etaMinutes?: number
  updatedAt?: string
}

const REQUEST_TEMPLATE =
  import.meta.env.VITE_RIDE_REQUEST_PATH?.trim() || '/api/rooms/:id/ride/request'
const STAGE_TEMPLATE =
  import.meta.env.VITE_RIDE_STAGE_PATH?.trim() || '/api/rooms/:id/ride/stage'
const STATE_TEMPLATE =
  import.meta.env.VITE_RIDE_STATE_PATH?.trim() || '/api/rooms/:id/ride-state'

export async function requestRide(
  roomId: string,
  payload: RideRequestPayload,
): Promise<RideRequestResponse> {
  const url = buildRideUrl(REQUEST_TEMPLATE, roomId)
  try {
    const res = await apiClient.post(url, payload)
    return normalizeRideRequest(res.data)
  } catch (error) {
    throw normalizeRideError(error, '호출 요청을 저장하지 못했어요.')
  }
}

export async function updateRideStage(
  roomId: string,
  payload: RideState,
): Promise<RideState> {
  const url = buildRideUrl(STAGE_TEMPLATE, roomId)
  try {
    const res = await apiClient.post(url, payload)
    return normalizeRideState(res.data)
  } catch (error) {
    throw normalizeRideError(error, '배차 단계를 갱신하지 못했어요.')
  }
}

export async function fetchRideState(roomId: string): Promise<RideState> {
  const url = buildRideUrl(STATE_TEMPLATE, roomId)
  try {
    const res = await apiClient.get(url)
    return normalizeRideState(res.data)
  } catch (error) {
    throw normalizeRideError(error, '배차 상태를 불러오지 못했어요.')
  }
}

function buildRideUrl(template: string, roomId: string) {
  if (!roomId) throw new Error('방 ID가 필요해요.')
  if (template.includes(':id')) return template.replace(':id', roomId)
  if (template.includes('{id}')) return template.replace('{id}', roomId)
  return `${template.replace(/\/$/, '')}/${roomId}`
}

function normalizeRideRequest(raw: unknown): RideRequestResponse {
  if (raw && typeof raw === 'object') {
    const data = raw as Record<string, unknown>
    const deeplink = pickString(data.deeplink, data.deepLink)
    const url = pickString(data.url)
    const appUrl = pickString((data as Record<string, unknown>).appUrl, (data as Record<string, unknown>).app_url)
    return {
      requestId: pickString(data.requestId, data.id),
      stage: pickStage(data.stage),
      deeplink: deeplink || url || appUrl,
      deepLink: deeplink,
      url,
      appUrl,
      createdAt: pickString(data.createdAt, data.created_at),
    }
  }
  return {}
}

function normalizeRideState(raw: unknown): RideState {
  if (raw && typeof raw === 'object') {
    const data = raw as Record<string, unknown>
    const stage = pickStage(data.stage)
    if (!stage) {
      throw new Error('배차 단계 정보가 없어요.')
    }

    return {
      requestId: pickString(data.requestId, data.id),
      stage,
      driverName: pickString(data.driverName, data.driver_name, data.captain),
      carModel: pickString(data.carModel, data.model),
      carNumber: pickString(data.carNumber, data.plate, data.car_no),
      etaMinutes: pickNumber(data.etaMinutes, data.eta, data.eta_minutes),
      updatedAt: pickString(data.updatedAt, data.updated_at),
    }
  }
  throw new Error('배차 상태를 해석할 수 없어요.')
}

function pickString(...candidates: unknown[]) {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate
    }
  }
  return undefined
}

function pickNumber(...candidates: unknown[]) {
  for (const candidate of candidates) {
    const parsed = typeof candidate === 'string' ? Number(candidate) : candidate
    if (typeof parsed === 'number' && Number.isFinite(parsed)) {
      return parsed
    }
  }
  return undefined
}

function pickStage(value: unknown): RideStage | undefined {
  if (typeof value !== 'string') return undefined
  const stage = value.trim().toLowerCase()
  const dictionary: Record<string, RideStage> = {
    pending: 'pending',
    waiting: 'pending',
    request: 'pending',
    dispatching: 'dispatching',
    searching: 'dispatching',
    matching: 'dispatching',
    accepted: 'accepted',
    assigned: 'accepted',
    approaching: 'approaching',
    enroute: 'approaching',
    onboard: 'onboard',
    riding: 'onboard',
    completed: 'completed',
    done: 'completed',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    failed: 'cancelled',
  }
  return dictionary[stage]
}

function normalizeRideError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return new Error(error.message || fallback)
  }
  if (typeof error === 'string') {
    return new Error(error || fallback)
  }
  return new Error(fallback)
}
