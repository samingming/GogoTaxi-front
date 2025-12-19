<template>
  <div id="app" class="app-shell">
    <AppHeader />

    <main class="app-content" :style="contentStyle">
      <router-view />
    </main>

    <Teleport to="body">
      <BottomTab v-if="!hideBottomTab" />
    </Teleport>

    <NotificationToast />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import BottomTab from '@/components/BottomTab.vue'
import NotificationToast from '@/components/NotificationToast.vue'
import { startNotificationPolling, stopNotificationPolling } from '@/stores/notificationStore'

const route = useRoute()

// Routes such as login/register set meta.hideBottomNav to hide the tab bar.
const hideBottomTab = computed(() => Boolean(route.meta?.hideBottomNav))

const VIEWPORT_VAR = '--browser-ui-bottom'
const KEYBOARD_VAR = '--keyboard-offset'
const VIEWPORT_OFFSET_TOP_VAR = '--viewport-offset-top'
const KEYBOARD_THRESHOLD_PX = 120
let lastViewportOffsetTop = -1

function updateBrowserUiOffset() {
  if (typeof window === 'undefined') return
  const vv = window.visualViewport
  const layoutHeight = document.documentElement.clientHeight
  const rawOffset = vv ? Math.max(0, layoutHeight - vv.height) : 0
  const keyboardOffset = rawOffset > KEYBOARD_THRESHOLD_PX ? rawOffset : 0
  const browserUiOffset = rawOffset > KEYBOARD_THRESHOLD_PX ? 0 : rawOffset
  const activeEl = document.activeElement
  const isEditable =
    !!activeEl &&
    (activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      (activeEl as HTMLElement).isContentEditable)
  const resolvedKeyboardOffset = isEditable ? keyboardOffset : 0
  document.documentElement.style.setProperty(VIEWPORT_VAR, `${browserUiOffset}px`)
  document.documentElement.style.setProperty(KEYBOARD_VAR, `${resolvedKeyboardOffset}px`)
}

function updateViewportOffsetTop() {
  if (typeof window === 'undefined') return
  const vv = window.visualViewport
  const layoutHeight = document.documentElement.clientHeight
  const rawOffset = vv ? Math.max(0, layoutHeight - vv.height) : 0
  const rawOffsetTop = vv ? Math.max(0, vv.offsetTop) : 0
  const rawSafeTop = getComputedStyle(document.documentElement).getPropertyValue('--safe-top')
  const safeTop = Number.parseFloat(rawSafeTop) || 0
  const adjustedOffsetTop =
    rawOffset > KEYBOARD_THRESHOLD_PX ? Math.max(0, rawOffsetTop - safeTop) : 0
  const nextOffsetTop = Math.round(adjustedOffsetTop)
  if (nextOffsetTop !== lastViewportOffsetTop) {
    document.documentElement.style.setProperty(VIEWPORT_OFFSET_TOP_VAR, `${nextOffsetTop}px`)
    lastViewportOffsetTop = nextOffsetTop
  }
}


let viewportRafId = 0
const handleViewportChange = () => {
  if (viewportRafId) return
  viewportRafId = window.requestAnimationFrame(() => {
    viewportRafId = 0
    updateBrowserUiOffset()
    updateViewportOffsetTop()
  })
}

let viewportScrollRafId = 0
const handleViewportScroll = () => {
  if (viewportScrollRafId) return
  viewportScrollRafId = window.requestAnimationFrame(() => {
    viewportScrollRafId = 0
    updateViewportOffsetTop()
  })
}

onMounted(() => {
  updateBrowserUiOffset()
  updateViewportOffsetTop()
  if (typeof window === 'undefined') return
  startNotificationPolling()
  if (!window.visualViewport) return
  window.visualViewport.addEventListener('resize', handleViewportChange)
  window.visualViewport.addEventListener('scroll', handleViewportScroll)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined' && window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleViewportChange)
    window.visualViewport.removeEventListener('scroll', handleViewportScroll)
  }
  stopNotificationPolling()
})

const lockContentScroll = computed(() => Boolean(route.meta?.lockScroll))
const flushBottomTab = computed(() => Boolean(route.meta?.flushBottomNav))

const contentStyle = computed(() => {
  const style: Record<string, string> = {}
  if (hideBottomTab.value) {
    const viewportHeight = 'calc((var(--app-vh, 1vh) * 100) - var(--header-h))'
    style.paddingBottom = '0'
    style.minHeight = viewportHeight
    style.height = viewportHeight
  } else if (flushBottomTab.value) {
    style.paddingBottom = '0'
  }
  if (lockContentScroll.value) {
    style.overflow = 'hidden'
    style.overflowY = 'hidden'
    style.WebkitOverflowScrolling = 'auto'
  }
  return style
})
</script>

<style>
:root {
  --header-h: 56px;
  --tab-h: 72px;
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-top-fixed: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --browser-ui-bottom: 0px;
  --keyboard-offset: 0px;
  --viewport-offset-top: 0px;
  --header-bg: #fdd651;
  --header-border: #f0b400;
  --app-bg: #fff7e1;
}
* {
  box-sizing: border-box;
}
html,
body,
#app {
  min-height: 100%;
  margin: 0;
  background-color: var(--app-bg, #fff7e1);
}
/* Hide default scrollbars but keep scrollability */
::-webkit-scrollbar {
  display: none;
}
html,
body {
  scrollbar-width: none;
  -ms-overflow-style: none;
  overscroll-behavior: none;
}

body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--safe-top-fixed);
  background: var(--header-bg, #fdd651);
  pointer-events: none;
  z-index: 1000;
}

.app-shell {
  position: relative;
  min-height: 100%;
  background: var(--app-bg, #fff7e1);
}
.app-content {
  padding-top: calc(var(--header-h) + var(--safe-top-fixed));
  padding-bottom: calc(var(--tab-h) + var(--safe-bottom) + var(--browser-ui-bottom)); /* spacing when tab is visible */
  min-height: calc(100dvh - (var(--header-h) + var(--safe-top-fixed)));
}
</style>
