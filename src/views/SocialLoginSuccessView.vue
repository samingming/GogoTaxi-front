<template>
  <section class="auth-wrap">
    <div class="card">
      <h1 class="title">로그인 처리 중...</h1>
      <p class="description">잠시만 기다려 주세요.</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const error = ref('')

function persistSession(params: { accessToken: string; refreshToken?: string; user?: unknown }) {
  localStorage.setItem('gogotaxi_access_token', params.accessToken)
  localStorage.setItem('gogotaxi_token', params.accessToken)
  if (params.refreshToken) localStorage.setItem('gogotaxi_refresh_token', params.refreshToken)
  if (params.user) localStorage.setItem('gogotaxi_user', JSON.stringify(params.user))
}

onMounted(() => {
  const accessToken = typeof route.query.accessToken === 'string' ? route.query.accessToken : null
  const refreshToken = typeof route.query.refreshToken === 'string' ? route.query.refreshToken : undefined
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/home'

  if (!accessToken) {
    error.value = '토큰 정보가 없습니다. 다시 로그인해 주세요.'
    setTimeout(() => router.replace({ name: 'login' }), 1500)
    return
  }

  // optional user info could be provided later; for now just tokens
  persistSession({ accessToken, refreshToken })
  router.replace(redirect || '/home')
})
</script>

<style scoped>
.auth-wrap {
  min-height: calc(100vh - var(--header-h, 56px));
  display: grid;
  place-items: center;
  padding: 32px 16px;
  background: #f6f7f9;
}
.card {
  width: 100%;
  max-width: 360px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
  padding: 24px 20px;
  text-align: center;
  display: grid;
  gap: 8px;
}
.title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}
.description {
  margin: 0;
  color: #5b6471;
  font-size: 14px;
}
.error {
  color: #d12;
  font-weight: 600;
}
</style>
