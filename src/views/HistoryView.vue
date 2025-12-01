<template>
  <div class="history-wrapper">
    <div class="history-container">
      <header class="history-header">
        <button type="button" class="back-button" @click="goBack" :aria-label="labels.back">
          <img :src="arrowBackIcon" alt="" class="back-icon" aria-hidden="true" />
        </button>
        <h1 class="history-title">{{ labels.title }}</h1>
        <span class="header-spacer" aria-hidden="true"></span>
      </header>

      <main class="history-list">
        <p v-if="isLoading" class="history-status">{{ labels.loadingHistory }}</p>
        <div v-else-if="errorMessage" class="history-status history-status--error">
          <p>{{ errorMessage }}</p>
          <button type="button" class="status-button" @click="loadRideHistory">
            {{ labels.retry }}
          </button>
        </div>
        <p v-else-if="!rides.length" class="history-status history-status--empty">
          {{ labels.emptyHistory }}
        </p>
        <template v-else>
          <section v-for="ride in rides" :key="ride.id" class="history-card">
            <header class="card-header">
              <div class="ride-meta">
                <span class="ride-icon" aria-hidden="true">&#128661;</span>
                <div>
                  <h2>{{ labels.rideType }}</h2>
                  <p class="ride-date">{{ ride.date }}</p>
                </div>
              </div>
            </header>

            <dl class="ride-details">
              <div class="ride-row">
                <dt>{{ labels.duration }}</dt>
                <dd>{{ ride.time }}</dd>
              </div>
              <div class="ride-row">
                <dt>{{ labels.origin }}</dt>
                <dd>{{ ride.origin }}</dd>
              </div>
              <div class="ride-row">
                <dt>{{ labels.destination }}</dt>
                <dd>{{ ride.destination }}</dd>
              </div>
              <div class="ride-row total">
                <dt>{{ labels.fare }}</dt>
                <dd>{{ ride.fare }}</dd>
              </div>
            </dl>

            <div class="ride-review">
              <div class="ride-review__header">
                <p class="ride-review__label">{{ labels.yourReview }}</p>
                <div class="ride-review__rating" :aria-label="`별점 ${ride.rating || 0}점`">
                  <span
                    v-for="star in stars"
                    :key="star"
                    class="ride-review__star"
                    :class="{ 'ride-review__star--active': star <= (ride.rating || 0) }"
                    aria-hidden="true"
                  >
                    ★
                  </span>
                  <span class="ride-review__score">
                    {{ ride.rating ? `${ride.rating} / 5` : labels.notReviewed }}
                  </span>
                </div>
              </div>
              <p class="ride-review__comment">
                {{ ride.comment || labels.noComment }}
              </p>
            </div>

            <div class="card-actions" v-if="ride.roomId">
              <button
                type="button"
                class="action-button action-button--primary"
                @click="goToReview(ride.roomId)"
              >
                {{ labels.review }}
              </button>
            </div>
          </section>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import arrowBackIcon from '@/assets/arrowback.svg'
import { fetchRideHistory, type RideHistoryEntry } from '@/services/rideHistoryService'
import { fetchMyReviews } from '@/services/reviewService'

type DisplayRide = {
  id: string
  roomId: string
  date: string
  time: string
  origin: string
  destination: string
  fare: string
  rating: number | null
  comment: string
}

const router = useRouter()
const rides = ref<DisplayRide[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const stars = [1, 2, 3, 4, 5]

const labels = {
  back: '마이페이지로 돌아가기',
  title: '이용 기록',
  rideType: '택시',
  duration: '운행 시간',
  origin: '출발',
  destination: '도착',
  fare: '금액',
  review: '평가하기',
  loadingHistory: '이용 기록을 불러오는 중이에요...',
  retry: '다시 시도',
  emptyHistory: '이용 기록이 아직 없어요.',
  yourReview: '나의 후기',
  notReviewed: '아직 후기를 작성하지 않았어요',
  noComment: '작성된 후기가 없습니다.',
}

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  weekday: 'short',
})
const timeFormatter = new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' })
const currencyFormatter = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 })

function formatDate(value: Date | null) {
  if (!value) return '날짜 정보 없음'
  return dateFormatter.format(value)
}

function formatTimeRange(start: Date | null, end: Date | null) {
  if (start && end) return `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`
  if (start) return timeFormatter.format(start)
  if (end) return timeFormatter.format(end)
  return '시간 정보 없음'
}

function formatFare(amount: number) {
  const normalized = Number.isFinite(amount) ? Math.max(0, amount) : 0
  return `${currencyFormatter.format(normalized)}원`
}

function mapHistoryToRide(entry: RideHistoryEntry, reviewMap: Map<string, { rating: number; comment?: string }>): DisplayRide {
  const start = entry.room?.departureTime ? new Date(entry.room.departureTime) : null
  const end = entry.settledAt ? new Date(entry.settledAt) : null
  const review = reviewMap.get(entry.roomId)
  return {
    id: entry.id,
    roomId: entry.roomId,
    date: formatDate(start ?? end),
    time: formatTimeRange(start, end),
    origin: entry.room?.departureLabel ?? '출발지 정보 없음',
    destination: entry.room?.arrivalLabel ?? '도착지 정보 없음',
    fare: formatFare(entry.actualFare ?? entry.netAmount ?? 0),
    rating: review?.rating ?? null,
    comment: review?.comment ?? '',
  }
}

const loadRideHistory = async () => {
  if (isLoading.value) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [histories, reviews] = await Promise.all([
      fetchRideHistory(),
      fetchMyReviews().catch(() => []),
    ])
    const reviewMap = new Map<string, { rating: number; comment?: string }>()
    reviews.forEach(review => {
      reviewMap.set(review.roomId, { rating: review.rating, comment: review.comment })
    })
    rides.value = histories.map(history => mapHistoryToRide(history, reviewMap))
  } catch (error) {
    console.error('Failed to load ride history', error)
    errorMessage.value = '이용 기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
    rides.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadRideHistory()
})

const goBack = () => {
  router.back()
}

const goToReview = (roomId: string) => {
  router
    .push({ name: 'ride-review', query: { roomId } })
    .catch(error => {
      console.warn('리뷰 페이지 이동 중 오류', error)
    })
}
</script>

<style scoped>
.history-wrapper {
  min-height: 100vh;
  background: #3a2e20;
  font-family: "Pretendard", "Apple SD Gothic Neo", sans-serif;
  padding: 2rem 1.25rem 4rem;
  display: flex;
  justify-content: center;
  width: 100%;
}

.history-container {
  width: min(640px, 100%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
}

.history-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
}

.history-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #eeeff2;
  justify-self: center;
  text-align: center;
}

.header-spacer {
  width: 24px;
  height: 24px;
  display: block;
}

.back-button {
  border: none;
  background: transparent;
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.back-button:focus-visible {
  outline: 3px solid rgba(203, 128, 38, 0.4);
  border-radius: 8px;
  outline-offset: 2px;
}

.back-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.history-card {
  background: #eeeff2;
  border-radius: 20px;
  padding: 1.5rem 1.45rem 1.3rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ride-meta {
  display: flex;
  align-items: center;
  gap: 0.95rem;
}

.ride-icon {
  font-size: 1.7rem;
}

.ride-meta h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #2f2f33;
}

.ride-date {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  color: #6a6a70;
}

.ride-details {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin: 0;
}

.ride-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.95rem;
  color: #3a3a40;
}

.ride-row dt {
  font-weight: 600;
  color: #6a6a70;
}

.ride-row.total dt {
  color: #2f2f33;
}

.ride-row.total dd {
  font-weight: 700;
  color: #3a3a40;
}

.ride-row dd {
  margin: 0;
  text-align: right;
  flex: 1;
}

.card-actions {
  display: flex;
  margin-top: 0.4rem;
}

.action-button {
  flex: 1;
  border: none;
  border-radius: 14px;
  padding: 0.75rem 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease;
}

.action-button--primary {
  background: #3a2e20;
  color: #ffffff;
}

.action-button:hover {
  transform: translateY(-2px);
}

.action-button:focus-visible {
  outline: 2px solid rgba(255, 119, 95, 0.35);
  outline-offset: 2px;
}

@media (min-width: 768px) {
  .history-wrapper {
    padding: 4rem 2.5rem;
  }

  .history-card {
    padding: 1.6rem 1.8rem 1.4rem;
  }

  .ride-row {
    font-size: 1rem;
  }
}
</style>
