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
  type RoomParticipant,
} from '@/api/rooms'
import { useRoomMembership } from '@/composables/useRoomMembership'
import { connectRoomChannel, type RoomRealtimePatch } from '@/services/roomSocket'
import { getCurrentUser } from '@/services/auth'
import {
  fetchRideState,
  requestRide,
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
const filteredRideError = computed(() =>
  rideError.value?.trim() === '배차 단계 정보가 없어요.' ? '' : rideError.value,
)
const rideRequesting = ref(false)
const ridePolling = ref<ReturnType<typeof setInterval> | null>(null)
const ridePollingBusy = ref(false)
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







.room-panel--participants {
  grid-column: span 2;
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
  .room-panel--participants {
    grid-column: auto;
  }
}
</style>













