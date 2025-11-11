<template>
  <section class="payment">
    <header class="payment__header">
      <p class="payment__eyebrow">같이 나눠요.</p>
      <h1>결제 준비</h1>
      <p class="payment__sub">
        예상 금액을 확인하고 결제를 진행해 주세요. 최종 금액은 인원 확정 후 바로 안내돼요.
      </p>
    </header>

    <div class="payment__card">
      <p class="payment__label">예상 결제 금액</p>
      <p class="payment__amount">{{ formattedAmount }}</p>
      <p class="payment__hint">인원 확정에 따라 결제 금액이 변동될 수 있어요.</p>
    </div>

    <button class="payment__action" type="button">결제하기</button>

    <section class="payment__notice" aria-label="안내 사항">
      <h2>안내 사항</h2>
      <ul>
        <li>확정된 인원에서 이탈이 발생하면 빠른 승인에 일부 시간이 필요해요.</li>
        <li>출발 10분 이후 취소 시 결제 금액 일부가 공제될 수 있어요.</li>
        <li>불가피한 일정 변경은 방장에게 미리 알려 주세요.</li>
      </ul>
    </section>
  </section>
</template>

<script setup lang="ts">
const estimatedAmount = 12500
const formattedAmount = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
}).format(estimatedAmount)
</script>

<style scoped>
.payment {
  min-height: calc((var(--app-vh, 1vh) * 100) - var(--header-h));
  padding: 32px 24px 24px;
  background: #fff5cc;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.payment__header h1 {
  margin: 4px 0 8px;
  font-size: 28px;
  line-height: 1.2;
  color: #0f172a;
}

.payment__header {
  text-align: left;
  color: #7c5a00;
}

.payment__eyebrow {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #f59e0b;
  margin: 0;
}

.payment__sub {
  margin: 0;
  font-size: 14px;
  color: #a16207;
}

.payment__card {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
}

.payment__label {
  margin: 0;
  font-size: 14px;
  color: #d97706;
}

.payment__amount {
  margin: 12px 0 8px;
  font-size: 32px;
  font-weight: 700;
  color: #7c2d12;
}

.payment__hint {
  margin: 0;
  font-size: 13px;
  color: #c2410c;
}

.payment__action {
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

.payment__action:active {
  transform: translateY(1px);
}

.payment__notice {
  background: rgba(251, 191, 36, 0.15);
  border-radius: 16px;
  padding: 20px 24px;
}

.payment__notice h2 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #7c2d12;
}

.payment__notice ul {
  margin: 0;
  padding-left: 20px;
  color: #7c5a00;
  font-size: 14px;
  line-height: 1.6;
}

.payment__notice li + li {
  margin-top: 6px;
}

@media (min-width: 768px) {
  .payment {
    max-width: 640px;
    margin: 0 auto;
  }
}
</style>
