<template>
  <header class="header">
    <div class="header-inner">
      <button class="logo-btn" type="button" @click="goHome" aria-label="홈으로 가기">
        <img class="logo" src="@/assets/logo.png" alt="GogoTaxi" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push({ name: 'home' })
}
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  box-sizing: border-box;
  padding-top: var(--safe-top);
  height: calc(var(--header-h) + var(--safe-top));
  background: var(--header-bg, #fdd651);
  border-bottom: 1px solid var(--header-border, #f0b400);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  z-index: 10;
}
.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: var(--safe-top);
  background: inherit;
  pointer-events: none;
}
.header-inner {
  position: relative;
  height: var(--header-h);
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo {
  height: 46px;
  object-fit: contain;
}
.logo-btn {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.logo-btn:focus-visible {
  outline: 2px solid #1f2937;
  outline-offset: 4px;
  border-radius: 8px;
}
</style>
