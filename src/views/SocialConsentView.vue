<template>
  <section class="auth-wrap">
    <div class="card" v-if="pending">
      <div class="logo">
        <img src="@/assets/logo_my.png" alt="꼬꼬택 로고" class="logo-img" />
      </div>
      <h1 class="title">{{ providerLabel }} 약관 동의</h1>
      <p class="description">
        {{ providerLabel }} 계정으로 계속하려면 이용약관에 동의해 주세요.
      </p>

      <form class="form" @submit.prevent="submit">
        <div class="field">
          <label class="field-label" for="social-name">이름</label>
          <input
            id="social-name"
            v-model.trim="name"
            type="text"
            placeholder="이름을 입력해 주세요."
          />
        </div>

        <div class="agreements">
          <label>
            <input type="checkbox" v-model="sms" />
            SMS 수신 동의 (선택)
          </label>
          <label>
            <input type="checkbox" v-model="terms" />
            이용약관 및 개인정보 처리방침 동의 (필수)
          </label>
        </div>

        <button class="primary" type="submit">동의하고 계속</button>
        <button class="ghost" type="button" @click="cancel">취소</button>
      </form>
    </div>

    <div class="card" v-else>
      <h1 class="title">처리할 정보가 없습니다.</h1>
      <p class="description">로그인 화면으로 돌아가 다시 시도해 주세요.</p>
      <button class="primary" type="button" @click="goLogin">로그인으로 이동</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  completeSocialOnboarding,
  getPendingSocial,
  clearPendingSocial,
} from '@/services/auth'

const router = useRouter()
const pending = ref(getPendingSocial())

const name = ref(pending.value?.name ?? '')
const sms = ref(false)
const terms = ref(false)

const providerLabel = computed(() => {
  const provider = pending.value?.provider
  if (provider === 'kakao') return '카카오'
  if (provider === 'google') return 'Google'
  return '소셜'
})

function goLogin() {
  clearPendingSocial()
  router.replace({ name: 'login' })
}

function cancel() {
  goLogin()
}

function submit() {
  if (!pending.value) {
    goLogin()
    return
  }
  if (!terms.value) {
    alert('이용약관 동의는 필수입니다.')
    return
  }

  try {
    completeSocialOnboarding({
      id: pending.value.id,
      provider: pending.value.provider,
      agreedTerms: true,
      sms: sms.value,
      name: name.value || pending.value.name,
    })
    router.replace(pending.value.redirect || '/home')
  } catch (error) {
    console.error(error)
    alert('처리 중 오류가 발생했습니다. 다시 시도해 주세요.')
  }
}
</script>

<style scoped>
.auth-wrap {
  min-height: calc(100vh - var(--header-h, 56px));
  display: grid;
  place-items: start center;
  padding: 32px 16px;
  background: #f6f7f9;
}
.card {
  width: 100%;
  max-width: 360px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
  padding: 28px 22px 26px;
  display: grid;
  gap: 16px;
}
.logo {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin: 0 auto;
  background: #fff7d1;
  box-shadow: inset 0 0 0 2px #ffe48e;
}
.logo-img {
  width: 70%;
  height: 70%;
  object-fit: contain;
}
.title {
  margin: 0;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  color: #1f2933;
}
.description {
  margin: -6px 0 0;
  text-align: center;
  font-size: 13px;
  color: #5b6471;
}
.form {
  display: grid;
  gap: 14px;
}
.field {
  display: grid;
  gap: 6px;
}
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #3d475c;
}
.field input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e3e6ec;
  background: #fafbff;
  outline: none;
  font-size: 14px;
}
.field input:focus {
  border-color: #8aa8ff;
  background: #fff;
}
.agreements {
  display: grid;
  gap: 8px;
  font-size: 14px;
  color: #4f566b;
}
.agreements label {
  display: flex;
  align-items: center;
  gap: 8px;
}
.primary {
  background: #ffcf33;
  border: none;
  color: #201a00;
  font-weight: 700;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
}
.ghost {
  background: #fff;
  border: 1px solid #e3e6ec;
  color: #374151;
  font-weight: 600;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
}
</style>
