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

export type DispatchAnalysis = {
  driverName: string | null
  carNumber: string | null
  carModel: string | null
  summary?: string | null
  rawText?: string | null
  modelLatencyMs?: number
}

export type DispatchAnalysisPayload = {
  imageBase64: string
  mimeType?: string
  prompt?: string
}

export type DispatchAnalysisResult = {
  analysis: DispatchAnalysis | null
  driver?: {
    name: string | null
    carModel: string | null
    carNumber: string | null
  }
  rideState?: RideState | null
  settlementHold?: {
    perHead: number
    collectedFrom: number
  } | null
  settlementHoldError?: {
    code: string
    message: string
  } | null
}

const REQUEST_TEMPLATE =
  import.meta.env.VITE_RIDE_REQUEST_PATH?.trim() || '/api/rooms/:id/ride/request'
const STAGE_TEMPLATE =
  import.meta.env.VITE_RIDE_STAGE_PATH?.trim() || '/api/rooms/:id/ride/stage'
const STATE_TEMPLATE =
  import.meta.env.VITE_RIDE_STATE_PATH?.trim() || '/api/rooms/:id/ride-state'
const DISPATCH_TEMPLATE =
  import.meta.env.VITE_RIDE_DISPATCH_INFO_PATH?.trim() || '/api/rooms/:id/ride/dispatch-info'

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
    return normalizeRideState(res.data?.rideState ?? res.data)
  } catch (error) {
    throw normalizeRideError(error, '배차 상태를 불러오지 못했어요.')
  }
}

export async function analyzeDispatchScreenshot(
  roomId: string,
  payload: DispatchAnalysisPayload,
): Promise<DispatchAnalysisResult> {
  const url = buildRideUrl(DISPATCH_TEMPLATE, roomId)
  try {
    const res = await apiClient.post(url, payload)
    const rideState = res.data?.rideState ? normalizeRideState(res.data.rideState) : undefined
    return {
      analysis: normalizeDispatchAnalysis(res.data?.analysis),
      driver: normalizeDriver(res.data?.driver),
      rideState,
      settlementHold: normalizeSettlementHold(res.data?.settlementHold),
      settlementHoldError: normalizeSettlementError(res.data?.settlementHoldError),
    }
  } catch (error) {
    throw normalizeRideError(error, '스크린샷을 분석하지 못했어요.')
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
  const payload = extractRideStatePayload(raw)
  if (payload && typeof payload === 'object') {
    const data = payload as Record<string, unknown>
    const stage = pickStage(data.stage)
    if (!stage) {
      throw new Error('배차 단계 정보가 없어요.')
    }

    return {
      requestId: pickString(data.requestId, data.id),
      stage,
      driverName: pickString(
        data.driverName,
        data.driver_name,
        data.captain,
        (data.driver as Record<string, unknown> | undefined)?.name,
        (data.driver as Record<string, unknown> | undefined)?.driverName,
        (data.driver as Record<string, unknown> | undefined)?.driver_name,
      ),
      carModel: pickString(
        data.carModel,
        data.model,
        (data.driver as Record<string, unknown> | undefined)?.carModel,
        (data.driver as Record<string, unknown> | undefined)?.car_model,
      ),
      carNumber: pickString(
        data.carNumber,
        data.plate,
        data.car_no,
        (data.driver as Record<string, unknown> | undefined)?.carNumber,
        (data.driver as Record<string, unknown> | undefined)?.car_no,
      ),
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
    idle: 'pending',
    requesting: 'pending',
    deeplink_ready: 'pending',
    dispatching: 'dispatching',
    searching: 'dispatching',
    matching: 'dispatching',
    accepted: 'accepted',
    assigned: 'accepted',
    driver_assigned: 'accepted',
    approaching: 'approaching',
    enroute: 'approaching',
    arriving: 'approaching',
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

function extractRideStatePayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw
  const candidate = raw as {
    rideState?: unknown
    ride_state?: unknown
  }
  if (candidate.rideState && typeof candidate.rideState === 'object') {
    return candidate.rideState
  }
  if (candidate.ride_state && typeof candidate.ride_state === 'object') {
    return candidate.ride_state
  }
  return raw
}

function normalizeDispatchAnalysis(raw: unknown): DispatchAnalysis | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Record<string, unknown>
  return {
    driverName: pickNullableString(data.driverName),
    carNumber: pickNullableString(data.carNumber),
    carModel: pickNullableString(data.carModel),
    summary: pickNullableString(data.summary),
    rawText: pickNullableString(data.rawText),
    modelLatencyMs: typeof data.modelLatencyMs === 'number' ? data.modelLatencyMs : undefined,
  }
}

function normalizeDriver(raw: unknown) {
  if (!raw || typeof raw !== 'object') return undefined
  const data = raw as Record<string, unknown>
  return {
    name: pickNullableString(data.name),
    carModel: pickNullableString(data.carModel),
    carNumber: pickNullableString(data.carNumber),
  }
}

function normalizeSettlementHold(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Record<string, unknown>
  const perHead = pickNumber(data.perHead, data.per_head)
  const collectedFrom = pickNumber(data.collectedFrom, data.collected_from)
  if (perHead == null || collectedFrom == null) return null
  return { perHead, collectedFrom }
}

function normalizeSettlementError(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Record<string, unknown>
  return {
    code: pickNullableString(data.code) ?? 'UNKNOWN',
    message: pickNullableString(data.message) ?? '자동 정산 처리 중 오류가 발생했습니다.',
  }
}

function pickNullableString(value: unknown) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }
  return null
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
