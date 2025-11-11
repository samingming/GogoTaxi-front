<template>
  <section class="review">
    <div class="review-card">
      <button type="button" class="report-btn" @click="openReport">신고하기</button>
      <header class="review-header">
        <img class="driver-avatar" :src="logoMy" alt="기사님 프로필" />
        <div class="review-header__txt">
          <p class="sub">운행이 종료되었습니다.</p>
          <h1>기사님 서비스는 어떠셨나요?</h1>
        </div>
      </header>

      <div class="rating">
        <p class="rating__label">별점을 선택해 주세요.</p>
        <div class="rating__stars" role="radiogroup" aria-label="별점 선택">
          <button
            v-for="star in stars"
            :key="star"
            type="button"
            class="star-btn"
            :class="{ 'star-btn--active': star <= activeStar }"
            :aria-label="`${star}점`"
            :aria-pressed="star === rating"
            @click="setRating(star)"
            @mouseenter="hover(star)"
            @mouseleave="hover(null)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2.8l2.7 5.5 6 0.9-4.3 4.2 1 5.9L12 16.9l-5.4 2.8 1-5.9-4.3-4.2 6-0.9z"
              />
            </svg>
          </button>
        </div>
        <transition name="fade">
          <p v-if="rating" key="selected" class="rating__summary">
            {{ ratingText }}
          </p>
        </transition>
      </div>

      <label class="feedback">
        <span class="feedback__label">후기를 남겨 주세요.</span>
        <textarea
          v-model="comment"
          rows="5"
          placeholder="친절함, 안전 운전, 차량 상태 등 자유롭게 작성해 주세요."
        />
      </label>

      <div class="actions">
        <button type="button" class="btn btn--ghost" @click="skip">나중에 할게요.</button>
        <button type="button" class="btn btn--primary" :disabled="!rating" @click="submit">
          후기 제출
        </button>
      </div>
    </div>

    <transition name="fade">
      <div v-if="reportOpen" class="report-overlay" role="dialog" aria-modal="true">
        <section class="seat-select seat-select--report">
          <div class="seat-card">
            <header class="seat-card__header seat-card__header--report">
              <h2>신고할 좌석을 선택해 주세요.</h2>
              <p class="seat-card__desc">
                탑승 시 예약했던 좌석 번호를 기준으로 신고가 접수됩니다. 문제가 있었던 좌석을 선택해 신고를 이어가 주세요.
              </p>
            </header>

            <div class="seat-layout" role="radiogroup" aria-label="좌석 선택">
              <svg class="seat-layout__car" viewBox="0 0 200 400" aria-hidden="true">
                <defs>
                  <linearGradient id="car-body" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#f6f7fb" />
                    <stop offset="100%" stop-color="#e3e6ee" />
                  </linearGradient>
                </defs>
                <path
                  d="M50 10 Q100 -10 150 10 L180 80 L180 320 L150 390 Q100 410 50 390 L20 320 L20 80 Z"
                  fill="url(#car-body)"
                  stroke="#cbd2e1"
                  stroke-width="3"
                />
                <rect x="52" y="70" width="96" height="90" rx="18" fill="#fff" stroke="#d1d7e3" />
                <rect x="52" y="240" width="96" height="90" rx="18" fill="#fff" stroke="#d1d7e3" />
                <line x1="100" y1="70" x2="100" y2="160" stroke="#dbe2ef" stroke-width="3" />
                <line x1="84" y1="240" x2="84" y2="330" stroke="#dbe2ef" stroke-width="3" />
                <line x1="116" y1="240" x2="116" y2="330" stroke="#dbe2ef" stroke-width="3" />
                <rect x="30" y="120" width="140" height="30" rx="10" fill="#dfe4ef" />
                <rect x="30" y="250" width="140" height="30" rx="10" fill="#dfe4ef" />
                <circle cx="58" cy="56" r="12" fill="#dfe4ef" />
                <circle cx="142" cy="56" r="12" fill="#dfe4ef" />
                <circle cx="58" cy="344" r="12" fill="#dfe4ef" />
                <circle cx="142" cy="344" r="12" fill="#dfe4ef" />
              </svg>

              <div class="seat-layout__seats">
                <button
                  v-for="seat in seats"
                  :key="seat.number"
                  type="button"
                  class="seat-marker"
                  :class="[
                    seat.modifier ? 'seat-marker--' + seat.modifier : '',
                    { 'seat-marker--active': seat.number === selectedSeat },
                  ]"
                  :style="seatStyle(seat)"
                  :aria-pressed="seat.number === selectedSeat"
                  @click="selectSeat(seat.number)"
                >
                  <span>{{ seat.number }}</span>
                </button>
              </div>
            </div>

            <p v-if="selectedSeat" class="seat-card__selection">
              {{ selectedSeat }}번 좌석을 선택했어요. 아래 신고 내용을 작성해 주세요.
            </p>
            <p v-else class="seat-card__selection--hint">
              문제가 있었던 좌석을 눌러 신고를 시작해 주세요.
            </p>

            <div v-if="selectedSeat !== null" class="report-form">
              <label class="report-form__label" for="report-message">
                신고 내용<span aria-hidden="true" class="required-dot">•</span>
              </label>
              <textarea
                id="report-message"
                class="report-form__textarea"
                v-model="reportMessage"
                rows="3"
                placeholder="문제가 발생했던 상황과 이유를 구체적으로 적어주세요."
              />
            </div>
            <p v-else class="report-form__hint">
              좌석을 선택한 후 신고 내용을 작성해 주세요.
            </p>

            <footer class="seat-card__actions seat-card__actions--report">
              <button type="button" class="btn btn--ghost" @click="closeReport">취소</button>
              <button
                type="button"
                class="btn btn--primary"
                :disabled="!canSubmitReport"
                @click="submitReport"
              >
                신고하기
              </button>
            </footer>
          </div>
        </section>
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import logoMy from '@/assets/logo_my.png'

const stars = [1, 2, 3, 4, 5]
const rating = ref(0)
const hovered = ref<number | null>(null)
const comment = ref('')
const reportOpen = ref(false)
const selectedSeat = ref<number | null>(null)
const reportMessage = ref('')
const router = useRouter()
interface SeatInfo {
  number: number
  modifier?:
    | 'driver'
    | 'front-passenger'
    | 'rear-left'
    | 'rear-center'
    | 'rear-right'
  x: number
  y: number
}

const seats: SeatInfo[] = [
  { number: 1, modifier: 'driver', x: 38, y: 28 },
  { number: 2, modifier: 'front-passenger', x: 62, y: 28 },
  { number: 3, modifier: 'rear-left', x: 26, y: 68 },
  { number: 4, modifier: 'rear-center', x: 50, y: 68 },
  { number: 5, modifier: 'rear-right', x: 74, y: 68 },
]

function seatStyle(seat: SeatInfo) {
  return {
    left: `${seat.x}%`,
    top: `${seat.y}%`,
  }
}

const activeStar = computed(() => hovered.value ?? rating.value)
const canSubmitReport = computed(
  () => selectedSeat.value !== null && reportMessage.value.trim().length > 2,
)

const ratingText = computed(() => {
  if (!rating.value) return ''
  switch (rating.value) {
    case 1:
      return '아쉬웠어요. 개선이 필요해요.'
    case 2:
      return '조금 아쉬웠어요.'
    case 3:
      return '괜찮았어요.'
    case 4:
      return '좋았어요!'
    case 5:
      return '최고였어요! 다음에도 함께하고 싶어요.'
    default:
      return ''
  }
})

function setRating(value: number) {
  rating.value = value
}

function hover(value: number | null) {
  hovered.value = value
}

function skip() {
  router.push({ name: 'home' })
}

function submit() {
  if (!rating.value) return
  // TODO: API 연동 예정
  alert(`별점 ${rating.value}점과 후기를 전송했습니다.\n\n${comment.value}`)
  rating.value = 0
  hovered.value = null
  comment.value = ''
  router.push({ name: 'home' })
}

function openReport() {
  reportOpen.value = true
  reportMessage.value = ''
}

function closeReport() {
  reportOpen.value = false
  selectedSeat.value = null
  reportMessage.value = ''
}

function selectSeat(seat: number) {
  selectedSeat.value = seat
}

function submitReport() {
  if (!canSubmitReport.value || !selectedSeat.value) return
  // TODO: 신고 API 연동 예정
  alert(
    `${selectedSeat.value}번 좌석 이용자를 신고 접수했습니다.\n\n신고 내용: ${reportMessage.value}`,
  )
  reportMessage.value = ''
  closeReport()
}
</script>

<style scoped>
.review {
  height: max(
    0px,
    calc(100dvh - var(--header-h) - var(--tab-h) - var(--safe-bottom) - var(--browser-ui-bottom))
  );
  min-height: max(
    0px,
    calc(100dvh - var(--header-h) - var(--tab-h) - var(--safe-bottom) - var(--browser-ui-bottom))
  );
  background: radial-gradient(circle at 20% 20%, rgba(255, 243, 210, 0.35), transparent 55%),
    radial-gradient(circle at 80% 15%, rgba(186, 214, 255, 0.3), transparent 55%),
    linear-gradient(180deg, #f3ede3 0%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(48px, 8vh, 90px) clamp(16px, 5vw, 40px);
  box-sizing: border-box;
}
.review-card {
  width: min(560px, 100%);
  background: rgba(255, 255, 255, 0.92);
  border-radius: 32px;
  padding: clamp(28px, 5vw, 36px);
  border: 1px solid rgba(120, 92, 68, 0.12);
  box-shadow: 0 30px 60px rgba(24, 18, 12, 0.16);
  display: grid;
  gap: clamp(24px, 4vw, 32px);
  position: relative;
  margin-bottom: var(--safe-bottom);
}
.review-header {
  display: flex;
  gap: 18px;
  align-items: center;
}
.driver-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.18);
}
.review-header__txt .sub {
  margin: 0;
  color: #85766a;
  font-size: 14px;
}
.review-header__txt h1 {
  margin: 6px 0 0;
  font-size: clamp(22px, 4vw, 26px);
  color: #2f241b;
}
.rating {
  display: grid;
  gap: 12px;
  justify-items: center;
}
.rating__label {
  margin: 0;
  color: #4f4338;
  font-weight: 600;
  text-align: center;
}
.rating__stars {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.star-btn {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  border: none;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.12);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}
.star-btn svg {
  width: 28px;
  height: 28px;
  fill: #e4d7c6;
  transition: fill 0.18s ease;
}
.star-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 24px rgba(255, 186, 0, 0.3);
}
.star-btn--active {
  background: linear-gradient(135deg, #facc15, #f59e0b);
}
.star-btn--active svg {
  fill: #ffffff;
}
.rating__summary {
  margin: 0;
  color: #c47a00;
  font-weight: 600;
  font-size: 14px;
  text-align: center;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.feedback {
  display: grid;
  gap: 10px;
}
.feedback__label {
  font-weight: 600;
  color: #4f4338;
}
.feedback textarea {
  resize: vertical;
  min-height: 120px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(120, 92, 68, 0.16);
  background: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  line-height: 1.5;
  color: #3d3228;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08);
}
.feedback textarea::placeholder {
  color: rgba(82, 70, 60, 0.6);
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.btn {
  border: none;
  border-radius: 999px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}
.btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
  transform: none;
  box-shadow: none;
}
.btn--ghost {
  background: rgba(79, 67, 56, 0.1);
  color: #4f4338;
}
.btn--ghost:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(79, 67, 56, 0.16);
}
.btn--primary {
  background: #facc15;
  color: #3b2400;
  box-shadow: none;
}
.btn--primary:hover:not(:disabled) {
  transform: translateY(-2px);
}
.report-btn {
  position: absolute;
  top: 20px;
  right: 24px;
  border: none;
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
}
.report-btn:hover {
  background: rgba(239, 68, 68, 0.16);
  transform: translateY(-1px);
}
.report-overlay {
  position: fixed;
  inset: 0;
  background: rgba(59, 39, 6, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 2000;
}
.seat-select--report {
  width: min(520px, 96%);
  border-radius: 32px;
  background: #fff7e1;
  padding: clamp(24px, 4vw, 36px);
  box-shadow: 0 28px 60px rgba(120, 72, 7, 0.25);
}
.seat-card {
  position: relative;
  display: grid;
  gap: 18px;
  color: #4b2c00;
}
.seat-card__header {
  text-align: center;
  display: grid;
  gap: 8px;
}
.seat-card__header h2 {
  margin: 0;
  font-size: clamp(22px, 4vw, 28px);
}
.seat-card__sub {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(193, 98, 7, 0.85);
}
.seat-card__desc {
  margin: 0;
  color: #663703;
  line-height: 1.5;
  font-size: 14px;
}
.seat-layout {
  position: relative;
  width: min(240px, 94%);
  margin: 0 auto;
  aspect-ratio: 2 / 3;
  background: #fffef8;
  border-radius: 28px;
  padding: 18px;
  border: 1px solid rgba(243, 193, 76, 0.6);
}
.seat-layout__car {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 24px;
  background: #fffdf4;
}
.seat-layout__seats {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}
.seat-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  width: clamp(38px, 14vw, 48px);
  height: clamp(46px, 16vw, 58px);
  border-radius: 14px;
  border: 2px solid rgba(250, 204, 21, 0.25);
  background: #fffdf4;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 16px;
  color: #a16207;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
  pointer-events: auto;
}
.seat-marker span {
  pointer-events: none;
}
.seat-marker:hover {
  transform: translate(-50%, -50%) translateY(-4px);
}
.seat-marker--driver {
  background: rgba(15, 23, 42, 0.08);
  color: rgba(15, 23, 42, 0.4);
  border-color: transparent;
  cursor: not-allowed;
  pointer-events: none;
}
.seat-marker--active {
  background: #facc15;
  color: #fffdf4;
  border-color: rgba(250, 184, 0, 0.3);
  box-shadow: 0 14px 24px rgba(184, 134, 11, 0.35);
}
.seat-card__selection,
.seat-card__selection--hint {
  margin: 0;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: #7c2d12;
  padding: 8px 0;
}
.seat-card__selection--hint {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #b86a1a;
}
.seat-card__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.seat-card__actions--report {
  justify-content: flex-end;
}
.seat-select--report .btn--ghost {
  background: #fef0c2;
  color: #7c2d12;
}
.seat-select--report .btn--ghost:hover:not(:disabled) {
  background: #fde7a3;
}
.report-form {
  display: grid;
  gap: 6px;
}
.report-form__hint {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 248, 229, 0.9);
  color: #7c2d12;
  font-size: 13px;
  text-align: center;
}
.report-form__label {
  font-size: 14px;
  font-weight: 600;
  color: #7c2d12;
}
.required-dot {
  margin-left: 4px;
  color: #ef4444;
  font-size: 12px;
  vertical-align: middle;
}
.report-form__textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(184, 134, 11, 0.35);
  background: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  resize: vertical;
  color: #3d3228;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.report-form__textarea:focus {
  outline: none;
  border-color: rgba(250, 204, 21, 0.7);
  box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.25);
}


@media (max-width: 520px) {
  .star-btn {
    width: 48px;
    height: 48px;
  }
  .star-btn svg {
    width: 24px;
    height: 24px;
  }
  .review-header {
    flex-direction: column;
    text-align: center;
  }
  .review-card {
    padding: 24px;
  }
  .actions {
    flex-direction: column-reverse;
  }
  .btn {
    width: 100%;
  }
  .seat-select--report {
    padding: 22px;
  }
  .seat-card__actions {
    flex-direction: column-reverse;
  }
}
</style>
