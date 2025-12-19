<template>
  <section class="my-rooms">
    <header class="my-rooms__hero">
      <h1>나의 방</h1>
      <div class="hero-actions">
        <button
          type="button"
          class="hero-btn hero-btn--refresh"
          :disabled="isLoading"
          @click="loadMyRooms"
        >
          {{ isLoading ? '불러오는 중...' : '목록 새로고침' }}
        </button>
        <button type="button" class="hero-btn" @click="goFindRoom">다른 방 찾기</button>
      </div>
      <p v-if="statusMessage" class="my-rooms__status">{{ statusMessage }}</p>
    </header>

    <section v-if="isLoading" class="room-empty room-empty--status">
      <p class="room-empty__title">내 방 목록을 불러오는 중이에요...</p>
    </section>

    <section v-else-if="errorMessage" class="room-empty room-empty--status">
      <div class="room-empty__body">
        <p class="room-empty__title">{{ errorMessage }}</p>
        <button type="button" class="btn btn--primary" @click="loadMyRooms">다시 시도</button>
      </div>
    </section>

    <section v-else-if="roomCards.length" class="room-list">
      <article v-for="entry in roomCards" :key="entry.roomId" class="room-card">
        <header class="room-card__header">
          <p class="room-card__status" :class="`room-card__status--${entry.statusKey}`">
            {{ entry.statusLabel }}
          </p>
          <h2>{{ entry.room.title }}</h2>
          <p class="room-card__route">
            {{ entry.room.departure.label }} → {{ entry.room.arrival.label }}
          </p>
        </header>
        <dl class="room-card__meta">
          <div>
            <dt>출발 시간</dt>
            <dd>{{ entry.room.time }}</dd>
          </div>
          <div>
            <dt>참여일</dt>
            <dd>{{ entry.joinedAtLabel }}</dd>
          </div>
          <div>
            <dt>내 좌석</dt>
            <dd>{{ entry.seatNumber ? `${entry.seatNumber}번` : '미선택' }}</dd>
          </div>
        </dl>
        <footer class="room-card__actions">
          <div class="room-card__split-actions">
            <button type="button" class="btn btn--ghost" @click="enterRoom(entry)">
              {{ entry.seatNumber ? '방 입장' : '좌석 먼저 선택' }}
            </button>
            <button
              type="button"
              class="btn btn--ghost"
              :disabled="entry.leaveLocked || leavingRoomId === entry.roomId"
              @click="dropRoom(entry.roomId)"
            >
              {{ leavingRoomId === entry.roomId ? '방 나가는 중...' : '방 나가기' }}
            </button>
          </div>
          <button
            v-if="entry.isHost"
            type="button"
            class="btn btn--settle"
            :disabled="!entry.canSettle"
            @click="goToSettlement(entry.roomId)"
          >
            정산하기
          </button>
        </footer>
      </article>
    </section>

    <section v-else class="room-empty">
      <p class="room-empty__title">아직 참여한 방이 없어요.</p>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchMyRooms, leaveRoomFromApi } from '@/api/rooms'
import { useRoomMembership } from '@/composables/useRoomMembership'
import type { JoinedRoomEntry } from '@/composables/useRoomMembership'
import type { RoomPreview } from '@/types/rooms'
import { connectRoomsRefresh } from '@/services/roomSocket'

const router = useRouter()
const { joinedRooms, leaveRoom, setActiveRoom, replaceRooms, completedRooms } = useRoomMembership()
const isLoading = ref(false)
const errorMessage = ref('')
const lastUpdatedAt = ref<string | null>(null)
const leavingRoomId = ref<string | null>(null)
const disconnectRoomsRefresh = ref<null | (() => void)>(null)

const STATUS_META: Partial<Record<NonNullable<RoomPreview['status']>, { label: string }>> = {
  recruiting: { label: '모집 중' },
  requesting: { label: '호출 준비' },
  matching: { label: '배차 중' },
  dispatching: { label: '배차 중' },
  driver_assigned: { label: '배차 완료' },
  arriving: { label: '픽업 이동 중' },
  aboard: { label: '이동 중' },
  success: { label: '탑승 완료' },
  failed: { label: '탑승 실패' },
}

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
})

type RoomCard = {
  roomId: string
  room: RoomPreview
  seatNumber: number | null
  joinedAtLabel: string
  statusLabel: string
  statusKey: string
  role?: string
  dispatchSnapshot?: JoinedRoomEntry['dispatchSnapshot']
  isHost: boolean
  canSettle: boolean
  leaveLocked: boolean
}

const completedRoomIds = computed(() => new Set(completedRooms.value.map(entry => entry.roomId)))

const statusMessage = computed(() => {
  if (isLoading.value || errorMessage.value) return ''
  if (lastUpdatedAt.value) {
    const date = new Date(lastUpdatedAt.value)
    if (!Number.isNaN(date.getTime())) {
      return `마지막 업데이트 · ${dateFormatter.format(date)}`
    }
  }
  return ''
})

const roomCards = computed<RoomCard[]>(() =>
  joinedRooms.value
    .filter(entry => !completedRoomIds.value.has(entry.roomId))
    .map(entry => {
      const room = entry.roomSnapshot
      const hasDispatchEvidence = Boolean(
        entry.dispatchSnapshot?.analysis ||
          entry.dispatchSnapshot?.message ||
          entry.dispatchSnapshot?.completedAt ||
          room.taxi?.carNumber ||
          room.taxi?.driverName ||
          room.taxi?.carModel,
      )
      const statusKey = hasDispatchEvidence
        ? 'driver_assigned'
        : room.status ?? 'recruiting'
      const joinedAtLabel = formatJoinedAt(entry.joinedAt)
      const roleLabel = (entry.role ?? '').toLowerCase()
      const isHost =
        roleLabel.includes('host') ||
        roleLabel.includes('방장') ||
        roleLabel.includes('leader') ||
        entry.seatNumber === 1
      const canSettle = isHost && hasDispatchEvidence
      const leaveLockedStatuses = new Set(['driver_assigned', 'arriving', 'aboard', 'success'])
      const leaveLocked = leaveLockedStatuses.has(statusKey)
      return {
        roomId: entry.roomId,
        room,
        seatNumber: entry.seatNumber,
        joinedAtLabel,
        statusLabel: STATUS_META[statusKey as keyof typeof STATUS_META]?.label ?? '모집 중',
        statusKey,
        role: entry.role,
        dispatchSnapshot: entry.dispatchSnapshot,
        isHost,
        canSettle,
        leaveLocked,
      }
    }),
)

function formatJoinedAt(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '참여 시간 미확인'
  return dateFormatter.format(date)
}

function goFindRoom() {
  router.push({ name: 'find-room' })
}

function goToSettlement(roomId: string) {
  if (!roomId) return
  router.push({ name: 'receipt-scan', query: { roomId } })
}

function resolveErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) {
    return err.message || fallback
  }
  if (typeof err === 'string' && err.trim()) {
    return err
  }
  return fallback
}

async function loadMyRooms() {
  if (isLoading.value) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    const entries = await fetchMyRooms()
    replaceRooms(entries)
    lastUpdatedAt.value = new Date().toISOString()
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error, '내 방 목록을 불러오지 못했어요.')
  } finally {
    isLoading.value = false
  }
}

async function setupRoomsRefresh() {
  const disconnect = await connectRoomsRefresh(() => loadMyRooms())
  disconnectRoomsRefresh.value = disconnect
}

onMounted(() => {
  loadMyRooms()
  void setupRoomsRefresh()
})

onBeforeUnmount(() => {
  disconnectRoomsRefresh.value?.()
})

function enterRoom(entry: RoomCard) {
  setActiveRoom(entry.roomId)
  if (entry.seatNumber) {
    router.push({ name: 'room-detail', params: { id: entry.roomId } })
    return
  }
  router.push({ name: 'seat-selection', query: { roomId: entry.roomId } })
}

async function dropRoom(roomId: string) {
  if (leavingRoomId.value) return
  leavingRoomId.value = roomId
  try {
    await leaveRoomFromApi(roomId)
    leaveRoom(roomId)
    await loadMyRooms()
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error, '방 나가기에 실패했어요.')
  } finally {
    leavingRoomId.value = null
  }
}
</script>

<style scoped>
.my-rooms {
  min-height: calc(100dvh - var(--header-h, 0px) - var(--tab-h, 64px));
  padding: clamp(28px, 6vw, 60px) clamp(18px, 5vw, 54px) clamp(28px, 5vh, 48px);
  padding-bottom: calc(
    clamp(28px, 5vh, 48px) + var(--tab-h, 64px) + env(safe-area-inset-bottom, 0px)
  );
  background: #fff7e1;
  color: #3b2600;
  display: grid;
  gap: 28px;
  grid-template-rows: auto 1fr;
  align-content: start;
}

.my-rooms__hero {
  display: grid;
  gap: 10px;
  padding: 0 0 12px;
  border-bottom: 1px solid rgba(228, 180, 97, 0.6);
}

.my-rooms__hero h1 {
  margin: 0;
  font-size: clamp(28px, 5vw, 36px);
  color: #2b1400;
}

.my-rooms__status {
  margin: 0;
  font-size: 13px;
  color: #a16207;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-btn {
  justify-self: flex-start;
  padding: 10px 20px;
  border-radius: 999px;
  border: none;
  background: rgba(250, 204, 21, 0.18);
  color: #a16207;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.hero-btn:hover {
  background: rgba(250, 204, 21, 0.32);
  color: #92400e;
}

.hero-btn--refresh {
  border: 1px solid rgba(250, 204, 21, 0.45);
  background: transparent;
}

.hero-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.room-list {
  display: grid;
  gap: 18px;
}

.room-card {
  border-radius: 24px;
  padding: clamp(16px, 3.2vw, 24px) clamp(20px, 4vw, 28px) clamp(22px, 4vw, 28px);
  background: #fff;
  border: 1px solid #f3d193;
  display: grid;
  gap: 16px;
  align-self: start;
}

.room-card__header h2 {
  margin: 6px 0 4px;
  font-size: 20px;
  color: #3b2600;
}

.room-card__route {
  margin: 0;
  color: #a16207;
}

.room-card__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 237, 213, 0.9);
  color: #b45309;
}

.room-card__status--success {
  background: rgba(187, 247, 208, 0.9);
  color: #15803d;
}

.room-card__status--driver_assigned {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(74, 222, 128, 0.4));
  color: #15803d;
}

.room-card__status--dispatching {
  background: rgba(254, 240, 138, 0.9);
  color: #a16207;
}

.room-card__status--requesting,
.room-card__status--matching,
.room-card__status--arriving,
.room-card__status--aboard {
  background: rgba(254, 240, 138, 0.9);
  color: #a16207;
}

.room-card__status--failed {
  background: rgba(254, 202, 202, 0.9);
  color: #b91c1c;
}

.room-card__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin: 0;
}

.room-card__meta div {
  display: grid;
  gap: 4px;
}

.room-card__meta dt {
  font-size: 11px;
  color: #c2410c;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.room-card__meta dd {
  margin: 0;
  font-size: 15px;
  color: #4b2c06;
}

.room-card__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 0.5rem;
}

.room-card__split-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.btn {
  border: none;
  border-radius: 999px;
  padding: 10px 18px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  background: rgba(250, 204, 21, 0.18);
  color: #a16207;
  transition: background 0.2s ease, color 0.2s ease;
}

.btn--settle {
  width: 100%;
  border-radius: 18px;
  border: none;
  padding: 12px 18px;
  background: rgba(34, 197, 94, 0.18);
  color: #0f8f3a;
  font-weight: 700;
}
.btn--settle:not(:disabled):hover,
.btn--settle:not(:disabled):active {
  background: rgba(34, 197, 94, 0.28);
  color: #0f8f3a;
}
.btn--settle:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  pointer-events: none;
  box-shadow: none;
}
.btn--settle:disabled:hover,
.btn--settle:disabled:active {
  background: #e5e7eb;
  color: #9ca3af;
}

.btn--ghost {
  background: rgba(250, 204, 21, 0.12);
  color: #a16207;
}
.btn--ghost:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
  pointer-events: none;
  box-shadow: none;
}
.btn--ghost:disabled:hover,
.btn--ghost:disabled:active {
  background: #f3f4f6;
  color: #9ca3af;
}

.btn:not(.btn--settle):hover {
  background: rgba(250, 204, 21, 0.32);
  color: #7c2d12;
}

.room-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  text-align: center;
}

.room-empty--status {
  flex-direction: column;
  gap: 14px;
}

.room-empty__body {
  display: grid;
  gap: 12px;
  justify-items: center;
}

.room-empty__title {
  margin: 0;
  font-size: 20px;
  line-height: 1.6;
  font-weight: 600;
  color: #a16207;
}
</style>
