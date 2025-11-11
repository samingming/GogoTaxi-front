<template>
  <section class="my-rooms">
    <header class="my-rooms__hero">
      <p class="my-rooms__eyebrow">참여 중인 방</p>
      <h1>나의 방</h1>
      <p class="my-rooms__desc">
        방찾기에서 합류한 방이 여기에 정리돼요. 좌석을 확정하거나 방 세부 정보로 바로 들어갈 수 있어요.
      </p>
      <button type="button" class="hero-btn" @click="goFindRoom">다른 방 찾기</button>
    </header>

    <section v-if="roomCards.length" class="room-list">
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
          <button type="button" class="btn btn--primary" @click="enterRoom(entry)">
            {{ entry.seatNumber ? '방 입장' : '좌석 먼저 선택' }}
          </button>
          <button type="button" class="btn btn--ghost" @click="dropRoom(entry.roomId)">
            방 나가기
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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomMembership } from '@/composables/useRoomMembership'
import { getRoomById } from '@/data/mockRooms'
import type { RoomPreview } from '@/types/rooms'

const router = useRouter()
const { joinedRooms, leaveRoom, setActiveRoom } = useRoomMembership()

const STATUS_META: Record<NonNullable<RoomPreview['status']>, { label: string }> = {
  recruiting: { label: '모집 중' },
  dispatching: { label: '배차 중' },
  success: { label: '배차 완료' },
  failed: { label: '배차 실패' },
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
}

const roomCards = computed<RoomCard[]>(() =>
  joinedRooms.value.map(entry => {
    const room = getRoomById(entry.roomId) ?? entry.roomSnapshot
    const statusKey = room.status ?? 'recruiting'
    const joinedAtLabel = formatJoinedAt(entry.joinedAt)
    return {
      roomId: entry.roomId,
      room,
      seatNumber: entry.seatNumber,
      joinedAtLabel,
      statusLabel: STATUS_META[statusKey as keyof typeof STATUS_META]?.label ?? '진행 중',
      statusKey,
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

function enterRoom(entry: RoomCard) {
  setActiveRoom(entry.roomId)
  if (entry.seatNumber) {
    router.push({ name: 'room-detail', params: { id: entry.roomId } })
    return
  }
  router.push({ name: 'seat-selection', query: { roomId: entry.roomId } })
}

function dropRoom(roomId: string) {
  leaveRoom(roomId)
}
</script>

<style scoped>
.my-rooms {
  min-height: calc(100dvh - var(--header-h, 0px) - var(--tab-h, 64px));
  padding: clamp(28px, 6vw, 60px) clamp(18px, 5vw, 54px) clamp(28px, 5vh, 48px);
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

.my-rooms__eyebrow {
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(217, 119, 6, 0.9);
}

.my-rooms__hero h1 {
  margin: 0;
  font-size: clamp(26px, 5vw, 34px);
  color: #3b2600;
}

.my-rooms__desc {
  margin: 0;
  color: #6b3b00;
  font-size: 15px;
  line-height: 1.6;
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

.room-card__status--dispatching {
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
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-start;
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

.btn--primary {
  background: rgba(251, 191, 36, 0.4);
  color: #92400e;
}

.btn--ghost {
  background: rgba(250, 204, 21, 0.12);
  color: #a16207;
}

.btn:hover {
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

.room-empty__title {
  margin: 0;
  font-size: 20px;
  line-height: 1.6;
  font-weight: 600;
  color: #a16207;
}
</style>
