<template>
  <div id="app" class="app-shell">
    <AppHeader />

    <main class="app-content" :style="contentStyle">
      <router-view />
    </main>

    <Teleport to="body">
      <BottomTab v-if="!hideBottomTab" />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import BottomTab from '@/components/BottomTab.vue'

const route = useRoute()

// Routes such as login/register set meta.hideBottomNav to hide the tab bar.
const hideBottomTab = computed(() => Boolean(route.meta?.hideBottomNav))

const VIEWPORT_VAR = '--browser-ui-bottom'

function updateBrowserUiOffset() {
  if (typeof window === 'undefined') return
  const vv = window.visualViewport
  const offset = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0
  document.documentElement.style.setProperty(VIEWPORT_VAR, `${offset}px`)
}

const handleViewportChange = () => updateBrowserUiOffset()

onMounted(() => {
  updateBrowserUiOffset()
  if (typeof window === 'undefined' || !window.visualViewport) return
  window.visualViewport.addEventListener('resize', handleViewportChange)
  window.visualViewport.addEventListener('scroll', handleViewportChange)
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined' || !window.visualViewport) return
  window.visualViewport.removeEventListener('resize', handleViewportChange)
  window.visualViewport.removeEventListener('scroll', handleViewportChange)
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
  --tab-h: 64px;
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --browser-ui-bottom: 0px;
}
* {
  box-sizing: border-box;
}
html,
body,
#app {
  min-height: 100%;
  margin: 0;
}
/* Hide default scrollbars but keep scrollability */
::-webkit-scrollbar {
  display: none;
}
html,
body {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.app-shell {
  position: relative;
  min-height: 100%;
  background: #3a2e20;
}
.app-content {
  padding-top: var(--header-h);
  padding-bottom: calc(var(--tab-h) + var(--safe-bottom) + var(--browser-ui-bottom)); /* spacing when tab is visible */
  min-height: calc(100dvh - var(--header-h));
}
</style>
