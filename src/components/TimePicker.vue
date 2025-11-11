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
  background: rgba(0, 0, 0, 0.35);
}

.time-picker__panel {
  position: relative;
  width: min(460px, 92vw);
  background: #ffffff;
  border-radius: 32px;
  padding: 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.15);
}

.time-picker__header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #2f1c03;
}

.time-picker__header p {
  margin: 0.35rem 0 0;
  color: #6a5f4d;
  font-size: 0.92rem;
}

.time-picker__body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.time-picker__display {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  padding: 0.9rem 1.2rem;
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 1.4rem;
  font-weight: 700;
  background: #fff4d4;
  color: #2f1c03;
}

.time-display__period {
  font-size: 1rem;
  color: #6a5f4d;
}

.time-picker__selectors {
  display: grid;
  grid-template-columns: 1.15fr repeat(2, minmax(90px, 0.85fr));
  gap: 0.75rem;
  align-items: stretch;
}

.time-column {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.time-column p {
  margin: 0;
  font-weight: 600;
  font-size: 0.9rem;
  color: #6a5f4d;
}

.chip-group {
  display: flex;
  gap: 0.4rem;
}

.selector-chip {
  flex: 1;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 0.5rem 0.7rem;
  background: #f7f8fd;
  color: #2f1c03;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.selector-chip.is-active {
  background: #fdd651;
  border-color: #fdd651;
  color: #2f1c03;
}

.time-select {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 0.65rem 0.85rem;
  font-size: 0.95rem;
  font-weight: 600;
  background: #f8f9ff;
  color: #2f1c03;
  appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, #c4c7d1 50%),
    linear-gradient(135deg, #c4c7d1 50%, transparent 50%);
  background-position:
    calc(100% - 18px) calc(50% - 4px),
    calc(100% - 12px) calc(50% - 4px);
  background-size: 6px 6px;
  background-repeat: no-repeat;
}

.time-select:focus {
  outline: none;
  border-color: #fdd651;
}

.time-picker__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.primary-button,
.ghost-button {
  border-radius: 999px;
  padding: 0.9rem 2.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
  border: none;
}

.primary-button {
  background: #fdd651;
  color: #2f1c03;
}

.ghost-button {
  background: #ffffff;
  color: #2f1c03;
  border: 1px solid #d7d8de;
}

.primary-button:disabled,
.ghost-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.primary-button:not(:disabled):hover,
.ghost-button:not(:disabled):hover {
  transform: translateY(-1px);
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
