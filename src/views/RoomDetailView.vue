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
        <span v-if="seatNumber">내 좌석 {{ seatNumber }}번</span>
        <span v-if="room.capacity">정원 {{ room.capacity }}명</span>
      </div>
      <div class="room-live__actions">
        <button type="button" class="btn btn--ghost" @click="leaveRoom">방 나가기</button>
        <button type="button" class="btn btn--primary" @click="changeSeat">좌석 다시 고르기</button>
      </div>
    </header>

      <div class="room-live__grid">
        <article class="room-panel room-panel--route">
          <h2>이동 정보</h2>
          <dl>
            <div>
              <dt>출발지</dt>
              <dd>{{ room.departure.label }}</dd>
            </div>
            <div>
              <dt>도착지</dt>
              <dd>{{ room.arrival.label }}</dd>
            </div>
            <div>
              <dt>출발 시간</dt>
              <dd>{{ room.time }}</dd>
            </div>
            <div>
              <dt>예상 도착</dt>
              <dd>{{ room.eta ?? '확정 전' }}</dd>
            </div>
            <div>
              <dt>내 좌석</dt>
              <dd>{{ seatNumber ? `${seatNumber}번 좌석` : '미선택' }}</dd>
            </div>
          </dl>
          <div class="room-panel__cta">
            <button type="button" class="link-btn" @click="toggleRouteMap">
              {{ showRouteMap ? '지도 닫기' : '경로 보기' }}
            </button>
            <button type="button" class="link-btn" @click="changeSeat">좌석 다시 고르기</button>
          </div>
          <transition name="route-map">
            <div v-if="showRouteMap" class="route-map-wrapper">
              <RouteMapBox
                :departure="room.departure"
                :arrival="room.arrival"
                :title="room.title"
              />
            </div>
          </transition>
        </article>

        <article class="room-panel room-panel--fare">
          <h2>요금 정보</h2>
          <div class="fare-summary">
            <div class="fare-summary__item">
              <p class="fare-summary__label">
                내 요금
                <span class="fare-summary__count">({{ participantCount }}명 기준)</span>
              </p>
              <strong>{{ formatFare(perPersonFare) }}</strong>
            </div>
            <div class="fare-summary__item">
              <p class="fare-summary__label">전체 요금</p>
              <strong>{{ formatFare(room.fare) }}</strong>
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
          <div v-if="showTaxiInfo" class="taxi-card">
            <p class="taxi-card__title">배차된 택시</p>
            <p class="taxi-card__plate">{{ room.taxi?.carModel }} · {{ room.taxi?.carNumber }}</p>
            <p class="taxi-card__driver">{{ room.taxi?.driverName }}</p>
          </div>
          <p v-else-if="room.status === 'failed'" class="status-hint">
            배차가 실패했어요. 인원 모집을 조정하거나 다시 시도해 주세요.
          </p>
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
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRoomById, mockRooms } from '@/data/mockRooms'
import type { RoomPreview } from '@/types/rooms'
import RouteMapBox from '@/components/RouteMapBox.vue'
import { useRoomMembership } from '@/composables/useRoomMembership'

const route = useRoute()
const router = useRouter()
const fallbackRoomId = mockRooms[0]?.id ?? ''
const { joinedRooms, leaveRoom: abandonRoom, updateSeat, setActiveRoom, syncRoomSnapshot } =
  useRoomMembership()

const roomId = computed(() => (route.params.id as string | undefined) ?? fallbackRoomId)
const membership = computed(() => joinedRooms.value.find(entry => entry.roomId === roomId.value) ?? null)
const room = computed<RoomPreview | null>(() => getRoomById(roomId.value) ?? membership.value?.roomSnapshot ?? null)
const seatFromQuery = computed(() => {
  const seatQuery = route.query.seat
  if (!seatQuery) return null
  const seat = Array.isArray(seatQuery) ? seatQuery[0] : seatQuery
  const parsed = Number(seat)
  return Number.isNaN(parsed) ? null : parsed
})
const seatNumber = computed(() => membership.value?.seatNumber ?? seatFromQuery.value)

const participants = computed(() => [
  { id: 'p1', name: '이유진', initials: 'YJ', role: '방장', seat: 1 },
  { id: 'p2', name: '최우식', initials: 'WS', seat: 2 },
  { id: 'p3', name: '박지연', initials: 'JY', seat: 3 },
  {
    id: 'me',
    name: '나',
    initials: seatNumber.value ? seatNumber.value.toString() : 'ME',
    seat: seatNumber.value,
  },
])
const participantCount = computed(() => Math.max(participants.value.length, 1))
const perPersonFare = computed(() => {
  const fare = room.value?.fare
  return fare ? Math.round(fare / participantCount.value) : undefined
})

const showRouteMap = ref(false)

function changeSeat() {
  router.push({ name: 'seat-selection', query: { roomId: roomId.value } })
}

function leaveRoom() {
  if (roomId.value) {
    abandonRoom(roomId.value)
  }
  router.push({ name: 'find-room' })
}

function retryDispatch() {
  alert('배차를 다시 시도합니다. 조금만 기다려 주세요!')
}

function toggleRouteMap() {
  showRouteMap.value = !showRouteMap.value
}

type DispatchStatus = NonNullable<RoomPreview['status']>

const STATUS_LABELS: Record<DispatchStatus, string> = {
  recruiting: '모집 중',
  dispatching: '배차 중',
  success: '배차 성공',
  failed: '배차 실패',
}

const STATUS_DESCRIPTIONS: Record<DispatchStatus, string> = {
  recruiting: '인원을 모집 중입니다.',
  dispatching: '택시 배차를 진행하고 있어요.',
  success: '배차가 완료되어 출발을 기다리고 있어요.',
  failed: '배차가 실패되어 다시 시도해야 해요.',
}

const statusInfo = computed(() => {
  const currentStatus = (room.value?.status as DispatchStatus | undefined) ?? 'recruiting'
  return {
    key: currentStatus,
    label: STATUS_LABELS[currentStatus],
    description: STATUS_DESCRIPTIONS[currentStatus],
  }
})

const showTaxiInfo = computed(() => room.value?.status === 'success' && room.value?.taxi)

function formatFare(amount?: number) {
  if (amount == null) return '확정 전'
  return `₩ ${amount.toLocaleString('ko-KR')}`
}

watch(
  () => roomId.value,
  id => {
    if (id) {
      setActiveRoom(id)
    }
  },
  { immediate: true },
)

watch(
  () => room.value,
  value => {
    if (roomId.value && value) {
      syncRoomSnapshot(roomId.value, value)
    }
  },
  { immediate: true },
)

watch(
  [() => roomId.value, () => seatFromQuery.value],
  ([id, seat]) => {
    if (id && typeof seat === 'number') {
      updateSeat(id, seat)
    }
  },
  { immediate: true },
)
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

.fare-summary__item strong {
  font-size: 22px;
  color: #7c2d12;
}

.fare-summary__hint {
  margin: 0;
  font-size: 13px;
  color: #92400e;
  background: rgba(251, 191, 36, 0.18);
  padding: 10px 12px;
  border-radius: 14px;
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

@media (max-width: 720px) {
  .room-panel--status,
  .room-panel--participants {
    grid-column: auto;
  }
}
</style>
