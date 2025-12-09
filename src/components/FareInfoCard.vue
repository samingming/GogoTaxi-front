<template>
  <section class="fare-info-card">
    <header class="fare-info-card__header">
      <h2>{{ title }}</h2>
    </header>

    <div class="fare-summary">
      <div class="fare-summary__item">
        <p class="fare-summary__label">
          내 요금 <span class="fare-summary__count">({{ participantCountLabel }}명)</span>
        </p>
        <strong>{{ formattedPerPersonFare }}</strong>
      </div>
      <div class="fare-summary__item">
        <p class="fare-summary__label">전체 요금</p>
        <strong>{{ formattedTotalFare }}</strong>
      </div>
    </div>

    <p class="fare-summary__hint">
      {{ summaryHint }}
    </p>

    <div v-if="allowUpload" class="fare-ocr">
      <div class="fare-ocr__header">
        <p class="fare-ocr__title">{{ uploadTitle }}</p>
        <small class="fare-ocr__hint">{{ uploadHint }}</small>
      </div>
      <div class="fare-ocr__controls">
        <label class="fare-ocr__upload">
          {{ uploadButtonLabel }}
          <input type="file" accept="image/*" @change="handleFileChange" />
        </label>
        <span v-if="selectedFile" class="fare-ocr__file">{{ selectedFile }}</span>
      </div>
      <p v-if="scanBusy" class="fare-ocr__status">금액 인식 중이에요...</p>
      <p v-else-if="recognizedAmount !== null" class="fare-ocr__status fare-ocr__status--success">
        인식된 금액 {{ recognizedCurrency }} {{ formattedRecognizedAmount }} 적용됨
      </p>
      <p v-else-if="scanError" class="fare-ocr__status fare-ocr__status--error">{{ scanError }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { extractAmountFromReceipt } from '@/services/walletService'

const props = withDefaults(
  defineProps<{
    title?: string
    participantCount?: number
    perPersonFare?: number | null | undefined
    totalFare?: number | null | undefined
    summaryHint?: string
    allowUpload?: boolean
    uploadTitle?: string
    uploadHint?: string
    uploadButtonLabel?: string
    recognizedFare?: number | null
    currency?: string
    pending?: boolean
  }>(),
  {
    title: '요금 정보',
    participantCount: 1,
    perPersonFare: undefined,
    totalFare: undefined,
    summaryHint: '참여 인원에 맞춰 n분의 1로 자동 계산돼요.',
    allowUpload: false,
    uploadTitle: '예상 금액 캡처 인식',
    uploadHint: 'Uber 화면 캡처를 올리면 Gemini가 금액을 읽어요.',
    uploadButtonLabel: '이미지 선택',
    recognizedFare: null,
    currency: 'KRW',
    pending: false,
  },
)

const emit = defineEmits<{
  (event: 'fare-recognized', amount: number): void
  (event: 'fare-pending'): void
}>()

const selectedFile = ref('')
const scanBusy = ref(false)
const scanError = ref('')
const recognizedAmount = ref<number | null>(props.recognizedFare ?? null)
const recognizedCurrency = ref((props.currency || 'KRW').toUpperCase())
const pendingRecognition = ref(false)

watch(
  () => props.recognizedFare,
  value => {
    recognizedAmount.value = typeof value === 'number' ? value : null
    if (typeof value === 'number') {
      pendingRecognition.value = false
    }
  },
)

watch(
  () => props.currency,
  value => {
    recognizedCurrency.value = (value || 'KRW').toUpperCase()
  },
)

const participantCountLabel = computed(() => Math.max(props.participantCount ?? 1, 1))
const showPendingFare = computed(() => {
  if (props.pending) return true
  return pendingRecognition.value
})
const formattedPerPersonFare = computed(() =>
  showPendingFare.value ? '요금 미정' : formatFare(props.perPersonFare),
)
const formattedTotalFare = computed(() =>
  showPendingFare.value ? '요금 미정' : formatFare(props.totalFare),
)
const formattedRecognizedAmount = computed(() =>
  recognizedAmount.value !== null ? recognizedAmount.value.toLocaleString('ko-KR') : '',
)

function formatFare(amount?: number | null) {
  if (amount == null) return '요금 미정'
  return `₩${amount.toLocaleString('ko-KR')}`
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) return

  selectedFile.value = file.name
  scanError.value = ''
  recognizedAmount.value = null
  scanBusy.value = true
  pendingRecognition.value = true
  emit('fare-pending')

  try {
    const result = await extractAmountFromReceipt(file)
    const amount =
      typeof result?.amount === 'number' && Number.isFinite(result.amount)
        ? Math.round(result.amount)
        : null

    if (amount !== null) {
      recognizedAmount.value = amount
      recognizedCurrency.value = (result?.currency || recognizedCurrency.value || 'KRW').toUpperCase()
      emit('fare-recognized', amount)
      pendingRecognition.value = false
    } else {
      scanError.value =
        result?.reason || '예상 금액 인식에 실패했어요. 잠시 후 다시 시도해 주세요.'
    }
  } catch (error) {
    console.error('Failed to extract fare amount', error)
    scanError.value = '예상 금액 인식에 실패했어요. 잠시 후 다시 시도해 주세요.'
  } finally {
    scanBusy.value = false
    if (input) input.value = ''
  }
}
</script>

<style scoped>
.fare-info-card {
  display: grid;
  gap: 16px;
}

.fare-info-card__header h2 {
  margin: 0;
  font-size: 18px;
  color: #7c2d12;
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

.fare-ocr {
  border: 1px solid rgba(251, 191, 36, 0.35);
  border-radius: 24px;
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.95);
  display: grid;
  gap: 10px;
}

.fare-ocr__title {
  margin: 0;
  font-size: 14px;
  color: #7c2d12;
  font-weight: 600;
}

.fare-ocr__hint {
  color: #a16207;
}

.fare-ocr__controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.fare-ocr__upload {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 999px;
  border: none;
  background: rgba(250, 204, 21, 0.18);
  color: #7c2d12;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
  transition: background 0.2s ease, color 0.2s ease;
}

.fare-ocr__upload:hover {
  background: rgba(250, 204, 21, 0.32);
  color: #92400e;
}
.fare-ocr__upload input {
  display: none;
}

.fare-ocr__file {
  font-size: 13px;
  color: #92400e;
  background: #fff7e6;
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid rgba(124, 45, 18, 0.2);
}

.fare-ocr__status {
  margin: 0;
  font-size: 13px;
  color: #92400e;
}

.fare-ocr__status--success {
  color: #15803d;
}

.fare-ocr__status--error {
  color: #b91c1c;
}
</style>
