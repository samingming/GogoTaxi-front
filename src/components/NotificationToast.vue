<template>
  <Teleport to="body">
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      <transition-group name="toast" tag="div">
        <article
          v-for="toast in toasts"
          :key="toast.internalId"
          class="toast-item"
          :class="{ 'toast-item--swiping': toast.isSwiping }"
          :style="toastStyle(toast)"
          @pointerdown="onSwipeStart($event, toast)"
          @pointermove="onSwipeMove($event, toast)"
          @pointerup="onSwipeEnd($event, toast)"
          @pointercancel="onSwipeEnd($event, toast)"
        >
          <div class="toast-header">
            <span class="toast-title">{{ toast.title }}</span>
            <time class="toast-time">{{ toast.relative }}</time>
          </div>
          <p class="toast-body">{{ toast.body }}</p>
        </article>
      </transition-group>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { shiftNotificationQueue, useNotificationStore } from '@/stores/notificationStore'

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return `${days}일 전`
}

const store = useNotificationStore()
const toasts = reactive<{
  internalId: string
  id: string
  title: string
  body: string
  createdAt: string
  relative: string
  offsetX: number
  isSwiping: boolean
  startX: number
  startY: number
  pointerId: number | null
}[]>([])

const maxVisible = 3
const visibleDuration = 4500

const showNext = () => {
  if (toasts.length >= maxVisible) return
  const next = shiftNotificationQueue()
  if (!next) return
  const internalId = `${next.id}-${Date.now()}`
  toasts.push({
    internalId,
    id: next.id,
    title: next.title || '알림',
    body: next.body,
    createdAt: next.createdAt,
    relative: formatRelative(next.createdAt),
      offsetX: 0,
    isSwiping: false,
    startX: 0,
    startY: 0,
    pointerId: null,
  })
  window.setTimeout(() => {
    const index = toasts.findIndex((toast) => toast.internalId === internalId)
    if (index >= 0) toasts.splice(index, 1)
  }, visibleDuration)
}

const swipeThreshold = 60

function onSwipeStart(event: PointerEvent, toast: (typeof toasts)[number]) {
  toast.pointerId = event.pointerId
  toast.startX = event.clientX
  toast.startY = event.clientY
  toast.isSwiping = false
  toast.offsetX = 0
  const target = event.currentTarget as HTMLElement | null
  target?.setPointerCapture?.(event.pointerId)
}

function onSwipeMove(event: PointerEvent, toast: (typeof toasts)[number]) {
  if (toast.pointerId !== event.pointerId) return
  const dx = event.clientX - toast.startX
  const dy = event.clientY - toast.startY
  if (!toast.isSwiping) {
    if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
      toast.isSwiping = true
    } else {
      return
    }
  }
  toast.offsetX = dx
}

function onSwipeEnd(event: PointerEvent, toast: (typeof toasts)[number]) {
  if (toast.pointerId !== event.pointerId) return
  const shouldDismiss = Math.abs(toast.offsetX) > swipeThreshold
  toast.pointerId = null
  if (shouldDismiss) {
    removeToast(toast.internalId)
    return
  }
  toast.offsetX = 0
  toast.isSwiping = false
}

function removeToast(internalId: string) {
  const index = toasts.findIndex((item) => item.internalId === internalId)
  if (index >= 0) toasts.splice(index, 1)
}

function toastStyle(toast: (typeof toasts)[number]) {
  if (!toast.offsetX) return {}
  const opacity = Math.max(0.4, 1 - Math.abs(toast.offsetX) / 160)
  return {
    transform: `translateX(${toast.offsetX}px)`,
    opacity,
  }
}

const queueLength = computed(() => store.queue.length)

const stopWatch = watch(queueLength, () => {
  if (queueLength.value > 0) {
    showNext()
  }
})

onMounted(() => {
  showNext()
})

onUnmounted(() => {
  stopWatch()
})
</script>

<style scoped>
.toast-stack {
  position: fixed;
  right: 1.25rem;
  bottom: calc(var(--tab-h) + var(--safe-bottom) + 1.25rem);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 9999;
  pointer-events: none;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(15px) scale(0.98);
}

.toast-item {
  min-width: 260px;
  max-width: min(320px, 80vw);
  background: #fff;
  border-radius: 16px;
  padding: 0.95rem 1.1rem;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(0, 0, 0, 0.05);
  pointer-events: auto;
  touch-action: pan-y;
}
.toast-item--swiping {
  transition: none;
}

.toast-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.toast-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1f2933;
}

.toast-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.toast-body {
  margin: 0;
  font-size: 0.9rem;
  color: #374151;
  line-height: 1.4;
}

@media (max-width: 640px) {
  .toast-stack {
    right: 1rem;
    left: 1rem;
    bottom: calc(var(--tab-h) + var(--safe-bottom) + 0.75rem);
  }

  .toast-item {
    width: 100%;
    max-width: none;
  }
}
</style>
