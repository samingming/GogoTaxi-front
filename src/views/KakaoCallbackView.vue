<script setup lang="ts">
import { onMounted } from 'vue'
import { loginWithKakao } from '@/services/kakao'   // ← 정확한 경로!
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(async () => {
  try {
    const profile = await loginWithKakao()
    if (!profile) throw new Error('카카오 로그인 실패')

    router.push('/home')   // 원하면 다른 페이지로 수정 가능
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
