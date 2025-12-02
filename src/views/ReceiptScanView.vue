<template>
  <section class="receipt-scan">
    <header class="receipt-scan__header">
      <div class="receipt-scan__header-top">
        <button type="button" class="back-btn" @click="goBack">
          <img :src="arrowBackIcon" alt="" class="back-icon" aria-hidden="true" />
        </button>
        <h1>영수증 인식</h1>
        <span class="header-spacer" aria-hidden="true"></span>
      </div>
    </header>

    <div class="upload-card">
      <label class="file-input">
        <input type="file" accept="image/*" @change="onFileChange" />
        <span>{{ selectedFile ? selectedFile.name : '영수증 이미지를 선택해 주세요.' }}</span>
      </label>
      <p class="helper">
        Gemini Vision을 통해 Uber 영수증에서 총 금액을 추출해 정산에 활용할 수 있어요.
        이미지는 서버로 전송하여 분석한 뒤 결과만 저장됩니다.
        <br><br> ※ 우버 하단 탭의 활동 -> 이전 내역에서 차량 서비스 세부 정보 탭 -> 영수증 버튼 클릭
      </p>
      <div v-if="previewUrl" class="preview">
        <img :src="previewUrl" alt="선택된 영수증 이미지 미리보기" />
      </div>
      <button
        type="button"
        class="primary-btn"
        :disabled="!selectedFile || analyzing"
        @click="runAnalysis"
      >
        {{ analyzing ? '분석 중...' : '영수증 인식하기' }}
      </button>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <section v-if="analysisResult" class="result-card">
      <header>
        <h2>인식 결과</h2>
      </header>
      <dl>
        <div>
          <dt>총 금액</dt>
          <dd>{{ formattedTotal }}</dd>
        </div>
      </dl>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { ReceiptAnalysis } from '@/services/receiptService'
import { analyzeReceipt } from '@/services/receiptService'
import arrowBackIcon from '@/assets/arrowback.svg'

const router = useRouter()
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const analyzing = ref(false)
const errorMessage = ref('')
const analysisResult = ref<ReceiptAnalysis | null>(null)

function goBack() {
  router.back()
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  selectedFile.value = file
  analysisResult.value = null
  errorMessage.value = ''
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = URL.createObjectURL(file)
}

async function runAnalysis() {
  if (!selectedFile.value || analyzing.value) return
  analyzing.value = true
  errorMessage.value = ''
  try {
    const result = await analyzeReceipt(selectedFile.value)
    analysisResult.value = result
  } catch (error) {
    console.error('Receipt analysis failed', error)
    const message = error instanceof Error ? error.message : ''
    errorMessage.value = message || '영수증 분석에 실패했어요. 잠시 후 다시 시도해 주세요.'
  } finally {
    analyzing.value = false
  }
}

const formattedJson = computed(() =>
  analysisResult.value ? JSON.stringify(analysisResult.value, null, 2) : '',
)

const formattedTotal = computed(() => {
  if (!analysisResult.value) return '-'
  if (analysisResult.value.totalAmount == null) return '확인되지 않음'
  const formatter = new Intl.NumberFormat('ko-KR')
  const currency = analysisResult.value.currency ? ` ${analysisResult.value.currency}` : ''
  return `${formatter.format(analysisResult.value.totalAmount)}${currency}`
})

function formatAmount(amount: number | null | undefined) {
  if (amount == null) return '-'
  return `${new Intl.NumberFormat('ko-KR').format(amount)}`
}
</script>

<style scoped>
.receipt-scan {
  min-height: max(
    0px,
    calc(100dvh - var(--header-h) - var(--tab-h) - var(--safe-bottom) - var(--browser-ui-bottom))
  );
  padding: 2rem 1.25rem calc(3rem + var(--safe-bottom));
  background: #3a2e20;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(14px, 3vw, 18px);
  box-sizing: border-box;
}

.receipt-scan__header {
  color: #f8f1e4;
  text-align: center;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}

.receipt-scan__header-top {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  margin: 0 auto 8px;
  max-width: 960px;
  width: 100%;
}

.receipt-scan__header h1 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
}

.receipt-scan__header .eyebrow {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 244, 220, 0.78);
}

.back-btn {
  border: none;
  background: transparent;
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.back-btn:hover {
  transform: translateY(-2px);
}

.back-btn:focus-visible {
  outline: 3px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

.back-icon {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.header-spacer {
  width: 32px;
  height: 32px;
}

.upload-card,
.result-card {
  background: #fff;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 16px 34px rgba(20, 12, 6, 0.12);
  display: grid;
  gap: 16px;
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
}

.file-input {
  border: 2px dashed #d8c6a1;
  border-radius: 16px;
  padding: 18px;
  display: block;
  text-align: center;
  cursor: pointer;
  font-weight: 600;
  color: #684f2f;
  background: #fffbf2;
}

.file-input input {
  display: none;
}

.helper {
  margin: 0;
  color: #6b5d4a;
  font-size: 0.9rem;
}

.preview {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #f0e6d2;
  max-height: 360px;
}

.preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.primary-btn {
  border: none;
  border-radius: 14px;
  padding: 14px;
  background: #ffd263;
  font-weight: 700;
  cursor: pointer;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #c0392b;
  margin: 0;
}

.result-card header {
  margin: 0;
}

.result-card dl {
  margin: 0;
  display: grid;
  gap: 8px;
}

.result-card dt {
  font-weight: 600;
  color: #6b5d4a;
}

.result-card dd {
  margin: 0;
  font-size: 1.1rem;
}

.items__title,
.items ul,
.items li,
details {
  display: none;
}
</style>
