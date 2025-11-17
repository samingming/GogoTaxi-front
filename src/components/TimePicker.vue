<template>
  <div class="time-picker" role="dialog" aria-modal="true">
    <div class="time-picker__backdrop" aria-hidden="true" @click="$emit('cancel')"></div>
    <div class="time-picker__panel" role="document">
      <header class="time-picker__header">
        <h3>희망 출발 시간을 선택해 주세요</h3>
        <p>아래 옵션에서 원하는 시간을 직접 선택해 주세요.</p>
      </header>

      <section class="time-picker__body">
        <div class="time-picker__display">
          <span class="time-display__period">{{ previewPeriodLabel }}</span>
          <span class="time-display__clock">{{ previewHour }}:{{ previewMinute }}</span>
        </div>

        <div class="time-picker__selectors">
          <div class="time-column time-column--period">
            <p>구분</p>
            <div class="chip-group">
              <button
                v-for="periodOption in periodOptions"
                :key="periodOption.value"
                type="button"
                class="selector-chip"
                :class="{ 'is-active': localPeriod === periodOption.value }"
                @click="localPeriod = periodOption.value"
              >
                {{ periodOption.label }}
              </button>
            </div>
          </div>

          <div class="time-column">
            <p>시간</p>
            <select class="time-select" v-model="localHour">
              <option v-for="hour in hours" :key="hour" :value="hour">
                {{ hour }}
              </option>
            </select>
          </div>

          <div class="time-column">
            <p>분</p>
            <select class="time-select" v-model="localMinute">
              <option v-for="minute in minutes" :key="minute" :value="minute">
                {{ minute }}
              </option>
            </select>
          </div>
        </div>
      </section>

      <footer class="time-picker__actions">
        <button type="button" class="ghost-button" @click="$emit('cancel')">취소</button>
        <button type="button" class="primary-button" @click="confirm">확인</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  period: 'AM' | 'PM'
  hour: string
  minute: string
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [{ period: 'AM' | 'PM'; hour: string; minute: string }]
}>()

const periodOptions = [
  { value: 'AM', label: '오전' },
  { value: 'PM', label: '오후' },
] as const

const hours = Array.from({ length: 12 }, (_, idx) => String(idx + 1).padStart(2, '0'))
const minutes = Array.from({ length: 6 }, (_, idx) => String(idx * 10).padStart(2, '0'))

const localPeriod = ref<'AM' | 'PM'>(props.period ?? 'AM')
const localHour = ref<string>(props.hour ?? hours[0])
const localMinute = ref<string>(props.minute ?? minutes[0])

watch(
  () => props.period,
  value => {
    if (value) localPeriod.value = value
  },
)

watch(
  () => props.hour,
  value => {
    if (value) localHour.value = value
  },
)

watch(
  () => props.minute,
  value => {
    if (value) localMinute.value = value
  },
)

const previewPeriodLabel = computed(() => (localPeriod.value === 'AM' ? '오전' : '오후'))
const previewHour = computed(() => localHour.value || '00')
const previewMinute = computed(() => localMinute.value || '00')
const isValid = computed(() => Boolean(localHour.value && localMinute.value))

function confirm() {
  if (!isValid.value) return
  emit('confirm', { period: localPeriod.value, hour: localHour.value, minute: localMinute.value })
}
</script>

<style scoped>
.time-picker {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
  padding: 16px;
}

.time-picker__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
}

.time-picker__panel {
  position: relative;
  width: min(460px, 92vw);
  background: #fffef8;
  border-radius: 28px;
  padding: 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  border: 1px solid rgba(251, 191, 36, 0.35);
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
}

.time-picker__header h3 {
  margin: 0;
  font-size: 1.18rem;
  color: #7c2d12;
}

.time-picker__header p {
  margin: 0.35rem 0 0;
  color: #b45309;
  font-size: 0.92rem;
}

.time-picker__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.time-picker__display {
  border: 1px solid rgba(251, 191, 36, 0.35);
  border-radius: 22px;
  padding: 1rem 1.4rem;
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 0.6rem;
  font-size: 1.45rem;
  font-weight: 700;
  background: #fff6cf;
  color: #78350f;
}

.time-display__period {
  font-size: 1rem;
  color: #92400e;
}

.time-picker__selectors {
  display: grid;
  grid-template-columns: 1.1fr repeat(2, minmax(90px, 0.9fr));
  gap: 0.9rem;
  align-items: stretch;
}

.time-column {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
}

.time-column p {
  margin: 0;
  font-weight: 600;
  font-size: 0.9rem;
  color: #9a3412;
}

.chip-group {
  display: flex;
  gap: 0.5rem;
}

.selector-chip {
  flex: 1;
  border-radius: 999px;
  border: none;
  padding: 0.55rem 0.9rem;
  background: #ffe5ae;
  color: #9c4d01;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s ease, color 0.2s ease;
}

.selector-chip:hover {
  background: #ffd27a;
  color: #7a2b00;
}

.selector-chip.is-active {
  background: #facc15;
  color: #7c2d12;
}

.selector-chip.is-active:hover {
  background: #facc15;
  color: #7c2d12;
}

.time-select {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(249, 115, 22, 0.3);
  padding: 0.65rem 0.85rem;
  font-size: 0.95rem;
  font-weight: 600;
  background: #fffdf4;
  color: #7c2d12;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.41.59L6 5.17l4.59-4.58L12 2l-6 6-6-6L1.41.59z' fill='%23b45309'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 12px 8px;
}

.time-select:focus {
  outline: none;
  border-color: #facc15;
  box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.25);
}

.time-picker__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.primary-button,
.ghost-button {
  border-radius: 999px;
  padding: 0.85rem 2rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.2s ease, color 0.2s ease;
}

.primary-button {
  background: #facc15;
  color: #7c2d12;
}

.ghost-button {
  background: #ffe5ae;
  color: #9c4d01;
}

.primary-button:disabled,
.ghost-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.primary-button:not(:disabled):hover {
  background: #ffd21a;
  color: #7a2b03;
}

.ghost-button:not(:disabled):hover {
  background: #ffd27a;
  color: #7a2b00;
}

@media (max-width: 600px) {
  .time-picker__panel {
    width: min(420px, 94vw);
    padding: 1.4rem;
  }

  .time-picker__selectors {
    grid-template-columns: 1fr;
  }
}
</style>
