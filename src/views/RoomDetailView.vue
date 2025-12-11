<template>
  <section v-if="room" class="room-live">
    <header class="room-live__header">
      <div class="room-live__eyebrow">현재 참여 중인 방</div>
      <h1>{{ room.title }}</h1>
      <p class="room-live__route">
        {{ room.departure.label }} → {{ room.arrival.label }}
      </p>
      <div class="room-live__meta">
        <span>{{ room.time }}</span>
        <span v-if="seatNumber">내 좌석 : {{ seatNumber }}번</span>
        <span v-if="room.capacity">정원 {{ room.capacity }}명</span>
      </div>
      <div class="room-live__actions">
        <button type="button" class="btn btn--ghost" :disabled="isLeavingRoom" @click="leaveRoom">
          {{ isLeavingRoom ? '나가는 중이에요...' : '방 나가기' }}
        </button>
        <div class="room-live__cta">
          <button type="button" class="btn btn--primary" @click="changeSeat">좌석 다시 고르기</button>
          <button
            v-if="uberDeepLink && isHost"
            type="button"
            class="btn btn--primary"
            :disabled="rideRequesting"
            @click="openUber"
          >
            {{ rideRequesting ? '호출 중...' : 'Uber 호출' }}
          </button>
          <span v-else-if="!isHost" class="room-live__hint">방장의 호출을 기다려 주세요.</span>
        </div>
      </div>
      <p v-if="detailLoading" class="room-live__status">방 정보를 불러오는 중이에요...</p>
      <p v-else-if="detailError" class="room-live__status room-live__status--error">{{ detailError }}</p>
      <p v-else-if="realtimeError" class="room-live__status room-live__status--error">{{ realtimeError }}</p>
      <p v-else-if="rideError" class="room-live__status room-live__status--error">{{ rideError }}</p>
    </header>

    <div class="room-live__grid">

      <article class="room-panel room-panel--fare">
        <h2>요금 정보</h2>
        <div class="fare-summary">
          <div class="fare-summary__item">
            <p class="fare-summary__label">
              내 요금 <span class="fare-summary__count">({{ participantCount }}명)</span>
            </p>
            <strong
              class="fare-summary__value"
              :class="{ 'fare-summary__value--pending': isPerPersonFarePending }"
            >
              {{ formatFareLabel(perPersonFare) }}
            </strong>
          </div>
          <div class="fare-summary__item">
            <p class="fare-summary__label">전체 요금</p>
            <strong class="fare-summary__value" :class="{ 'fare-summary__value--pending': isTotalFarePending }">
              {{ formatFareLabel(room?.fare) }}
            </strong>
          </div>
        </div>
        <p class="fare-summary__hint">참여 인원에 맞춰 n분의 1로 자동 계산돼요.</p>
      </article>

      <article class="room-panel room-panel--status">
        <h2>배차 진행 상황</h2>
        <div class="status-current" :class="`status-current--${statusInfo.key}`">
          <p class="status-current__label">{{ statusInfo.label }}</p>
          <p class="status-current__desc">{{ statusInfo.description }}</p>
          <button
            v-if="room.status === 'failed'"
            type="button"
            class="status-current__retry"
            @click="retryDispatch"
          >
            배차 다시 시도하기
          </button>
        </div>
        <div class="room-panel__cta room-panel__cta--route">
          <button type="button" class="link-btn" @click="toggleRouteMap">
            {{ showRouteMap ? '지금 숨기기' : '경로 보기' }}
          </button>
        </div>
        <transition name="route-map">
          <div v-if="showRouteMap" class="route-map-wrapper">
            <RouteMapBox :departure="room.departure" :arrival="room.arrival" :title="room.title" />
          </div>
        </transition>
        <ol class="dispatch-timeline" aria-label="배차 진행 단계">
          <li
            v-for="step in dispatchTimeline"
            :key="step.key"
            class="dispatch-timeline__item"
            :class="`dispatch-timeline__item--${step.state}`"
          >
            <div class="dispatch-timeline__badge">{{ step.title }}</div>
            <div class="dispatch-timeline__body">
              <p class="dispatch-timeline__title">{{ step.title }}</p>
              <p class="dispatch-timeline__desc">{{ step.description }}</p>
              <small v-if="step.hint" class="dispatch-timeline__hint">{{ step.hint }}</small>
            </div>
          </li>
        </ol>

        <div v-if="showTaxiInfo" class="taxi-card">
          <p class="taxi-card__title">배차/운행 정보</p>
          <p class="taxi-card__plate">{{ currentTaxi?.carModel }} · {{ currentTaxi?.carNumber }}</p>
          <p class="taxi-card__driver">{{ currentTaxi?.driverName }}</p>
        </div>
        <p v-else-if="room.status === 'failed'" class="status-hint">
          배차가 실패했어요. 인원 모집을 조정하거나 다시 시도해 주세요.
        </p>
      </article>

      <article v-if="isHost" class="room-panel room-panel--vision">
        <h2>배차 스크린샷 자동 공유</h2>
        <p class="vision-intro">
          호출 앱에서 캡처한 화면을 올리면 기사님 이름·차량 번호·차종을 자동으로 채워 팀원에게 공유하고 예치금도 자동으로 잡아줘요.
        </p>
        <div
          v-if="!dispatchUploadComplete"
          class="vision-drop"
          :class="{
            'vision-drop--hover': dispatchUploadHover,
            'vision-drop--busy': dispatchUploadBusy,
          }"
          @dragenter.prevent="onDispatchDragEnter"
          @dragover.prevent="onDispatchDragEnter"
          @dragleave.prevent="onDispatchDragLeave"
          @drop.prevent="onDispatchDrop"
        >
          <input
            ref="dispatchFileInput"
            class="vision-drop__input"
            type="file"
            accept="image/*"
            @change="onDispatchFileChange"
          />
          <p class="vision-drop__title">
            {{ dispatchUploadBusy ? 'Gemini가 정보를 읽는 중...' : '여기에 스크린샷을 끌어놓거나 클릭해서 선택하세요' }}
          </p>
          <button
            type="button"
            class="vision-drop__button"
            :disabled="dispatchUploadBusy"
            @click="openDispatchFileDialog"
          >
            이미지 선택
          </button>
          <small class="vision-drop__hint">JPG / PNG / HEIC 등 대부분의 이미지 파일을 지원해요.</small>
        </div>
        <p v-if="dispatchUploadMessage" class="vision-status vision-status--success">
          {{ dispatchUploadMessage }}
        </p>
        <p v-else-if="dispatchUploadError" class="vision-status vision-status--error">
          {{ dispatchUploadError }}
        </p>
        <p v-if="dispatchHoldResult" class="vision-status vision-status--success">
          {{ dispatchHoldResult.collectedFrom }}명의 참여자에게서 1인당
          {{ formatFareLabel(dispatchHoldResult.perHead) }}씩 자동 예치금을 잡았어요.
        </p>
        <p v-else-if="dispatchHoldError" class="vision-status vision-status--error">
          {{ dispatchHoldError }}
        </p>
        <div v-if="dispatchAnalysis?.summary || dispatchAnalysis?.rawText" class="vision-analysis">
          <p v-if="dispatchAnalysis.summary" class="vision-analysis__summary">
            {{ dispatchAnalysis.summary }}
          </p>
          <dl class="vision-analysis__meta">
            <div>
              <dt>기사님</dt>
              <dd>{{ dispatchAnalysis.driverName ?? '인식 실패' }}</dd>
            </div>
            <div>
              <dt>차량 번호</dt>
              <dd>{{ dispatchAnalysis.carNumber ?? '인식 실패' }}</dd>
            </div>
            <div>
              <dt>차종</dt>
              <dd>{{ dispatchAnalysis.carModel ?? '인식 실패' }}</dd>
            </div>
          </dl>
        </div>
      </article>

      <article class="room-panel room-panel--participants">
        <h2>참여자 현황</h2>
        <ul class="participant-list">
          <li v-for="mate in participants" :key="mate.id">
            <div class="participant">
              <div class="participant__avatar">{{ mate.initials }}</div>
              <div class="participant__info">
                <p>
                  {{ mate.name }}
                  <span v-if="mate.role" class="participant__role">{{ mate.role }}</span>
                </p>
                <small class="participant__seat">
                  {{ mate.seat ? `${mate.seat}번 좌석` : '좌석 미정' }}
                </small>
              </div>
            </div>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RoomPreview } from '@/types/rooms'
import RouteMapBox from '@/components/RouteMapBox.vue'
import {
  fetchMyRooms,
  fetchRoomDetail,
  leaveRoomFromApi,
  type RoomParticipant,
} from '@/api/rooms'
import { useRoomMembership } from '@/composables/useRoomMembership'
import { connectRoomChannel, type RoomRealtimePatch } from '@/services/roomSocket'
import { getCurrentUser } from '@/services/auth'
import {
  analyzeDispatchScreenshot,
  fetchRideState,
  requestRide,
  updateRideStage,
  type DispatchAnalysis,
  type RideStage,
  type RideState,
} from '@/api/ride'
const route = useRoute()
const router = useRouter()
const {
  joinedRooms,
  leaveRoom: abandonRoom,
  updateSeat,
  setActiveRoom,
  syncRoomSnapshot,
  replaceRooms,
} = useRoomMembership()

const fallbackRoomId = computed(() => joinedRooms.value[0]?.roomId ?? '')
const roomId = computed(() => (route.params.id as string | undefined) ?? fallbackRoomId.value)
const membership = computed(
  () => joinedRooms.value.find(entry => entry.roomId === roomId.value) ?? null,
)
const roomDetail = ref<RoomPreview | null>(null)
const room = computed<RoomPreview | null>(() => roomDetail.value ?? membership.value?.roomSnapshot ?? null)
const seatFromQuery = computed(() => {
  const seatQuery = route.query.seat
  if (!seatQuery) return null
  const seat = Array.isArray(seatQuery) ? seatQuery[0] : seatQuery
  const parsed = Number(seat)
  return Number.isNaN(parsed) ? null : parsed
})
const seatNumber = computed(() => membership.value?.seatNumber ?? seatFromQuery.value)

const participantsRaw = ref<RoomParticipant[]>([])
const detailError = ref('')
const detailLoading = ref(false)
const realtimeError = ref('')
const disconnectRealtime = ref<null | (() => void)>(null)
const rideState = ref<RideState | null>(null)
const rideError = ref('')
const rideRequesting = ref(false)
const ridePolling = ref<ReturnType<typeof setInterval> | null>(null)
const ridePollingBusy = ref(false)
const dispatchAnalysis = ref<DispatchAnalysis | null>(null)
const dispatchUploadComplete = computed(() => Boolean(dispatchAnalysis.value))
const dispatchUploadBusy = ref(false)
const dispatchUploadHover = ref(false)
const dispatchUploadMessage = ref('')
const dispatchUploadError = ref('')
const dispatchHoldResult = ref<{ perHead: number; collectedFrom: number } | null>(null)
const dispatchHoldError = ref('')
const dispatchFileInput = ref<HTMLInputElement | null>(null)
const currentUserId = computed(() => getCurrentUser()?.id ?? '')
const hostParticipant = computed(() => {
  const labeledHost = participantsRaw.value.find(mate =>
    mate.role?.toLowerCase().includes('host'),
  )
  if (labeledHost) return labeledHost
  if (participantsRaw.value.length === 1) return participantsRaw.value[0]
  const sorted = [...participantsRaw.value].sort((a, b) => {
    const aTime = a.joinedAt ? new Date(a.joinedAt).getTime() : Number.POSITIVE_INFINITY
    const bTime = b.joinedAt ? new Date(b.joinedAt).getTime() : Number.POSITIVE_INFINITY
    return aTime - bTime
  })
  return sorted[0] ?? null
})
const hostId = computed(() => hostParticipant.value?.id ?? null)
const isHost = computed(() => {
  if (!participantsRaw.value.length) return true
  if (participantsRaw.value.length === 1) return true
  return !hostId.value || hostId.value === currentUserId.value
})

const participants = computed(() => {
  if (participantsRaw.value.length) {
    return participantsRaw.value.map((mate, index) => ({
      id: mate.id || `participant-${index}`,
      name: mate.email ?? mate.name ?? `참여자${index + 1}`,
      role: mate.id === hostId.value ? '방장' : mate.role,
      seat: mate.seatNumber ?? null,
      initials: toInitials(
        mate.email ?? mate.name ?? mate.id ?? `${index + 1}`,
        `${index + 1}`,
      ),
    }))
  }
  if (membership.value) {
    return [
      {
        id: membership.value.roomId,
        name: 'ME',
        role: undefined,
        seat: membership.value.seatNumber ?? null,
        initials: membership.value.seatNumber
          ? membership.value.seatNumber.toString()
          : 'ME',
      },
    ]
  }
  return []
})
const participantCount = computed(() => Math.max(participants.value.length, 1))
const perPersonFare = computed(() => {
  const fare = room.value?.fare
  return fare ? Math.round(fare / participantCount.value) : undefined
})
const isPerPersonFarePending = computed(() => perPersonFare.value == null)
const isTotalFarePending = computed(() => room.value?.fare == null)

const uberDeepLink = computed(() => buildUberDeepLink(room.value, import.meta.env.VITE_UBER_CLIENT_ID))

const showRouteMap = ref(false)
const isLeavingRoom = ref(false)

watch(
  () => roomId.value,
  id => {
    if (id) loadRoomDetail(id)
  },
  { immediate: true },
)

watch(
  () => roomId.value,
  id => {
    if (id) connectRealtime(id)
    else stopRealtime()
  },
  { immediate: true },
)

watch(
  () => roomId.value,
  id => {
    if (id) startRidePolling(id)
    else stopRidePolling()
  },
  { immediate: true },
)

watch(
  () => roomId.value,
  () => {
    dispatchAnalysis.value = null
    dispatchUploadMessage.value = ''
    dispatchUploadError.value = ''
    dispatchHoldResult.value = null
    dispatchHoldError.value = ''
  },
)

async function loadRoomDetail(id: string) {
  detailLoading.value = true
  detailError.value = ''
  try {
    const { room: nextRoom, participants: participantList } = await fetchRoomDetail(id)
    const snapshotFare = membership.value?.roomSnapshot?.fare
    const mergedRoom =
      snapshotFare != null && nextRoom.fare == null ? { ...nextRoom, fare: snapshotFare } : nextRoom
    roomDetail.value = mergedRoom
    participantsRaw.value = participantList
    syncRoomSnapshot(id, mergedRoom)
  } catch (error) {
    detailError.value = resolveErrorMessage(error, '방 정보를 불러오지 못했어요.')
    participantsRaw.value = []
    if (!roomDetail.value && membership.value?.roomSnapshot) {
      roomDetail.value = membership.value.roomSnapshot
    }
  } finally {
    detailLoading.value = false
  }
}

function changeSeat() {
  router.push({ name: 'seat-selection', query: { roomId: roomId.value } })
}

async function leaveRoom() {
  if (!roomId.value || isLeavingRoom.value) {
    router.push({ name: 'find-room' })
    return
  }
  isLeavingRoom.value = true
  try {
    await leaveRoomFromApi(roomId.value)
    abandonRoom(roomId.value)
    const entries = await fetchMyRooms()
    replaceRooms(entries)
    router.push({ name: 'find-room' })
  } catch (error) {
    alert(resolveErrorMessage(error, '방 나가기에 실패했어요. 다시 시도해 주세요.'))
  } finally {
    isLeavingRoom.value = false
  }
}

async function connectRealtime(id: string) {
  stopRealtime()
  realtimeError.value = ''
  try {
    const disconnect = await connectRoomChannel(
      id,
      {
        onRoomUpdated: applyRoomPatch,
        onParticipantsUpdated: applyParticipantPatch,
        onError: message => (realtimeError.value = message),
      },
      { token: resolveAuthToken() },
    )
    disconnectRealtime.value = disconnect
  } catch (error) {
    realtimeError.value = resolveErrorMessage(error, '실시간 연결에 실패했어요.')
  }
}

function stopRealtime() {
  if (disconnectRealtime.value) {
    disconnectRealtime.value()
    disconnectRealtime.value = null
  }
}

function startRidePolling(id: string) {
  stopRidePolling()
  rideError.value = ''
  if (!id) return
  pollRideState(id)
  ridePolling.value = setInterval(() => {
    void pollRideState(id, true)
  }, 3000)
}

function stopRidePolling() {
  if (ridePolling.value) {
    clearInterval(ridePolling.value)
    ridePolling.value = null
  }
}

async function pollRideState(id: string, silent = false) {
  if (!id || ridePollingBusy.value) return
  ridePollingBusy.value = true
  try {
    const nextState = await fetchRideState(id)
    applyRideState(nextState)
    rideError.value = ''
  } catch (error) {
    if (!silent) {
      rideError.value = resolveErrorMessage(error, '배차 상태를 불러오지 못했어요.')
    }
  } finally {
    ridePollingBusy.value = false
  }
}

function applyRideState(next: RideState | null) {
  if (!next) return
  rideState.value = next
}

function applyRideStage(stage: RideStage, patch: Partial<RideState> = {}) {
  rideState.value = { ...(rideState.value ?? { stage }), ...patch, stage }
}

function applyRoomPatch(patch: RoomRealtimePatch) {
  if (!roomId.value) return
  const baseRoom = roomDetail.value ?? membership.value?.roomSnapshot ?? null
  if (!baseRoom) return

  const nextRoom: RoomPreview = {
    ...baseRoom,
    ...(patch.title ? { title: patch.title } : {}),
    ...(patch.eta !== undefined ? { eta: patch.eta } : {}),
    ...(patch.fare !== undefined ? { fare: patch.fare } : {}),
    ...(patch.status ? { status: patch.status } : {}),
    ...(patch.taxi ? { taxi: { ...baseRoom.taxi, ...patch.taxi } } : {}),
    departure: patch.departure
      ? {
          ...baseRoom.departure,
          ...patch.departure,
          position: patch.departure.position ?? baseRoom.departure.position,
        }
      : baseRoom.departure,
    arrival: patch.arrival
      ? {
          ...baseRoom.arrival,
          ...patch.arrival,
          position: patch.arrival.position ?? baseRoom.arrival.position,
        }
      : baseRoom.arrival,
  }

  roomDetail.value = nextRoom
  syncRoomSnapshot(roomId.value, nextRoom)
}

function applyParticipantPatch(next: RoomParticipant[]) {
  participantsRaw.value = next
}

async function openUber() {
  if (!isHost.value) {
    realtimeError.value = '방장만 호출을 진행할 수 있어요.'
    return
  }
  if (!roomId.value || !room.value) {
    realtimeError.value = '방 정보를 찾지 못했어요. 다시 시도해 주세요.'
    return
  }

  try {
    rideRequesting.value = true
    const response = await requestRide(roomId.value, {
      pickup: room.value.departure,
      dropoff: room.value.arrival,
      passengerCount: participantCount.value,
    })

    applyRideStage(response.stage ?? 'pending', {
      requestId: response.requestId ?? rideState.value?.requestId,
    })

    const deepLinkUrl =
      response.appUrl ||
      response.deeplink ||
      response.deepLink ||
      response.url ||
      uberDeepLink.value
    if (deepLinkUrl) {
      window.open(deepLinkUrl, '_blank')
    }

    await pollRideState(roomId.value, true)
  } catch (error) {
    const fallbackLink = uberDeepLink.value
    if (fallbackLink) {
      window.open(fallbackLink, '_blank')
      realtimeError.value = '배차 요청이 실패해서 우버 링크를 열었어요.'
    } else {
      realtimeError.value = resolveErrorMessage(error, '호출 요청을 처리하지 못했어요.')
    }
  } finally {
    rideRequesting.value = false
  }
}

async function retryDispatch() {
  if (!isHost.value) {
    realtimeError.value = '방장만 배차를 다시 시도할 수 있어요.'
    return
  }
  await updateRideProgress('dispatching')
}

async function updateRideProgress(stage: RideStage) {
  if (!roomId.value) return
  try {
    const next = await updateRideStage(roomId.value, { ...(rideState.value ?? { stage }), stage })
    applyRideState(next)
  } catch (error) {
    realtimeError.value = resolveErrorMessage(error, '배차 상태 업데이트에 실패했어요.')
  }
}

function openDispatchFileDialog() {
  dispatchFileInput.value?.click()
}

async function onDispatchFileChange(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) return
  await handleDispatchFile(file)
  if (input) input.value = ''
}

function onDispatchDragEnter(event: DragEvent) {
  event.preventDefault()
  dispatchUploadHover.value = true
}

function onDispatchDragLeave(event: DragEvent) {
  if (event.currentTarget === event.target) {
    dispatchUploadHover.value = false
  }
}

async function onDispatchDrop(event: DragEvent) {
  event.preventDefault()
  dispatchUploadHover.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    await handleDispatchFile(file)
  }
}

async function handleDispatchFile(file: File) {
  if (!roomId.value) {
    dispatchUploadError.value = '방 정보를 찾지 못했어요.'
    return
  }
  dispatchUploadBusy.value = true
  dispatchUploadMessage.value = ''
  dispatchUploadError.value = ''
  dispatchHoldResult.value = null
  dispatchHoldError.value = ''
  try {
    const base64 = await readFileAsBase64(file)
    const payload = {
      imageBase64: sanitizeBase64(base64),
      mimeType: file.type || 'image/png',
    }
    const result = await analyzeDispatchScreenshot(roomId.value, payload)
    dispatchAnalysis.value = result.analysis
    if (result.rideState) {
      applyRideState(result.rideState)
    } else {
      await pollRideState(roomId.value, true)
    }
    if (result.settlementHold) {
      dispatchHoldResult.value = result.settlementHold
    }
    if (result.settlementHoldError) {
      dispatchHoldError.value = result.settlementHoldError.message
    }
    dispatchUploadMessage.value = '스크린샷을 분석했어요.'
  } catch (error) {
    dispatchUploadError.value = resolveErrorMessage(error, '이미지를 분석하지 못했어요.')
  } finally {
    dispatchUploadBusy.value = false
  }
}

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('파일을 읽지 못했어요.'))
    reader.readAsDataURL(file)
  })
}

function sanitizeBase64(data: string) {
  if (!data) return data
  const commaIndex = data.indexOf(',')
  return commaIndex === -1 ? data : data.slice(commaIndex + 1)
}

function toInitials(source?: string, fallback = 'ME') {
  if (!source) return fallback
  const trimmed = source.trim()
  if (!trimmed) return fallback
  const tokens = trimmed.split(/\s+/).filter(Boolean)
  const firstToken = tokens[0]
  if (!firstToken) return fallback
  if (tokens.length === 1) return firstToken.slice(0, Math.min(2, firstToken.length))
  const lastToken = tokens[tokens.length - 1] ?? firstToken
  return `${firstToken.charAt(0)}${lastToken.charAt(0)}`
}

function resolveErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message || fallback
  if (typeof err === 'string' && err.trim()) return err
  return fallback
}

function toggleRouteMap() {
  showRouteMap.value = !showRouteMap.value
}

function buildUberDeepLink(room: RoomPreview | null | undefined, clientId?: string) {
  if (!room?.departure?.position || !room?.arrival?.position) return ''
  const params = new URLSearchParams({
    action: 'setPickup',
    'pickup[latitude]': String(room.departure.position.lat),
    'pickup[longitude]': String(room.departure.position.lng),
    'dropoff[latitude]': String(room.arrival.position.lat),
    'dropoff[longitude]': String(room.arrival.position.lng),
  })
  if (room.departure.label) params.set('pickup[nickname]', room.departure.label)
  if (room.arrival.label) params.set('dropoff[nickname]', room.arrival.label)
  if (clientId) params.set('client_id', clientId)
  return `https://m.uber.com/ul/?${params.toString()}`
}

function resolveAuthToken() {
  if (typeof window === 'undefined') return ''
  return (
    window.localStorage.getItem('gogotaxi_access_token') ||
    window.localStorage.getItem('gogotaxi_token') ||
    window.localStorage.getItem('auth_token') ||
    ''
  )
}

type DispatchStepKey =
  | 'recruiting'
  | 'requesting'
  | 'matching'
  | 'driver_assigned'
  | 'arriving'
  | 'aboard'
  | 'success'
  | 'failed'

type DispatchStep = { key: DispatchStepKey; title: string; description: string; hint?: string }
type DispatchStepView = DispatchStep & { state: 'done' | 'active' | 'upcoming' }

const DISPATCH_STEPS: DispatchStep[] = [
  { key: 'recruiting', title: '인원 모집', description: '최대 4명까지 방에 입장하여 자리를 확정해요.' },
  { key: 'requesting', title: '호출 요청 준비', description: '방장이 목적지를 확인하고 우버 호출을 눌러요.' },
  { key: 'matching', title: '배차/매칭 중', description: '소켓으로 배차 진행 상황을 모두에게 실시간 공유해요.' },
  { key: 'driver_assigned', title: '기사 배정 완료', description: '차량, 기사 정보를 공유 UI에 표시해요.' },
  { key: 'arriving', title: '픽업지 이동 중', description: '기사님이 픽업 지점으로 이동 중이에요.' },
  { key: 'aboard', title: '탑승 완료', description: '모두 탑승 후 배차 흐름을 계속 업데이트해요.' },
  { key: 'success', title: '운행 완료', description: '결제/정산 단계를 마무리해요.' },
]

const STATUS_LABELS: Record<DispatchStepKey, string> = {
  recruiting: '모집 중',
  requesting: '호출 준비',
  matching: '배차 중',
  driver_assigned: '기사 배정',
  arriving: '픽업 이동 중',
  aboard: '탑승 완료',
  success: '배차 성공',
  failed: '배차 실패',
}

const STATUS_DESCRIPTIONS: Record<DispatchStepKey, string> = {
  recruiting: '인원을 모집 중입니다.',
  requesting: '방장이 목적지를 확인하고 호출을 준비하고 있어요.',
  matching: '실시간 배차가 진행되고 있어요.',
  driver_assigned: '기사 정보가 확인되었어요.',
  arriving: '기사님이 픽업 지점으로 이동 중이에요.',
  aboard: '모두 탑승하여 도착까지 안전 운행!',
  success: '운행이 완료되었어요.',
  failed: '배차가 실패하여 다시 시도해야 해요.',
}

const statusKey = computed<DispatchStepKey>(() =>
  rideStageToDispatchStep(rideState.value?.stage) ?? normalizeStatus(room.value?.status),
)

const statusInfo = computed(() => ({
  key: statusKey.value,
  label: STATUS_LABELS[statusKey.value],
  description: STATUS_DESCRIPTIONS[statusKey.value],
}))

const dispatchTimeline = computed<DispatchStepView[]>(() => {
  const current = statusKey.value
  const currentIndex = DISPATCH_STEPS.findIndex(step => step.key === current)
  return DISPATCH_STEPS.map((step, index) => {
    const state =
      current === 'failed'
        ? index < (currentIndex === -1 ? 2 : currentIndex)
          ? 'done'
          : 'upcoming'
        : index < currentIndex
          ? 'done'
          : index === currentIndex
            ? 'active'
            : 'upcoming'
    return { ...step, state }
  })
})

const currentTaxi = computed(() => {
  if (rideState.value) {
    const { driverName, carModel, carNumber } = rideState.value
    if (driverName || carModel || carNumber) return { driverName, carModel, carNumber }
  }
  return room.value?.taxi
})

const showTaxiInfo = computed(() =>
  ['driver_assigned', 'arriving', 'aboard', 'success'].includes(statusKey.value) && currentTaxi.value,
)

function formatFareLabel(amount?: number | null) {
  if (amount == null) return '요금 미정'
  return `₩${amount.toLocaleString('ko-KR')}`
}

function normalizeStatus(status?: RoomPreview['status']): DispatchStepKey {
  switch (status) {
    case 'requesting':
      return 'requesting'
    case 'matching':
      return 'matching'
    case 'dispatching':
      return 'matching'
    case 'driver_assigned':
      return 'driver_assigned'
    case 'arriving':
      return 'arriving'
    case 'aboard':
      return 'aboard'
    case 'success':
      return 'success'
    case 'failed':
      return 'failed'
    default:
      return 'recruiting'
  }
}

function rideStageToDispatchStep(stage?: RideStage | null): DispatchStepKey | null {
  switch (stage) {
    case 'pending':
      return 'requesting'
    case 'dispatching':
      return 'matching'
    case 'accepted':
      return 'driver_assigned'
    case 'approaching':
      return 'arriving'
    case 'onboard':
      return 'aboard'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'failed'
    default:
      return null
  }
}

watch(
  () => roomId.value,
  id => {
    if (id) setActiveRoom(id)
  },
  { immediate: true },
)

watch(
  () => room.value,
  value => {
    if (roomId.value && value) syncRoomSnapshot(roomId.value, value)
  },
  { immediate: true },
)

watch(
  [() => roomId.value, () => seatFromQuery.value],
  ([id, seat]) => {
    if (id && typeof seat === 'number') updateSeat(id, seat)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  stopRealtime()
  stopRidePolling()
})
</script>

<style scoped>
.room-live {
  min-height: calc(100dvh - var(--header-h, 0px));
  padding: clamp(32px, 6vw, 64px) clamp(18px, 5vw, 48px);
  padding-bottom: max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px));
  background: linear-gradient(180deg, #fffdf5 0%, #fff8dc 100%);
  color: #3b2f1f;
  display: grid;
  gap: 28px;
}

.room-live__header {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 32px;
  padding: clamp(24px, 4vw, 36px);
  border: 1px solid rgba(234, 179, 8, 0.3);
  display: grid;
  gap: 10px;
}

.room-live__eyebrow {
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #b45309;
}

.room-live__header h1 {
  margin: 0;
  font-size: clamp(22px, 4vw, 32px);
}

.room-live__route {
  margin: 0;
  color: #92400e;
}

.room-live__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 14px;
  color: #7c2d12;
}

.room-live__meta span {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(250, 204, 21, 0.2);
}

.room-live__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 6px;
}

.room-live__cta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.room-live__hint {
  color: #9ca3af;
  font-size: 14px;
}

.room-live__status {
  margin: 12px 0 0;
  font-size: 14px;
  color: #a16207;
}

.room-live__status--error {
  color: #b91c1c;
}

.room-live__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
}

.room-panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 22px;
  border: 1px solid rgba(251, 191, 36, 0.35);
  display: grid;
  gap: 16px;
}

.room-panel--chat {
  grid-column: span 2;
}

.room-panel h2 {
  margin: 0;
  font-size: 18px;
  color: #7c2d12;
}

.room-panel dl {
  display: grid;
  gap: 12px;
  margin: 0;
}

.room-panel dl div {
  display: grid;
  gap: 2px;
}

.room-panel dt {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #a16207;
}

.room-panel dd {
  margin: 0;
  font-size: 15px;
  color: #3b2f1f;
}

.room-panel__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.fare-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
}

.fare-summary__item {
  display: grid;
  gap: 6px;
}

.fare-summary__label {
  margin: 0;
  font-size: 13px;
  color: #a16207;
}

.fare-summary__count {
  font-size: 12px;
  color: #c2410c;
  margin-left: 6px;
}

.fare-summary__value {
  font-size: 22px;
  color: #7c2d12;
  font-weight: 700;
}

.fare-summary__value--pending {
  font-size: 14px;
  color: #a16207;
  font-weight: 600;
}

.fare-summary__hint {
  margin: 0;
  font-size: 13px;
  color: #92400e;
  background: rgba(251, 191, 36, 0.18);
  padding: 10px 12px;
  border-radius: 14px;
}

.route-map-wrapper {
  margin-top: 18px;
}

.route-map-enter-active,
.route-map-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.route-map-enter-from,
.route-map-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.link-btn {
  background: transparent;
  border: none;
  padding: 0;
  font-size: 14px;
  color: #c2410c;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-thickness: 2px;
}

.participant-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
}

.participant {
  display: flex;
  align-items: center;
  gap: 12px;
}

.participant__avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(253, 230, 138, 0.6);
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #92400e;
}

.participant__info p {
  margin: 0;
  font-weight: 600;
  color: #3b2f1f;
}

.participant__seat {
  color: #a16207;
}

.participant__role {
  margin-left: 8px;
  font-size: 12px;
  color: #b45309;
}

.status-current {
  border-radius: 20px;
  padding: 18px;
  background: rgba(253, 230, 138, 0.45);
  border: 1px solid rgba(251, 191, 36, 0.45);
}

.status-current__label {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #7c2d12;
}

.status-current__desc {
  margin: 6px 0 0;
  color: #a16207;
}

.status-current__retry {
  margin-top: 12px;
  align-self: flex-start;
  background: #b91c1c;
  color: #fffaf0;
  border: none;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.status-current__retry:hover {
  transform: translateY(-1px);
}

.status-current--success {
  background: rgba(187, 247, 208, 0.45);
  border-color: rgba(16, 185, 129, 0.45);
}

.status-current--failed {
  background: rgba(254, 226, 226, 0.65);
  border-color: rgba(248, 113, 113, 0.45);
}

.status-hint {
  margin: 0;
  font-size: 14px;
  color: #b45309;
}

.taxi-card {
  border: 1px solid rgba(16, 185, 129, 0.4);
  border-radius: 18px;
  padding: 14px 16px;
  background: rgba(16, 185, 129, 0.08);
  display: grid;
  gap: 4px;
}

.taxi-card__title {
  margin: 0;
  font-size: 13px;
  color: #0f766e;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.taxi-card__plate {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #065f46;
}

.taxi-card__driver {
  margin: 0;
  font-size: 13px;
  color: #0f766e;
}

.room-panel--status,
.room-panel--participants,
.room-panel--vision {
  grid-column: span 2;
}

.room-panel--vision {
  background: #fffdfa;
  border: 2px dashed rgba(59, 47, 31, 0.08);
}

.vision-intro {
  margin: 0 0 16px;
  color: rgba(59, 47, 31, 0.76);
  line-height: 1.5;
}

.vision-drop {
  position: relative;
  border: 2px dashed rgba(59, 47, 31, 0.3);
  border-radius: 20px;
  padding: 32px 24px;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.2s ease;
  overflow: hidden;
}

.vision-drop--hover {
  border-color: #ff7a00;
  background: rgba(255, 239, 214, 0.8);
}

.vision-drop--busy {
  opacity: 0.6;
  pointer-events: none;
}

.vision-drop__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.vision-drop__title {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 12px;
}

.vision-drop__button {
  border: 1px solid rgba(59, 47, 31, 0.3);
  padding: 10px 18px;
  border-radius: 999px;
  background: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.vision-drop__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vision-drop__button:not(:disabled):hover {
  background: #3b2f1f;
  color: #fff;
}

.vision-drop__hint {
  display: block;
  margin-top: 10px;
  color: rgba(59, 47, 31, 0.6);
}

.vision-status {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  font-weight: 600;
}

.vision-status--success {
  background: rgba(34, 197, 94, 0.12);
  color: #065f46;
}

.vision-status--error {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.vision-analysis {
  margin-top: 20px;
  padding: 18px;
  border-radius: 16px;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(59, 47, 31, 0.08);
}

.vision-analysis__summary {
  margin: 0 0 12px;
  font-weight: 600;
}

.vision-analysis__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.vision-analysis__meta div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vision-analysis__meta dt {
  font-size: 0.85rem;
  color: rgba(59, 47, 31, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.vision-analysis__meta dd {
  margin: 0;
  font-weight: 600;
  color: #3b2f1f;
}

.btn {
  border: none;
  border-radius: 16px;
  padding: 12px 18px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.btn--ghost {
  background: rgba(255, 255, 255, 0.7);
  color: #7c2d12;
  border: 1px solid rgba(250, 204, 21, 0.3);
}

.btn--primary {
  background: #fbbf24;
  color: #7c2d12;
}

.btn:hover {
  transform: translateY(-1px);
}

.status-share {
  margin: 12px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.host-actions {
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 12px;
  background: linear-gradient(90deg, rgba(255, 237, 213, 0.5), rgba(255, 255, 255, 0.85));
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.host-actions__meta p {
  margin: 0;
}

.host-actions__label {
  font-size: 13px;
  color: #9a3412;
  letter-spacing: 0.02em;
}

.host-actions__name {
  font-weight: 700;
  font-size: 16px;
}

.host-actions__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.host-actions .btn {
  min-width: 150px;
}

.dispatch-timeline {
  list-style: none;
  padding: 0;
  margin: 14px 0 0;
  display: grid;
  gap: 10px;
}

.dispatch-timeline__item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: start;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(17, 24, 39, 0.08);
  background: #fff;
}

.dispatch-timeline__item--done {
  border-color: rgba(34, 197, 94, 0.4);
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.06), #fff);
}

.dispatch-timeline__item--active {
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.08);
}

.dispatch-timeline__badge {
  min-width: 120px;
  padding: 6px 10px;
  background: rgba(17, 24, 39, 0.05);
  border-radius: 12px;
  font-weight: 700;
  text-align: center;
}

.dispatch-timeline__item--done .dispatch-timeline__badge {
  background: rgba(34, 197, 94, 0.15);
}

.dispatch-timeline__item--active .dispatch-timeline__badge {
  background: rgba(37, 99, 235, 0.15);
}

.dispatch-timeline__title {
  margin: 0;
  font-weight: 700;
}

.dispatch-timeline__desc {
  margin: 4px 0 0;
  color: #4b5563;
}

.dispatch-timeline__hint {
  display: inline-block;
  margin-top: 4px;
  color: #2563eb;
}

.link-hint {
  font-size: 13px;
  color: #9ca3af;
}


@media (max-width: 720px) {
  .room-panel--status,
  .room-panel--participants,
  .room-panel--vision {
    grid-column: auto;
  }
}
</style>
