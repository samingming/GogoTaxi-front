<template>
  <div class="charge-wrapper">
    <div class="charge-container">
      <div class="charge-header">
        <p class="charge-eyebrow">지금 바로 충전해요.</p>
        <h1 class="charge-title">충전하기</h1>
        <p class="charge-description">
          충전할 금액을 직접 입력하고 바로 충전을 진행해 주세요. 승인 완료 즉시 잔액으로 반영돼요.
        </p>
      </div>

      <section class="charge-summary" aria-labelledby="charge-summary-title">
        <h2 id="charge-summary-title" class="sr-only">충전 금액 입력</h2>
        <div class="summary-label">충전 금액 입력</div>
        <div class="receipt-upload">
          <div class="receipt-upload__header">
            <p class="receipt-upload__title">이미지로 자동 입력</p>
            <small class="receipt-upload__hint">Gemini 비전으로 금액을 추출해요.</small>
          </div>
          <div class="receipt-upload__actions">
            <label class="upload-button" for="receipt-file">이미지 선택</label>
            <input
              id="receipt-file"
              type="file"
              accept="image/*"
              class="upload-input"
              @change="handleReceiptUpload"
            />
            <span v-if="selectedFileName" class="upload-file">{{ selectedFileName }}</span>
          </div>
          <p v-if="isScanning" class="upload-status">금액 인식 중이에요...</p>
          <p v-else-if="recognizedAmount" class="upload-status upload-status--success">
            인식된 금액 {{ recognizedCurrency }} {{ formatNumber(recognizedAmount) }}을 입력했어요.
          </p>
          <p v-else-if="scanError" class="upload-status upload-status--error">{{ scanError }}</p>
        </div>
        <div class="summary-input">
          <span class="amount-currency" aria-hidden="true">₩</span>
          <input
            type="text"
            inputmode="numeric"
            class="amount-input"
            :value="amountInput"
            @input="handleAmountInput"
            placeholder="0"
            aria-label="충전할 금액"
          />
        </div>
        <p class="summary-caption">현재 입력 금액 <strong>{{ formattedAmount }}</strong>이 충전돼요.</p>
      </section>

      <button type="button" class="charge-action" :disabled="isSubmitting" @click="confirmCharge">
        {{ isSubmitting ? "충전 중..." : "충전하기" }}
      </button>

      <p v-if="errorMessage" class="charge-error" role="alert">
        {{ errorMessage }}
      </p>

      <section class="charge-guide" aria-labelledby="charge-guide-title">
        <h2 id="charge-guide-title" class="guide-title">안내 사항</h2>
        <ul class="guide-list">
          <li>충전 승인이 끝나면 입력한 금액이 즉시 꼬꼬페이에 반영돼요.</li>
          <li>충전 후 10분 이내 취소 시 처리에 추가 시간이 필요할 수 있어요.</li>
          <li>결제 카드 명세서에는 “꼬꼬페이 충전”으로 표기돼요.</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { refreshUserBalance } from "@/stores/userStore";
import { extractAmountFromReceipt, topupWallet } from "@/services/walletService";

const router = useRouter();
const amountInput = ref("10000");
const isSubmitting = ref(false);
const errorMessage = ref("");
const isScanning = ref(false);
const scanError = ref("");
const recognizedAmount = ref<number | null>(null);
const recognizedCurrency = ref("KRW");
const selectedFileName = ref("");

const currentAmount = computed(() => {
  const digits = Number(amountInput.value.replace(/[^0-9]/g, ""));
  return Number.isNaN(digits) ? 0 : digits;
});

const formattedAmount = computed(() =>
  new Intl.NumberFormat("ko-KR").format(currentAmount.value)
);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("ko-KR").format(Math.max(0, value));

const handleAmountInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  amountInput.value = value.replace(/[^0-9]/g, "");
};

const handleReceiptUpload = async (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  const file = files?.[0];
  if (!file) return;

  selectedFileName.value = file.name;
  scanError.value = "";
  recognizedAmount.value = null;
  isScanning.value = true;

  try {
    const result = await extractAmountFromReceipt(file);
    const amount = typeof result?.amount === "number" ? Math.round(result.amount) : null;
    if (amount && Number.isFinite(amount)) {
      recognizedAmount.value = amount;
      amountInput.value = String(amount);
      if (result?.currency) {
        recognizedCurrency.value = result.currency.toUpperCase();
      }
    } else {
      scanError.value =
        result?.reason || "금액을 읽어오지 못했어요. 이미지가 또렷한지 확인해 주세요.";
    }
  } catch (error) {
    console.error("Failed to extract receipt amount", error);
    scanError.value = "영수증 금액 인식에 실패했어요. 잠시 후 다시 시도해 주세요.";
  } finally {
    isScanning.value = false;
    (event.target as HTMLInputElement).value = "";
  }
};

const confirmCharge = async () => {
  const amount = currentAmount.value;
  if (!amount) {
    amountInput.value = "";
    return;
  }
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  errorMessage.value = "";
  try {
    await topupWallet(amount);
    await refreshUserBalance();
    amountInput.value = "";
    router.push("/mypage");
  } catch (error) {
    console.error("Failed to top up wallet", error);
    errorMessage.value = "충전에 실패했어요. 잠시 후 다시 시도해 주세요.";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.charge-wrapper {
  min-height: calc((var(--app-vh, 1vh) * 100) - var(--header-h));
  background: #fff5cc;
  padding: 32px 24px 24px;
  font-family: "Pretendard", "Apple SD Gothic Neo", sans-serif;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.charge-container {
  width: min(640px, 100%);
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow: hidden;
}

.charge-header {
  text-align: left;
  color: #7c5a00;
  display: flex;
  flex-direction: column;
}

.charge-eyebrow {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #f59e0b;
  margin: 0;
}

.charge-title {
  margin: 4px 0 8px;
  font-size: 28px;
  line-height: 1.2;
  color: #0f172a;
}

.charge-description {
  margin: 0;
  font-size: 14px;
  color: #a16207;
}

.charge-summary {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
}


.summary-label {
  margin: 0;
  font-size: 14px;
  color: #d97706;
}

.receipt-upload {
  margin: 10px 0 14px;
  padding: 12px;
  border: 1px dashed rgba(124, 45, 18, 0.35);
  border-radius: 12px;
  background: rgba(253, 230, 138, 0.15);
}

.receipt-upload__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.receipt-upload__title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #7c2d12;
}

.receipt-upload__hint {
  margin: 0;
  font-size: 12px;
  color: #c2410c;
}

.receipt-upload__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(124, 45, 18, 0.2);
  background: #fdd651;
  color: #7c2d12;
  font-weight: 700;
  cursor: pointer;
}

.upload-button:hover {
  filter: brightness(0.98);
}

.upload-input {
  display: none;
}

.upload-file {
  font-size: 13px;
  color: #92400e;
  background: #fff7e6;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid rgba(124, 45, 18, 0.15);
}

.upload-status {
  margin: 8px 0 0;
  font-size: 13px;
  color: #a16207;
}

.upload-status--success {
  color: #15803d;
}

.upload-status--error {
  color: #b91c1c;
}

.summary-input {
  margin: 12px 0 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.amount-currency {
  font-size: 20px;
  font-weight: 700;
  color: #7c2d12;
}

.amount-input {
  flex: 1;
  border: none;
  border-bottom: 2px solid rgba(124, 45, 18, 0.4);
  font-size: 32px;
  font-weight: 700;
  color: #7c2d12;
  background: transparent;
  padding: 0 0 4px;
  outline: none;
}

.amount-input::placeholder {
  color: rgba(124, 45, 18, 0.4);
}

.amount-input:focus-visible {
  border-bottom-color: #7c2d12;
}

.summary-caption {
  margin: 0;
  font-size: 13px;
  color: #c2410c;
}

.charge-action {
  width: 100%;
  border: none;
  border-radius: 16px;
  padding: 16px 20px;
  font-size: 16px;
  font-weight: 600;
  background: #fdd651;
  color: #7c2d12;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  box-shadow: 0 8px 24px rgba(124, 90, 0, 0.18);
}

.charge-action:active {
  transform: translateY(1px);
}

.charge-action:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.charge-guide {
  background: rgba(251, 191, 36, 0.15);
  border-radius: 16px;
  padding: 20px 24px;
  color: #7c5a00;
}

.guide-title {
  margin: 0 0 12px;
  font-size: 16px;
  color: #7c2d12;
}

.guide-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: #7c5a00;
  line-height: 1.6;
}

.charge-error {
  margin: -8px 0 0;
  font-size: 14px;
  color: #b91c1c;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (min-width: 768px) {
  .charge-container {
    margin: 0 auto;
  }
}
</style>
