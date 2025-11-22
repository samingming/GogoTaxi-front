<script setup lang="ts">
import { onMounted } from 'vue'
import { loginWithGoogle } from '@/services/google'   // ← 정확한 경로!
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(async () => {
  try {
    const { accessToken } = await loginWithGoogle()
    if (!accessToken) throw new Error('구글 로그인 실패')

    router.push('/home')
  } catch (err) {
    console.error(err)
    alert('구글 로그인 처리 중 오류가 발생했습니다.')
    router.push('/login')
  }
})
</script>

<template>
  <div style="padding:20px;text-align:center;">
    <h2>구글 로그인 중...</h2>
  </div>
</template>
