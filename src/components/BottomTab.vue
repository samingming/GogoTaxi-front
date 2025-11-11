<template>
  <nav class="tabbar">
    <button :class="['tab-btn--home', btnClass('home')]" @click="go('home')">
      <span class="icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="presentation" focusable="false">
          <path
            d="M4.2 10.5 12 4l7.8 6.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
          <path
            d="M6 10v9a1 1 0 0 0 1 1h3.6v-5.2h2.8V20H17a1 1 0 0 0 1-1v-9"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
        </svg>
      </span>
      <span class="label">홈</span>
    </button>
    <button :class="['tab-btn--find', btnClass('find-room')]" @click="go('find-room')">
      <span class="icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="presentation" focusable="false">
          <circle
            cx="11"
            cy="11"
            r="6"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          />
          <line
            x1="15.6"
            y1="15.6"
            x2="20"
            y2="20"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
          <circle cx="11" cy="11" r="3.2" fill="currentColor" opacity="0.15" />
        </svg>
      </span>
      <span class="label">방 찾기</span>
    </button>
    <button :class="['tab-btn--myrooms', btnClass('my-rooms')]" @click="go('my-rooms')">
      <span class="icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="presentation" focusable="false">
          <rect
            x="3.8"
            y="5"
            width="9"
            height="7.5"
            rx="1.8"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <rect
            x="11"
            y="11.5"
            width="9"
            height="7.5"
            rx="1.8"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M10 12h4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </span>
      <span class="label">나의 방</span>
    </button>
    <button :class="['tab-btn--mypage', btnClass('mypage')]" @click="go('mypage')">
      <span class="icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="presentation" focusable="false">
          <circle
            cx="12"
            cy="9"
            r="3.2"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M6 19c0-3 2.7-5 6-5s6 2 6 5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </span>
      <span class="label">마이페이지</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

function go(name: string) {
  router.push({ name })
}
function btnClass(name: string) {
  return {
    'tab-btn': true,
    active: route.name === name,
  }
}
</script>

<style scoped>
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--tab-h);
  padding: 0 clamp(8px, 4vw, 18px) var(--safe-bottom);

  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: center;
  background: linear-gradient(135deg, #fff8f0 0%, #f1f5ff 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 -12px 26px rgba(40, 30, 20, 0.16);
  z-index: 10000;
  transform: translateZ(0);
  will-change: transform;
}
.tab-btn {
  appearance: none;
  border: 0;
  background: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: var(--tab-color, #666);
  transition: color 0.18s ease, filter 0.18s ease;
  position: relative;
}
.tab-btn .icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 4px;
  border-radius: 50%;
  background: var(--tab-icon-bg, transparent);
  transition: background 0.18s ease, box-shadow 0.18s ease;
}
.tab-btn .icon svg {
  width: 22px;
  height: 22px;
  display: block;
  transform-origin: center;
}
.tab-btn .label {
  font-weight: 500;
  letter-spacing: -0.01em;
  text-shadow: 0 0 6px rgba(255, 255, 255, 0.45);
}
.tab-btn.active {
  color: var(--tab-color-active, var(--tab-color, #333));
  font-weight: 600;
  filter: none;
}
.tab-btn.active .icon {
  background: var(--tab-icon-bg-active, var(--tab-icon-bg, transparent));
}
.tab-btn--home {
  --tab-color: #f97316;
  --tab-color-active: #ea580c;
  --tab-icon-bg: linear-gradient(135deg, rgba(249, 115, 22, 0.18) 0%, rgba(253, 186, 116, 0.32) 100%);
  --tab-icon-bg-active: linear-gradient(135deg, rgba(249, 115, 22, 0.32) 0%, rgba(249, 115, 22, 0.48) 100%);
}
.tab-btn--find {
  --tab-color: #3b82f6;
  --tab-color-active: #1d4ed8;
  --tab-icon-bg: linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(96, 165, 250, 0.32) 100%);
  --tab-icon-bg-active: linear-gradient(135deg, rgba(59, 130, 246, 0.32) 0%, rgba(37, 99, 235, 0.48) 100%);
}
.tab-btn--myrooms {
  --tab-color: #a855f7;
  --tab-color-active: #7c3aed;
  --tab-icon-bg: linear-gradient(135deg, rgba(168, 85, 247, 0.18) 0%, rgba(196, 120, 255, 0.32) 100%);
  --tab-icon-bg-active: linear-gradient(135deg, rgba(168, 85, 247, 0.32) 0%, rgba(126, 34, 206, 0.48) 100%);
}
.tab-btn--mypage {
  --tab-color: #22c55e;
  --tab-color-active: #16a34a;
  --tab-icon-bg: linear-gradient(135deg, rgba(34, 197, 94, 0.18) 0%, rgba(74, 222, 128, 0.32) 100%);
  --tab-icon-bg-active: linear-gradient(135deg, rgba(34, 197, 94, 0.32) 0%, rgba(22, 163, 74, 0.48) 100%);
}

</style>
