<template>
  <section class="receipt-scan">
    <header class="receipt-scan__header">
      <div class="receipt-scan__header-top">
        <button type="button" class="back-btn" @click="goBack">
          <img :src="backIcon" alt="" class="back-icon" aria-hidden="true" />
        </button>
        <h1>영수증 인식</h1>
        <span class="header-spacer" aria-hidden="true"></span>
      </div>
    </header>

    <div class="upload-card">
      <label class="file-input">
        <input type="file" accept="image/*" @change="onFileChange" />
        <span>{{ fileLabel }}</span>
      </label>
      <p class="helper">
        Gemini Vision을 통해 Uber 영수증에서 총 금액을 추출해 정산에 활용할 수 있어요.
        이미지는 서버로 전송하여 분석한 뒤 결과만 저장됩니다.
        <br><br> ※ 우버 하단 탭의 활동 -> 이전 내역에서 차량 서비스 세부 정보 탭 -> 영수증 버튼 클릭
      </p>
      <div v-if="previewUrl" class="preview">
        <img :src="previewUrl" alt="선택된 영수증 이미지 미리보기" />
      </div>

      <div v-if="hasAmount" class="amount-tile">
        <p class="amount-tile__label">총 금액</p>
        <p class="amount-tile__value">{{ formattedTotal }}</p>
        <p class="amount-tile__meta">{{ amountMeta }}</p>
      </div>

      <button
        v-else
        type="button"
        class="primary-btn"
        :disabled="!selectedFile || analyzing"
        @click="runAnalysis"
      >
        {{ analyzeButtonLabel }}
      </button>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div v-if="hasAmount" class="confirm-area">
      <button
        type="button"
        class="primary-btn confirm-btn"
        :disabled="finalizing || !selectedFile"
        @click="finalizeSettlement"
      >
        확인
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ReceiptAnalysis } from '@/services/receiptService'
import { analyzeReceipt, finalizeReceiptSettlement } from '@/services/receiptService'
import arrowBackIcon from '@/assets/arrowback.svg'
import { useRoomMembership } from '@/composables/useRoomMembership'

const router = useRouter()
const route = useRoute()
const { joinedRooms, activeRoomId, syncSettlementSnapshot, completeRoom } = useRoomMembership()
const backIcon = arrowBackIcon
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const analyzing = ref(false)
const finalizing = ref(false)
const errorMessage = ref('')
const analysisResult = ref<ReceiptAnalysis | null>(null)
const rememberedFileName = ref('')

function goBack() {
  router.back()
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  selectedFile.value = file
  rememberedFileName.value = file.name
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
    const response = await analyzeReceipt(selectedFile.value)
    const analysis = response?.analysis ?? null
    analysisResult.value = analysis
    rememberedFileName.value = selectedFile.value.name
    const roomId = currentRoomId.value
    if (roomId) {
      syncSettlementSnapshot(roomId, {
        analysis,
        completedAt: new Date().toISOString(),
        fileName: rememberedFileName.value,
      })
    }
  } catch (error) {
    console.error('Receipt analysis failed', error)
    const message = error instanceof Error ? error.message : ''
    errorMessage.value = message || '영수증 분석에 실패했어요. 잠시 후 다시 시도해 주세요.'
  } finally {
    analyzing.value = false
  }
}

const currentRoomId = computed(() => {
  const queryId = route.query.roomId
  if (typeof queryId === 'string' && queryId.trim()) return queryId
  if (Array.isArray(queryId) && queryId[0]) return queryId[0]
  return activeRoomId.value ?? null
})

const settlementSnapshot = computed(() => {
  const id = currentRoomId.value
  if (!id) return null
  const entry = joinedRooms.value.find(item => item.roomId === id)
  return entry?.settlementSnapshot ?? null
})

watch(
  () => settlementSnapshot.value,
  snapshot => {
    if (!snapshot) {
      if (!selectedFile.value) {
        rememberedFileName.value = ''
        if (previewUrl.value) {
          URL.revokeObjectURL(previewUrl.value)
        }
        previewUrl.value = null
      }
      if (!selectedFile.value) {
        analysisResult.value = null
      }
      return
    }
    analysisResult.value = snapshot.analysis ?? null
    if (!selectedFile.value) {
      rememberedFileName.value = snapshot.fileName ?? ''
    }
  },
  { immediate: true },
)

const fileLabel = computed(() => {
  if (selectedFile.value) return selectedFile.value.name
  if (rememberedFileName.value) return `${rememberedFileName.value} (저장됨)`
  return '영수증 이미지를 선택해 주세요.'
})

const formattedTotal = computed(() => {
  if (!analysisResult.value) return '-'
  if (analysisResult.value.totalAmount == null) return '확인되지 않음'
  const formatter = new Intl.NumberFormat('ko-KR')
  const currencyCode = (analysisResult.value.currency || '').toUpperCase()
  const unit = currencyCode === 'KRW' || !currencyCode ? '원' : currencyCode
  return `${formatter.format(analysisResult.value.totalAmount)} ${unit}`.trim()
})

const analyzeButtonLabel = computed(() => {
  if (analyzing.value) return '분석 중...'
  if (analysisResult.value?.totalAmount != null) return formattedTotal.value
  return '영수증 인식하기'
})

const hasAmount = computed(() => analysisResult.value?.totalAmount != null)

const amountMeta = computed(() => {
  if (!analysisResult.value) return ''
  return analysisResult.value.rawText ? '추출 완료' : ''
})

async function finalizeSettlement() {
  if (finalizing.value) return
  if (!selectedFile.value) {
    errorMessage.value = '정산하려면 영수증 이미지를 다시 선택해 주세요.'
    return
  }
  const roomId = currentRoomId.value
  if (!roomId) {
    errorMessage.value = '정산할 방 정보를 찾을 수 없습니다.'
    return
  }
  finalizing.value = true
  errorMessage.value = ''
  try {
    const response = await finalizeReceiptSettlement(selectedFile.value, roomId)
    const analysis = response?.analysis ?? null
    analysisResult.value = analysis
    syncSettlementSnapshot(roomId, {
      analysis,
      completedAt: new Date().toISOString(),
      fileName: rememberedFileName.value || selectedFile.value.name,
      isFinal: true,
    })
    completeRoom(roomId, new Date().toISOString())
    router.push({ name: 'my-rooms' })
  } catch (error) {
    console.error('Receipt finalize failed', error)
    const message = error instanceof Error ? error.message : ''
    errorMessage.value = message || '영수증 정산에 실패했어요. 잠시 후 다시 시도해 주세요.'
  } finally {
    finalizing.value = false
  }
}
</script>

<style scoped>
.receipt-scan {
  min-height: max(
    0px,
    calc(100dvh - var(--header-h) - var(--tab-h) - var(--safe-bottom) - var(--browser-ui-bottom))
  );
  padding: 2rem 1.25rem calc(3rem + var(--safe-bottom));
  background: #fff7e1;
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
  color: #3b2600;
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

.upload-card {
  background: #fff;
  border-radius: 20px;
  padding: 20px;
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
  border-radius: 18px;
  padding: 14px 18px;
  background: rgba(34, 197, 94, 0.18);
  color: #0f8f3a;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
}

.primary-btn:not(:disabled):hover,
.primary-btn:not(:disabled):active {
  background: rgba(34, 197, 94, 0.28);
  color: #0f8f3a;
  transform: translateY(-1px);
}

.primary-btn:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  pointer-events: none;
}

.error {
  color: #c0392b;
  margin: 0;
}

.amount-tile {
  margin-top: 6px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #e0f2eb;
  border: 1px solid rgba(71, 132, 103, 0.22);
  display: grid;
  gap: 6px;
}

.amount-tile__label {
  margin: 0;
  font-size: 13px;
  color: #5b8372;
}

.amount-tile__value {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #2f4c3e;
}

.amount-tile__meta {
  margin: 0;
  font-size: 14px;
  color: #4f6b5b;
}

.confirm-area {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
}

.confirm-btn {
  width: 100%;
  background: #fbc02d;
  color: #3b2600;
  border: none;
  box-shadow: none;
  transition: none;
}

.confirm-btn:not(:disabled):hover,
.confirm-btn:not(:disabled):active {
  background: #fbc02d;
  color: #3b2600;
  transform: none;
}

.items__title,
.items ul,
.items li,
details {
  display: none;
}
</style>
