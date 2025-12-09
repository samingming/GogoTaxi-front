<template>
  <section class="notice">
    <header class="notice__header">
      <div class="notice__header-top">
        <button type="button" class="back-button" :aria-label="backLabel" @click="goBack">
          <img :src="arrowBackIcon" alt="" class="back-icon" aria-hidden="true" />
        </button>
        <h1>공지사항</h1>
        <span class="header-spacer" aria-hidden="true"></span>
      </div>
    </header>

    <div class="notice__layout">
      <aside class="notice__list" aria-label="공지사항 목록">
        <article v-for="notice in sortedNotices" :key="notice.id" class="notice-card">
          <div class="notice-card__header">
            <time :datetime="notice.date">{{ formatDate(notice.date) }}</time>
          </div>
          <h2>{{ notice.title }}</h2>
          <button class="notice-card__action" type="button" @click="goDetail(notice.id)">
            자세히 보기
            <span aria-hidden="true">&rarr;</span>
          </button>
        </article>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { notices } from '@/components/notices'
import type { NoticeType } from '@/components/notices'
import arrowBackIcon from '@/assets/arrowback.svg'

const router = useRouter()
const backLabel = '\uB4A4\uB85C\uAC00\uAE30'

const sortedNotices = computed(() =>
  [...notices].sort((a, b) => (a.date < b.date ? 1 : -1)),
)

function goDetail(id: string) {
  router.push({ name: 'notice-detail', params: { id } })
}

function goBack() {
  router.push({ name: 'mypage' })
}

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

function formatDate(dateISO: string) {
  const date = new Date(dateISO)
  return `${date.getFullYear()}.${`${date.getMonth() + 1}`.padStart(2, '0')}.${`${date.getDate()}`.padStart(2, '0')}`
}
</script>

<style scoped>
.notice {
  padding: clamp(20px, 5vw, 40px) clamp(16px, 5vw, 32px) clamp(20px, 5vh, 36px);
  background: #fff7e1;
  color: #3b2600;
  min-height: calc(100dvh - var(--header-h, 0px) - var(--tab-h, 64px));
  box-sizing: border-box;
}
.notice__header {
  width: 100%;
  margin: 0 0 14px;
  text-align: center;
  color: #3b2600;
}
.notice__header-top {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.notice__header h1 {
  margin: 0;
  font-size: clamp(24px, 5vw, 28px);
  font-weight: 800;
  color: #2b1400;
}
.back-button {
  border: none;
  background: transparent;
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.back-button:focus-visible {
  outline: 3px solid rgba(203, 128, 38, 0.4);
  border-radius: 8px;
  outline-offset: 2px;
}
.back-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}
.header-spacer {
  width: 24px;
  height: 24px;
  display: block;
}
.notice__layout {
  width: min(720px, 100%);
  margin: 0 auto;
  display: grid;
  gap: 14px;
  justify-items: center;
}
.notice__list {
  display: grid;
  gap: 12px;
  width: 100%;
}
.notice-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: clamp(14px, 4vw, 18px);
  border-radius: 20px;
  border: 1px solid #f3d193;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(255, 202, 104, 0.18);
  transition: transform 0.14s ease, box-shadow 0.14s ease;
  width: 100%;
}
.notice-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #a16207;
}
.notice-card h2 {
  margin: 0;
  font-size: 1.02rem;
  color: #3b2600;
}
.notice-card__action {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(234, 179, 8, 0.35);
  font-size: 13px;
  font-weight: 700;
  color: #a16207;
  background: rgba(250, 204, 21, 0.18);
  cursor: pointer;
  transition: transform 0.14s ease, box-shadow 0.14s ease, background 0.14s ease, color 0.14s ease;
}
.notice-card__action:hover {
  transform: translateY(-1px);
  background: rgba(250, 204, 21, 0.32);
  color: #7c2d12;
}
</style>




