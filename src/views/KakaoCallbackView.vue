<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { loginWithKakao } from '@/services/kakao'

const router = useRouter()

onMounted(async () => {
  try {
    const profile = await loginWithKakao()
    if (!profile) throw new Error('카카오 로그인에 실패했습니다.')

    router.push('/home')
  } catch (err) {
    console.error(err)
    alert('카카오 로그인 처리 중 오류가 발생했습니다.')
    router.push('/login')
  }
})
</script>

<template>
  <div style="padding:20px;text-align:center;">
    <h2>카카오 로그인 중...</h2>
  </div>
</template>
