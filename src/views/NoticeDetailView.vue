<template>
  <section v-if="notice" class="detail">
    <header class="detail__header">
      <button class="detail__back" type="button" @click="goBack">목록으로</button>
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
      <button class="detail__back" type="button" @click="goBack">목록으로</button>
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
  summary: '선택한 공지사항을 불러올 수 없습니다.',
  content: ['다시 공지사항 목록에서 확인해 주세요.'],
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function badgeLabel(type: NoticeType) {
  switch (type) {
    case 'update':
      return '업데이트'
    case 'maintenance':
      return '점검'
    default:
      return '공지'
  }
}

function formatFullDate(dateISO: string) {
  const date = new Date(dateISO)
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}.${month}.${day} (${weekday})`
}

function goBack() {
  router.push({ name: 'notice' })
}
</script>

<style scoped>
.detail {
  padding: clamp(28px, 6vw, 60px) clamp(18px, 5vw, 54px) clamp(28px, 5vh, 48px);
  background: #fff7e1;
  color: #3b2600;
  min-height: calc(100dvh - var(--header-h, 0px) - var(--tab-h, 64px));
  display: grid;
  gap: 18px;
  justify-content: center;
}
.detail__header {
  display: grid;
  gap: 8px;
  color: #3b2600;
  width: min(720px, 100%);
}
.detail__back {
  justify-self: flex-start;
  border: none;
  background: transparent;
  color: #a16207;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 0;
}
.detail__back:focus-visible {
  outline: 3px solid rgba(203, 128, 38, 0.35);
  outline-offset: 2px;
  border-radius: 6px;
}
.detail time {
  font-size: 13px;
  color: #a16207;
}
.detail h1 {
  margin: 0;
  font-size: clamp(24px, 5vw, 28px);
  font-weight: 800;
  color: #2b1400;
}
.detail__body {
  width: min(720px, 100%);
  display: grid;
  gap: 14px;
  padding: clamp(18px, 4vw, 24px);
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #f3d193;
  box-shadow: 0 10px 30px rgba(255, 202, 104, 0.18);
  color: #3b2600;
  line-height: 1.6;
  font-size: 15px;
}
.detail--empty {
  align-content: center;
  text-align: center;
}
.detail--empty .detail__header {
  justify-items: center;
}
</style>


