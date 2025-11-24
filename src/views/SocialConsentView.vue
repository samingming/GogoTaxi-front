<template>
  <section class="auth-wrap">
    <div class="card" v-if="pending">
      <div class="logo">
        <img src="@/assets/logo_my.png" alt="꼬꼬로고" class="logo-img" />
      </div>
      <h1 class="title">{{ providerLabel }} 약관 동의</h1>
      <p class="description">{{ providerLabel }} 계정으로 계속하려면 이용약관에 동의해 주세요.</p>

      <form class="form" @submit.prevent="submit">
        <div class="field">
          <label class="field-label" for="social-name">이름</label>
          <input id="social-name" v-model.trim="name" type="text" placeholder="이름을 입력해 주세요." />
        </div>

        <div class="field">
          <label class="field-label" for="social-phone">휴대폰 번호</label>
          <input
            id="social-phone"
            v-model.trim="phone"
            type="tel"
            inputmode="tel"
            autocomplete="tel-national"
            placeholder="숫자만 입력해 주세요."
          />
        </div>

        <div class="field">
          <label class="field-label" for="social-birth">생년월일</label>
          <input id="social-birth" v-model="birthDate" type="date" />
        </div>

        <div class="gender-group">
          <span class="group-label">성별</span>
          <div class="gender-options">
            <label class="gender-option male">
              <input type="radio" value="M" v-model="gender" />
              <span class="chip"><span class="text">남성</span></span>
            </label>
            <label class="gender-option female">
              <input type="radio" value="F" v-model="gender" />
              <span class="chip"><span class="text">여성</span></span>
            </label>
          </div>
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
import { useRouter, useRoute } from 'vue-router'
import { completeSocialOnboarding, getPendingSocial, clearPendingSocial } from '@/services/auth'
import { completeSocialConsent, type LoginResponse } from '@/api/auth'
import { isAuthApiConfigured } from '@/services/apiAuth'

const router = useRouter()
const route = useRoute()
const useRemoteAuth = isAuthApiConfigured

const PENDING_TOKEN_KEY = 'gogotaxi_pending_social_token'
const PENDING_PROVIDER_KEY = 'gogotaxi_pending_social_provider'
const PENDING_NAME_KEY = 'gogotaxi_pending_social_name'
const PENDING_REDIRECT_KEY = 'gogotaxi_pending_social_redirect'

type RemotePending = {
  token: string
  provider: 'kakao' | 'google'
  name?: string
  redirect?: string
}

function loadRemotePending(): RemotePending | null {
  const token = localStorage.getItem(PENDING_TOKEN_KEY)
  if (!token) return null
  const provider = localStorage.getItem(PENDING_PROVIDER_KEY) as RemotePending['provider'] | null
  if (!provider) return null
  const name = localStorage.getItem(PENDING_NAME_KEY) || undefined
  const redirect = localStorage.getItem(PENDING_REDIRECT_KEY) || undefined
  return { token, provider, name, redirect }
}

function syncRemotePendingFromQuery() {
  const token = typeof route.query.pendingToken === 'string' ? route.query.pendingToken : null
  const provider = typeof route.query.provider === 'string' ? (route.query.provider as RemotePending['provider']) : null
  const name = typeof route.query.name === 'string' ? route.query.name : undefined
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : undefined
  if (token && provider) {
    localStorage.setItem(PENDING_TOKEN_KEY, token)
    localStorage.setItem(PENDING_PROVIDER_KEY, provider)
    if (name) localStorage.setItem(PENDING_NAME_KEY, name)
    if (redirect) localStorage.setItem(PENDING_REDIRECT_KEY, redirect)
  }
}

if (useRemoteAuth) {
  syncRemotePendingFromQuery()
}

function clearRemotePending() {
  localStorage.removeItem(PENDING_TOKEN_KEY)
  localStorage.removeItem(PENDING_PROVIDER_KEY)
  localStorage.removeItem(PENDING_NAME_KEY)
  localStorage.removeItem(PENDING_REDIRECT_KEY)
}

const pendingRemote = ref<RemotePending | null>(useRemoteAuth ? loadRemotePending() : null)
const pendingLocal = ref(useRemoteAuth ? null : getPendingSocial())

// Ensure reactive pending gets refreshed when arriving via query params
if (useRemoteAuth) {
  const loaded = loadRemotePending()
  if (loaded) pendingRemote.value = loaded
}

const pending = computed(() => (useRemoteAuth ? pendingRemote.value : pendingLocal.value))

const name = ref(pendingRemote.value?.name ?? pendingLocal.value?.name ?? '')
const phone = ref('')
const birthDate = ref('')
const gender = ref<'M' | 'F' | ''>('')
const sms = ref(false)
const terms = ref(false)

const providerLabel = computed(() => {
  const provider = useRemoteAuth ? pendingRemote.value?.provider : pendingLocal.value?.provider
  if (provider === 'kakao') return '카카오'
  if (provider === 'google') return 'Google'
  return '소셜'
})

function persistSession(res: LoginResponse) {
  localStorage.setItem('gogotaxi_token', res.accessToken)
  localStorage.setItem('gogotaxi_user', JSON.stringify(res.user))
  localStorage.setItem('gogotaxi_access_token', res.accessToken)
  if (res.refreshToken) {
    localStorage.setItem('gogotaxi_refresh_token', res.refreshToken)
  }
}

function goLogin() {
  clearPendingSocial()
  clearRemotePending()
  router.replace({ name: 'login' })
}

function cancel() {
  goLogin()
}

async function submit() {
  if (useRemoteAuth) {
    if (!pendingRemote.value) {
      goLogin()
      return
    }
    const normalizedPhone = phone.value.replace(/\D/g, '')
    if (!name.value.trim() || !normalizedPhone || !birthDate.value || !gender.value) {
      alert('이름, 휴대폰번호, 생년월일, 성별을 모두 입력해 주세요.')
      return
    }
    if (normalizedPhone.length < 9) {
      alert('휴대폰 번호를 확인해 주세요.')
      return
    }
    if (!terms.value) {
      alert('약관에 동의해 주세요.')
      return
    }
    try {
      const res = await completeSocialConsent({
        pendingToken: pendingRemote.value.token,
        termsConsent: true,
        smsConsent: sms.value,
        name: name.value || pendingRemote.value.name,
        phone: normalizedPhone,
        birthDate: birthDate.value,
        gender: gender.value as 'M' | 'F',
      })
      persistSession(res)
      const redirect = pendingRemote.value.redirect || '/home'
      clearRemotePending()
      router.replace(redirect)
    } catch (error) {
      console.error(error)
      alert('요청을 처리하지 못했습니다. 다시 시도해 주세요.')
    }
    return
  }

  if (!pendingLocal.value) {
    goLogin()
    return
  }
  if (!terms.value) {
    alert('약관에 동의해 주세요.')
    return
  }

  try {
    completeSocialOnboarding({
      id: pendingLocal.value.id,
      provider: pendingLocal.value.provider,
      agreedTerms: true,
      sms: sms.value,
      name: name.value || pendingLocal.value.name,
    })
    router.replace(pendingLocal.value.redirect || '/home')
  } catch (error) {
    console.error(error)
    alert('요청을 처리하지 못했습니다. 다시 시도해 주세요.')
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
  max-width: 420px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
  padding: 28px 24px 26px;
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
.gender-group {
  display: grid;
  gap: 8px;
}
.group-label {
  font-size: 13px;
  font-weight: 600;
  color: #3d475c;
}
.gender-options {
  display: flex;
  gap: 12px;
}
.gender-option {
  flex: 1;
  position: relative;
}
.gender-option input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.chip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid #e3e6ec;
  background: #fff;
  font-weight: 600;
  color: #4f566b;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s, color 0.2s;
}
.gender-option.male .chip {
  color: #3b63ff;
  border-color: #d7e0ff;
  background: #f3f6ff;
}
.gender-option.female .chip {
  color: #ff6fae;
  border-color: #ffd6ec;
  background: #fff3fa;
}
.gender-option input:checked + .chip {
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.1);
}
.gender-option.male input:checked + .chip {
  border-color: #3b63ff;
  background: #e8eeff;
  color: #1d3dff;
}
.gender-option.female input:checked + .chip {
  border-color: #ff73b5;
  background: #ffe9f4;
  color: #ff3a9a;
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
