<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { loginWithGoogle } from '@/services/google'

const router = useRouter()

onMounted(async () => {
  try {
    const { accessToken } = await loginWithGoogle()
    if (!accessToken) throw new Error('Google 로그인에 실패했습니다.')

    router.push('/home')
  } catch (err) {
    console.error(err)
    alert('Google 로그인 처리 중 오류가 발생했습니다.')
    router.push('/login')
  }
})
</script>

<template>
  <div style="padding:20px;text-align:center;">
    <h2>Google 로그인 중...</h2>
  </div>
</template>
