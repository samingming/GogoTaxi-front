<template>
  <section class="receipt-scan">
    <header class="receipt-scan__header">
      <button type="button" class="back-btn" @click="goBack">
        <span aria-hidden="true">←</span>
        <span class="sr-only">뒤로가기</span>
      </button>
      <div>
        <p class="eyebrow">AI 정산 보조</p>
        <h1>영수증 인식</h1>
      </div>
    </header>

    <div class="upload-card">
      <label class="file-input">
        <input type="file" accept="image/*" @change="onFileChange" />
        <span>{{ selectedFile ? selectedFile.name : '영수증 이미지를 선택해 주세요.' }}</span>
      </label>
      <p class="helper">
        Gemini Vision을 통해 택시 영수증에서 총 금액을 추출해 정산에 활용할 수 있어요.
        이미지는 서버로 전송하여 분석한 뒤 결과만 저장됩니다.
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
        <small v-if="analysisResult.modelLatencyMs"
          >{{ (analysisResult.modelLatencyMs / 1000).toFixed(1) }}초 소요</small
        >
      </header>
      <dl>
        <div>
          <dt>총 금액</dt>
          <dd>{{ formattedTotal }}</dd>
        </div>
        <div>
          <dt>요약</dt>
          <dd>{{ analysisResult.summary || '추출된 요약이 없어요.' }}</dd>
        </div>
      </dl>
      <div v-if="analysisResult.items?.length" class="items">
        <p class="items__title">세부 항목</p>
        <ul>
          <li v-for="(item, index) in analysisResult.items" :key="index">
            <span>{{ item.label }}</span>
            <strong>{{ formatAmount(item.amount) }}</strong>
          </li>
        </ul>
      </div>
      <details>
        <summary>원본 JSON 확인</summary>
        <pre>{{ formattedJson }}</pre>
      </details>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { ReceiptAnalysis } from '@/services/receiptService'
import { analyzeReceipt } from '@/services/receiptService'

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
  min-height: calc(100dvh - var(--header-h, 56px));
  padding: clamp(20px, 4vw, 40px) clamp(18px, 4vw, 48px);
  background: #fbf8f3;
  display: grid;
  gap: 20px;
}

.receipt-scan__header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.receipt-scan__header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.receipt-scan__header .eyebrow {
  margin: 0;
  font-size: 0.85rem;
  color: #836848;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #fff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
  font-size: 1.2rem;
  cursor: pointer;
}

.upload-card,
.result-card {
  background: #fff;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
  display: grid;
  gap: 16px;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
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

.items__title {
  font-weight: 600;
  margin-bottom: 6px;
}

.items ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 6px;
}

.items li {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
}

details {
  background: #f8f4ec;
  border-radius: 12px;
  padding: 12px;
}

details pre {
  white-space: pre-wrap;
  font-size: 0.8rem;
  margin: 8px 0 0;
}
</style>
