<template>
  <div class="charge-wrapper">
    <div class="charge-container">
      <div class="charge-header">
        <p class="charge-eyebrow">같이 나눠요.</p>
        <h1 class="charge-title">충전하기</h1>
        <p class="charge-description">
          예상 금액을 확인하고 충전을 진행해 주세요. 최종 금액은 승인 직후 바로 안내돼요.
        </p>
      </div>

      <section class="charge-summary" aria-labelledby="charge-summary-title">
        <h2 id="charge-summary-title" class="sr-only">예상 충전 금액</h2>
        <div class="summary-label">예상 충전 금액</div>
        <div class="summary-amount">
          <span class="amount-currency" aria-hidden="true">₩</span>
          <span class="amount-value">{{ formattedAmount }}</span>
        </div>
        <p class="summary-caption">충전 요청에 따라 최종 금액이 달라질 수 있어요.</p>
      </section>

      <button type="button" class="charge-action" @click="confirmCharge">
        충전하기
      </button>

      <section class="charge-guide" aria-labelledby="charge-guide-title">
        <h2 id="charge-guide-title" class="guide-title">안내 사항</h2>
        <ul class="guide-list">
          <li>승인된 금액에서 이탈이 발생하면 빠른 승인이 필요해요.</li>
          <li>충전 완료 이후 취소 시 일부 금액이 보류될 수 있어요.</li>
          <li>변경 사항은 사전에 방장 또는 운영 팀에 알려 주세요.</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const pendingAmount = ref(12500);

const formattedAmount = computed(() =>
  new Intl.NumberFormat("ko-KR").format(pendingAmount.value)
);

const confirmCharge = () => {
  // TODO: replace with real charge flow
  router.back();
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
}

.charge-container {
  width: min(640px, 100%);
  display: flex;
  flex-direction: column;
  gap: 24px;
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

.summary-amount {
  margin: 12px 0 8px;
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
}

.amount-currency {
  font-size: 20px;
  font-weight: 700;
  color: #7c2d12;
}

.amount-value {
  font-size: 32px;
  font-weight: 700;
  color: #7c2d12;
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
