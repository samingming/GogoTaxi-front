<template>
  <section class="my-rooms">
    <header class="my-rooms__hero">
      <p class="hero__eyebrow">내 참여 현황</p>
      <h1>내가 들어간 방</h1>
      <p class="hero__desc">
        함께 달릴 방들을 한눈에 확인하고 좌석이나 배차 정보를 빠르게 살펴보세요.
      </p>
      <button type="button" class="hero__action" @click="goFindRoom">방 찾기 바로가기</button>
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
            <dt>참여 일시</dt>
            <dd>{{ entry.joinedAtLabel }}</dd>
          </div>
          <div>
            <dt>좌석</dt>
            <dd>{{ entry.seatNumber ? `${entry.seatNumber}번` : '미배정' }}</dd>
          </div>
        </dl>
        <footer class="room-card__actions">
          <button type="button" class="btn btn--primary" @click="enterRoom(entry)">
            {{ entry.seatNumber ? '방 입장' : '좌석 선택하기' }}
          </button>
          <button type="button" class="btn btn--ghost" @click="dropRoom(entry.roomId)">
            참여 취소
          </button>
        </footer>
      </article>
    </section>

    <section v-else class="room-empty">
      <div class="room-empty__card">
        <p class="room-empty__emoji">🚕</p>
        <p class="room-empty__title">아직 참여한 방이 없어요.</p>
        <p class="room-empty__desc">지금 방을 찾아 새로운 동승자들과 일정을 맞춰보세요.</p>
        <button type="button" class="hero__action" @click="goFindRoom">방 찾으러 가기</button>
      </div>
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
  dispatching: { label: '배차 진행' },
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
  padding: clamp(20px, 4vw, 36px);
  background: linear-gradient(180deg, #fff9eb 0%, #fff4d6 60%, #fff 100%);
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.my-rooms__hero {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 28px;
  padding: clamp(20px, 4vw, 32px);
  box-shadow: 0 16px 50px rgba(250, 204, 21, 0.2);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hero__eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #f59e0b;
}

.my-rooms__hero h1 {
  margin: 0;
  font-size: clamp(24px, 5vw, 32px);
  color: #0f172a;
}

.hero__desc {
  margin: 0;
  color: #91540c;
  font-size: 14px;
  line-height: 1.6;
}

.hero__action {
  align-self: flex-start;
  border: none;
  border-radius: 999px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 700;
  background: #fdd651;
  color: #7c2d12;
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(247, 144, 9, 0.3);
}

.room-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.room-card {
  border-radius: 24px;
  padding: clamp(18px, 3vw, 26px);
  background: #fffdfa;
  border: 1px solid rgba(249, 186, 20, 0.4);
  display: grid;
  gap: 16px;
  box-shadow: 0 14px 25px rgba(149, 72, 0, 0.08);
}

.room-card__header h2 {
  margin: 6px 0 4px;
  font-size: 20px;
  color: #3b2600;
}

.room-card__route {
  margin: 0;
  color: #a16207;
  font-weight: 600;
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

.room-card__status--dispatching {
  background: rgba(254, 240, 138, 0.85);
  color: #a16207;
}

.room-card__status--success {
  background: rgba(187, 247, 208, 0.9);
  color: #15803d;
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
  font-weight: 600;
}

.room-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.btn {
  border: none;
  border-radius: 999px;
  padding: 10px 18px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.btn--primary {
  background: rgba(251, 191, 36, 0.4);
  color: #92400e;
  box-shadow: 0 10px 20px rgba(251, 191, 36, 0.35);
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
  justify-content: center;
}

.room-empty__card {
  background: #fffef6;
  border-radius: 24px;
  padding: clamp(24px, 5vw, 40px);
  text-align: center;
  border: 1px dashed rgba(249, 186, 20, 0.5);
  max-width: 420px;
  display: grid;
  gap: 10px;
}

.room-empty__emoji {
  margin: 0;
  font-size: 32px;
}

.room-empty__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #7c2d12;
}

.room-empty__desc {
  margin: 0;
  font-size: 14px;
  color: #9a6a16;
}

@media (min-width: 960px) {
  .my-rooms {
    border-radius: 28px;
    overflow: hidden;
  }
}
</style>
