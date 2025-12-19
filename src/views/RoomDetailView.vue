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
        <button
          type="button"
          class="btn btn--ghost"
          :disabled="detailLoading"
          @click="refreshRoomDetail"
        >
          {{ detailLoading ? '새로고침 중...' : '방 새로고침' }}
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
      <p
        v-else-if="filteredRideError"
        class="room-live__status room-live__status--error"
      >
        {{ filteredRideError }}
      </p>
    </header>

    <div class="room-live__grid">

      <article class="room-panel room-panel--fare">
        <h2>요금 정보</h2>
        <div class="fare-summary">
          <div class="fare-summary__item">
            <p class="fare-summary__label">
              1인당 요금 <span class="fare-summary__count">(총 {{ participantCount }}명 기준)</span>
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
        <p class="fare-summary__hint">요금은 총 인원 기준으로 계산하고, 결제는 방장 제외 인원에게만 청구돼요.</p>
      </article>

      <article v-if="rideStageLabel || taxiInfo" class="room-panel room-panel--status">
        <h2>배차 정보</h2>
        <p v-if="rideStageLabel" class="status-hint">{{ rideStageLabel }}</p>
        <div v-if="taxiInfo" class="taxi-card">
          <p class="taxi-card__title">배차 택시</p>
          <p class="taxi-card__plate">{{ taxiInfo.carNumber ?? '차량 번호 미정' }}</p>
          <p class="taxi-card__driver">
            {{
              [taxiInfo.driverName, taxiInfo.carModel].filter(Boolean).join(' · ') ||
                '기사/차종 미정'
            }}
          </p>
        </div>
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
          방장 제외 {{ dispatchHoldResult.collectedFrom }}명에게서 1인당
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
import {
  fetchMyRooms,
  fetchRoomDetail,
  leaveRoomFromApi,
  updateRoomFromApi,
  type RoomParticipant,
} from '@/api/rooms'
import { useRoomMembership } from '@/composables/useRoomMembership'
import { connectRoomChannel, type RoomRealtimePatch } from '@/services/roomSocket'
import { getCurrentUser } from '@/services/auth'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import RouteMapBox from '@/components/RouteMapBox.vue'
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
  syncDispatchSnapshot,
} = useRoomMembership()

const fallbackRoomId = computed(() => joinedRooms.value[0]?.roomId ?? '')
const roomId = computed(() => (route.params.id as string | undefined) ?? fallbackRoomId.value)
const membership = computed(
  () => joinedRooms.value.find(entry => entry.roomId === roomId.value) ?? null,
)
const roomDetail = ref<RoomPreview | null>(null)
const room = computed<RoomPreview | null>(() => roomDetail.value ?? membership.value?.roomSnapshot ?? null)
const taxiInfo = computed(() => {
  const ride = rideState.value
  if (ride && (ride.carNumber || ride.driverName || ride.carModel)) {
    return {
      carNumber: ride.carNumber,
      driverName: ride.driverName,
      carModel: ride.carModel,
    }
  }
  const taxi = room.value?.taxi
  if (taxi && (taxi.carNumber || taxi.driverName || taxi.carModel)) {
    return taxi
  }
  return null
})
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
const filteredRideError = computed(() =>
  rideError.value?.trim() === '배차 단계 정보가 없어요.' ? '' : rideError.value,
)
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
const currentUserName = computed(() => getCurrentUser()?.name ?? '')
const isCurrentUser = (mate: RoomParticipant) => {
  const userId = currentUserId.value.trim().toLowerCase()
  const userName = currentUserName.value.trim().toLowerCase()
  const candidateIds = [mate.id, mate.email, mate.name]
    .filter((value): value is string => typeof value === 'string')
    .map(value => value.trim().toLowerCase())
  return Boolean(
    (userId && candidateIds.includes(userId)) || (userName && candidateIds.includes(userName)),
  )
}
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
const hostId = computed(() => {
  if (hostParticipant.value?.id) return hostParticipant.value.id
  if (membership.value?.role?.toLowerCase() === 'host' && currentUserId.value) {
    return currentUserId.value
  }
  return null
})
const isHost = computed(() => {
  if (membership.value?.role?.toLowerCase() === 'host') return true
  if (hostParticipant.value && isCurrentUser(hostParticipant.value)) return true
  if (!participantsRaw.value.length) return true
  if (participantsRaw.value.length === 1) return true
  return !hostId.value || hostId.value === currentUserId.value
})

const fareSyncingRooms = ref<Set<string>>(new Set())

const participants = computed(() => {
  if (participantsRaw.value.length) {
    return participantsRaw.value.map((mate, index) => ({
      id: mate.id || `participant-${index}`,
      name: mate.email ?? mate.name ?? `참여자${index + 1}`,
      role: mate.role?.toLowerCase().includes('host') || mate.id === hostId.value ? '방장' : mate.role,
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
const rideStageLabel = computed(() => {
  const stage = rideState.value?.stage
  if (!stage) return ''
  const labels: Record<RideStage, string> = {
    pending: '배차 대기 중',
    dispatching: '배차 진행 중',
    accepted: '기사 배정 완료',
    approaching: '기사님이 이동 중이에요',
    onboard: '탑승 중',
    completed: '운행 완료',
    cancelled: '배차가 취소됐어요',
  }
  return labels[stage] ?? '배차 진행 중'
})

const uberDeepLink = computed(() => buildUberDeepLink(room.value, import.meta.env.VITE_UBER_CLIENT_ID))

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

const persistedDispatchSnapshot = computed(() => membership.value?.dispatchSnapshot ?? null)

watch(
  () => persistedDispatchSnapshot.value,
  snapshot => {
    if (!snapshot) {
      dispatchAnalysis.value = null
      dispatchUploadMessage.value = ''
      dispatchUploadError.value = ''
      dispatchHoldResult.value = null
      dispatchHoldError.value = ''
      return
    }
    dispatchAnalysis.value = snapshot.analysis ?? null
    dispatchUploadMessage.value = snapshot.message || '스크린샷을 분석했어요.'
    dispatchHoldResult.value = snapshot.holdResult ?? null
    dispatchHoldError.value = snapshot.holdError ?? ''
    dispatchUploadError.value = ''
  },
  { immediate: true },
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
    const localFare = membership.value?.roomSnapshot?.fare
    if (isHost.value && localFare != null && mergedRoom.fare == null) {
      void syncEstimatedFare(id, localFare)
    }
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

async function syncEstimatedFare(roomId: string, fare: number) {
  if (fareSyncingRooms.value.has(roomId)) return
  fareSyncingRooms.value.add(roomId)
  try {
    await updateRoomFromApi(roomId, { estimatedFare: fare })
  } catch (error) {
    console.warn('Failed to sync estimated fare', error)
  }
}

function refreshRoomDetail() {
  if (roomId.value) {
    void loadRoomDetail(roomId.value)
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
        onRoomsRefresh: payload => {
          if (!payload.roomId || payload.roomId === id) {
            void loadRoomDetail(id)
          }
        },
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

function formatFareLabel(amount?: number | null) {
  if (amount == null) return '요금 미정'
  const numeric = Number(amount)
  if (!Number.isFinite(numeric)) return '요금 미정'
  const rounded = Math.max(0, Math.round(numeric))
  return `${rounded.toLocaleString('ko-KR')}원`
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    syncDispatchSnapshot(roomId.value, {
      analysis: dispatchAnalysis.value,
      holdResult: dispatchHoldResult.value,
      holdError: dispatchHoldError.value || '',
      message: dispatchUploadMessage.value || '스크린샷을 분석했어요.',
      completedAt: new Date().toISOString(),
    })
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
  padding-bottom: max(
    24px,
    calc(var(--tab-h, 0px) + var(--safe-bottom, 0px) + var(--browser-ui-bottom, 0px) + 16px)
  );
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

@media (max-width: 720px) {
  .room-panel--status,
  .room-panel--participants,
  .room-panel--vision {
    grid-column: auto;
  }
}
</style>
