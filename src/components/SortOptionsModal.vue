<template>
  <div class="sort-modal-backdrop" role="dialog" aria-modal="true" @click.self="$emit('close')">
    <div class="sort-modal">
      <header class="sort-modal__header">
        <div>
          <h2>탐색 조건 설정</h2>
          <p>원하는 기준으로 방을 정렬해 보세요.</p>
        </div>
      </header>

      <section class="sort-modal__body">
        <div class="sort-modal__section">
          <label class="sort-modal__label">
            <span>정렬 기준</span>
            <select :value="sortMode" @change="handleSortModeChange">
              <option v-for="mode in sortModes" :key="mode.value" :value="mode.value">
                {{ mode.label }}
              </option>
            </select>
          </label>
        </div>

        <div class="sort-modal__section">
          <button
            type="button"
            class="loc-btn"
            :disabled="isLocating"
            @click="$emit('use-current-location')"
          >
            {{
              isLocating
                ? '위치 확인 중..'
                : hasUserLocation
                  ? '현재 위치 업데이트'
                  : '현재 위치 불러오기'
            }}
          </button>
        </div>

        <div class="sort-modal__section location-set">
          <div class="location-set__row">
            <div class="location-set__info">
              <p class="location-set__label">희망 출발지</p>
              <p class="location-set__value">{{ desiredDepartureLabel }}</p>
            </div>
            <div class="location-set__actions">
              <button type="button" class="loc-mini" @click="$emit('open-picker', 'departure')">
                지도에서 선택
              </button>
              <button
                v-if="hasDesiredDeparture"
                type="button"
                class="loc-clear"
                @click="$emit('clear-desired', 'departure')"
              >
                초기화
              </button>
            </div>
          </div>

          <div class="location-set__row">
            <div class="location-set__info">
              <p class="location-set__label">희망 도착지</p>
              <p class="location-set__value">{{ desiredArrivalLabel }}</p>
            </div>
            <div class="location-set__actions">
              <button type="button" class="loc-mini" @click="$emit('open-picker', 'arrival')">
                지도에서 선택
              </button>
              <button
                v-if="hasDesiredArrival"
                type="button"
                class="loc-clear"
                @click="$emit('clear-desired', 'arrival')"
              >
                초기화
              </button>
            </div>
          </div>
        </div>

        <!-- 시간: '미설정' 제거, 시간 선택 버튼만 -->
        <div class="sort-modal__section time-input">
          <span>희망 출발 시간</span>
          <div class="time-input__row">
            <button type="button" class="loc-mini" @click="$emit('open-time-picker')">
              시간 선택
            </button>
            <p v-if="hasPreferredTime" class="time-input__value">
              {{ formattedPreferredTime }}
            </p>
            <button
              v-if="hasPreferredTime"
              type="button"
              class="loc-clear"
              @click="$emit('clear-preferred-time')"
            >
              초기화
            </button>
          </div>
        </div>

        <p v-if="hint" class="sort-toolbar__hint">{{ hint }}</p>
      </section>

      <footer class="sort-modal__footer">
  <!-- 닫기(되돌리고 닫기) -->
  <button type="button" class="modal-close-btn" @click="$emit('close')">닫기</button>
  <!-- 확인(저장) -->
  <button type="button" class="modal-primary-btn" @click="$emit('confirm')">확인</button>
</footer>
    </div>
  </div>
</template>

<script setup lang="ts">
type SortMode = 'default' | 'nearest-departure' | 'nearest-arrival' | 'departure-time'

defineProps<{
  sortMode: SortMode
  sortModes: ReadonlyArray<{ value: SortMode; label: string }>
  desiredDepartureLabel: string
  desiredArrivalLabel: string
  hasDesiredDeparture: boolean
  hasDesiredArrival: boolean
  formattedPreferredTime: string
  hasPreferredTime: boolean
  isLocating: boolean
  hasUserLocation: boolean
  hint: string
}>()

const emit = defineEmits<{
  close: []                 // 취소(되돌리고 닫기)
  confirm: []               // 저장(확인)
  'select-sort-mode': [SortMode]
  'use-current-location': []
  'open-picker': ['departure' | 'arrival']
  'clear-desired': ['departure' | 'arrival']
  'open-time-picker': []
  'clear-preferred-time': []
}>()

function handleSortModeChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as SortMode
  emit('select-sort-mode', value)
}
</script>

<style scoped>
.sort-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(16px, 4vw, 32px);
  z-index: 1500;
}
.sort-modal {
  width: min(540px, 94vw);
  border-radius: 28px;
  background: #fffef8;
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
  display: flex;
  flex-direction: column;
  max-height: min(680px, 90vh);
}
.sort-modal__header { padding: 22px 24px 12px; }
.sort-modal__header h2 { margin: 0; font-size: 20px; color: #7c2d12; }
.sort-modal__header p { margin: 6px 0 0; font-size: 14px; color: #b45309; }

.sort-modal__body {
  padding: 0 24px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sort-modal__section { display: grid; gap: 10px; }

.sort-modal__label { display: grid; gap: 6px; font-size: 14px; color: #78350f; }
.sort-modal__label select{
  border-radius: 14px;
  border: 1px solid rgba(249,115,22,.4);
  padding: 10px 38px 10px 14px;
  background: #fffdf4 url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.41.59L6 5.17l4.59-4.58L12 2l-6 6-6-6L1.41.59z' fill='%23b45309'/%3E%3C/svg%3E") no-repeat right 16px center;
  background-size: 12px 8px;
  appearance: none; -webkit-appearance: none;
  font-size: 15px; color: #7c2d12;
}

.loc-btn{
  border:none; border-radius:16px; padding:12px;
  font-weight:600; background:rgba(251,191,36,.2); color:#92400e; cursor:pointer;
}
.loc-btn:disabled{ opacity:.6; cursor:progress; }

.loc-mini{
  border:none; border-radius:999px; padding:8px 14px;
  background:rgba(251,191,36,.25); color:#92400e; cursor:pointer;
  font-size:13px; font-weight:600;
}
.loc-mini:disabled{ opacity:.6; cursor:progress; }

.loc-clear{
  border:none; background:transparent; font-size:13px; color:#dc2626;
  cursor:pointer; font-weight:600;
}

.location-set{ display:grid; gap:10px; }
.location-set__row{ display:flex; align-items:center; justify-content:space-between; gap:12px; }
.location-set__info{ flex:1; display:flex; flex-direction:column; gap:4px; }
.location-set__label{ margin:0; font-size:12px; color:#b45309; }
.location-set__value{ margin:0; font-size:13px; font-weight:600; color:#7c2d12; }
.location-set__actions{ display:flex; gap:6px; }

.time-input{ display:flex; flex-direction:column; gap:6px; font-size:13px; color:#92400e; }
.time-input__row{ display:flex; gap:10px; align-items:center; }
.time-input__value{
  margin:0;
  padding:6px 12px;
  border-radius:999px;
  background:rgba(251,191,36,.15);
  color:#7c2d12;
  font-weight:600;
}

.sort-toolbar__hint{ margin:4px 0 0; font-size:12px; color:#b45309; }

.sort-modal__footer{
  padding:16px 24px 28px;
  border-top:1px solid rgba(15,23,42,.05);
  display:flex; justify-content:flex-end; gap:8px;
}

/* 확인(저장) — 새로 추가 */
.modal-primary-btn{
  border:none; border-radius:999px; padding:8px 14px;
  font-size:13px; font-weight:700;
  background:#facc15; color:#7c2d12; cursor:pointer;
  box-shadow:0 8px 20px rgba(245,158,11,.25);
}
.modal-primary-btn:hover{ filter:brightness(.98); }

/* 닫기 — 기존 디자인 그대로 */
.modal-close-btn{
  border:none; border-radius:999px; padding:8px 14px;
  font-size:13px; font-weight:600;
  background:rgba(251,191,36,.4); color:#92400e; cursor:pointer;
  transition:background .2s ease, color .2s ease, box-shadow .2s ease;
}
.modal-close-btn:hover{
  background:rgba(250,184,0,.6); color:#7c2d12;
  box-shadow:0 8px 20px rgba(245,158,11,.25);
}

@media (max-width: 540px){
  .sort-modal{ width:100%; height:auto; }
}
</style>
