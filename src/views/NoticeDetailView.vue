<template>
  <section v-if="notice" class="detail">
    <header class="detail__header">
      <button class="detail__back" type="button" @click="goBack">목록으로</button>
      <span class="detail__badge" :class="`badge--${notice.type}`">
        {{ badgeLabel(notice.type) }}
      </span>
      <time :datetime="notice.date">{{ formatFullDate(notice.date) }}</time>
      <h1>{{ notice.title }}</h1>
    </header>

    <article class="detail__body">
      <p v-for="(paragraph, idx) in notice.content" :key="idx">
        {{ paragraph }}
      </p>
    </article>
  </section>
  <section v-else class="detail detail--empty">
    <header class="detail__header">
      <h1>공지사항을 찾을 수 없어요.</h1>
      <button class="detail__back" type="button" @click="goBack">← 목록으로</button>
    </header>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { notices, type Notice, type NoticeType } from '@/components/notices'

const route = useRoute()
const router = useRouter()

const fallbackNotice: Notice = {
  id: 'fallback',
  title: '공지 정보를 찾을 수 없습니다.',
  summary: '요청하신 공지를 찾을 수 없습니다.',
  content: ['다시 공지 목록에서 확인해 주세요.'],
  date: '',
  type: 'info',
}

const notice = computed<Notice>(() => {
  const id = route.params.id as string | undefined
  if (!id) {
    router.replace({ name: 'notice' })
    return notices[0] ?? fallbackNotice
  }
  const found = notices.find(item => item.id === id)
  if (!found) {
    router.replace({ name: 'notice' })
    return notices[0] ?? fallbackNotice
  }
  return found
})

function badgeLabel(type: NoticeType) {
  switch (type) {
    case 'update':
      return '업데이트'
    case 'maintenance':
      return '점검'
    default:
      return '안내'
  }
}

function formatFullDate(dateISO: string) {
  const date = new Date(dateISO)
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}년 ${month}월 ${day}일 (${weekday})`
}

function goBack() {
  router.push({ name: 'notice' })
}
</script>

<style scoped>
.detail {
  padding: clamp(96px, 14vh, 140px) clamp(18px, 5vw, 48px) clamp(80px, 12vh, 140px);
  background: #3a2e20;
  min-height: calc(100dvh - var(--header-h));
  display: grid;
  gap: clamp(24px, 4vw, 36px);
}
.detail__header {
  display: grid;
  gap: 10px;
  color: #f8f1e4;
  max-width: 900px;
}
.detail__back {
  justify-self: flex-start;
  border: none;
  background: none;
  color: #fdd651;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
}
.detail__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: max-content;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #2f1c00;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.16);
}
.badge--update,
.badge--maintenance {
  background: #fdd651;
}
.badge--info {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: #fff;
}
.detail time {
  font-size: 13px;
  color: rgba(255, 244, 220, 0.7);
}
.detail h1 {
  margin: 0;
  font-size: clamp(26px, 5vw, 34px);
}
.detail__body {
  max-width: 900px;
  display: grid;
  gap: 18px;
  padding: clamp(22px, 4vw, 34px);
  border-radius: 28px;
  background: #ffffff;
  border: 1px solid rgba(120, 92, 68, 0.12);
  box-shadow: 0 30px 60px rgba(20, 12, 6, 0.18);
  color: #4f4338;
  line-height: 1.8;
  font-size: 16px;
}
.detail--empty {
  align-content: center;
  text-align: center;
}
.detail--empty .detail__header {
  justify-items: center;
}
</style>
