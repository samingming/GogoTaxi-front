<template>
  <section class="auth-wrap">
    <div class="card" v-if="pending !== null || !isPendingSocial">
      <div class="logo">
        <img src="@/assets/logo_my.png" alt="꼬꼬 로고" class="logo-img" />
      </div>
      <h1 class="title">{{ isPendingSocial ? `${providerLabel} 회원 정보` : '회원가입' }}</h1>

      <form class="form" @submit.prevent="submit">
        <div class="field">
          <input v-model.trim="name" type="text" placeholder="이름" />
        </div>

        <template v-if="!isPendingSocial">
          <div class="field row">
            <input v-model.trim="userid" type="text" placeholder="아이디" />
            <button type="button" class="ghost" @click="checkId">중복확인</button>
          </div>
        </template>

        <div class="field">
          <input
            v-model.trim="phone"
            type="tel"
            inputmode="tel"
            placeholder="전화번호 (- 없이 입력)"
            @input="onPhoneInput"
            autocomplete="tel-national"
          />
        </div>
        <div class="field">
          <input v-model="birthDate" type="date" placeholder="생년월일" />
        </div>

        <template v-if="!isPendingSocial">
          <div class="field">
            <input v-model="pw" type="password" placeholder="비밀번호" autocomplete="new-password" />
          </div>
          <div class="field">
            <input v-model="pw2" type="password" placeholder="비밀번호 확인" autocomplete="new-password" />
          </div>
        </template>

        <div class="gender-group">
          <span class="group-label">성별</span>
          <div class="gender-options">
            <label class="gender-option male">
              <input type="radio" value="M" v-model="gender" />
              <span class="chip">
                <svg class="gender-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 3h6v2h-3.586l2.293 2.293-1.414 1.414L16 6.414V10h-2V4h-4V2h5a1 1 0 0 1 1 1Z" />
                  <path d="M10 8a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
                </svg>
                <span class="text">남성</span>
              </span>
            </label>
            <label class="gender-option female">
              <input type="radio" value="F" v-model="gender" />
              <span class="chip">
                <svg class="gender-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2a6 6 0 0 1 2 11.657V16h2v2h-2v2h-2v-2H8v-2h2v-2.343A6 6 0 0 1 12 2Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
                </svg>
                <span class="text">여성</span>
              </span>
            </label>
          </div>
        </div>

        <div class="agreements">
          <label><input type="checkbox" v-model="sms" /> SMS 수신 동의(선택)</label>
          <label><input type="checkbox" v-model="terms" /> 이용약관 동의(필수)</label>
        </div>

        <button class="primary" type="submit">
          {{ isPendingSocial ? '동의하고 계속' : '회원가입' }}
        </button>

        <div class="sub-links center">
          <router-link v-if="!isPendingSocial" to="/login">이미 계정이 있으신가요? 로그인</router-link>
          <button v-else type="button" class="ghost" @click="goLogin">취소</button>
        </div>
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
import { computed, ref, watchEffect } from 'vue'
import { isAxiosError } from 'axios'
import { useRouter, useRoute } from 'vue-router'
import {
  registerUser,
  completeSocialOnboarding,
  getPendingSocial,
  clearPendingSocial,
} from '@/services/auth'
import { signupWithApi, isAuthApiConfigured } from '@/services/apiAuth'
import { completeSocialConsent, type LoginResponse } from '@/api/auth'

const router = useRouter()
const route = useRoute()

const name = ref('')
const userid = ref('')
const pw = ref('')
const pw2 = ref('')
const phone = ref('')
const birthDate = ref('')
const gender = ref<'M' | 'F' | ''>('')
const sms = ref(false)
const terms = ref(false)
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
  const nameFromStorage = localStorage.getItem(PENDING_NAME_KEY) || undefined
  const redirect = localStorage.getItem(PENDING_REDIRECT_KEY) || undefined
  return { token, provider, name: nameFromStorage, redirect }
}

function syncRemotePendingFromQuery() {
  const token = typeof route.query.pendingToken === 'string' ? route.query.pendingToken : null
  const provider = typeof route.query.provider === 'string' ? (route.query.provider as RemotePending['provider']) : null
  const nameFromQuery = typeof route.query.name === 'string' ? route.query.name : undefined
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : undefined
  if (token && provider) {
    localStorage.setItem(PENDING_TOKEN_KEY, token)
    localStorage.setItem(PENDING_PROVIDER_KEY, provider)
    if (nameFromQuery) localStorage.setItem(PENDING_NAME_KEY, nameFromQuery)
    if (redirect) localStorage.setItem(PENDING_REDIRECT_KEY, redirect)
  }
}

function clearRemotePending() {
  localStorage.removeItem(PENDING_TOKEN_KEY)
  localStorage.removeItem(PENDING_PROVIDER_KEY)
  localStorage.removeItem(PENDING_NAME_KEY)
  localStorage.removeItem(PENDING_REDIRECT_KEY)
}

if (useRemoteAuth) {
  syncRemotePendingFromQuery()
}

const pendingRemote = ref<RemotePending | null>(useRemoteAuth ? loadRemotePending() : null)
const pendingLocal = ref(useRemoteAuth ? null : getPendingSocial())

if (useRemoteAuth) {
  const loaded = loadRemotePending()
  if (loaded) pendingRemote.value = loaded
}

const pending = computed(() => (useRemoteAuth ? pendingRemote.value : pendingLocal.value))
const isPendingSocial = computed(() => Boolean(pending.value))

const providerLabel = computed(() => {
  const provider = pending.value?.provider
  if (provider === 'kakao') return '카카오'
  if (provider === 'google') return 'Google'
  return '소셜'
})

watchEffect(() => {
  if (pending.value?.name) {
    name.value = pending.value.name
  }
})

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  const len = digits.length
  if (len < 4) return digits
  if (len < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

function onPhoneInput(event: Event) {
  const target = event.target as HTMLInputElement
  const formatted = formatPhone(target.value)
  phone.value = formatted
}

function checkId() {
  if (!userid.value) {
    alert('아이디를 입력해 주세요.')
    return
  }
  alert(`'${userid.value}' 아이디로 가입 가능합니다.`)
}

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

async function submit() {
  if (isPendingSocial.value) {
    await submitSocial()
    return
  }
  const trimmedName = name.value.trim()
  const loginIdInput = userid.value.trim()
  if (!trimmedName || !loginIdInput || !pw.value || !pw2.value || !phone.value || !birthDate.value) {
    alert('필수 항목을 모두 입력해 주세요.')
    return
  }
  if (!gender.value) {
    alert('성별을 선택해 주세요.')
    return
  }
  if (pw.value !== pw2.value) {
    alert('비밀번호가 일치하지 않습니다.')
    return
  }
  const normalizedPhone = phone.value.replace(/\D/g, '')
  if (normalizedPhone.length < 9) {
    alert('전화번호를 확인해 주세요.')
    return
  }
  if (!terms.value) {
    alert('약관에 동의해 주세요.')
    return
  }

  try {
    const loginId = loginIdInput
    if (useRemoteAuth) {
      await signupWithApi({
        loginId,
        password: pw.value,
        name: trimmedName,
        gender: gender.value as 'M' | 'F',
        phone: normalizedPhone,
        birthDate: birthDate.value,
        smsConsent: sms.value,
        termsConsent: terms.value,
      })
    } else {
      registerUser({
        id: loginId,
        name: trimmedName,
        password: pw.value,
        phone: normalizedPhone,
        birthDate: birthDate.value,
        gender: gender.value,
        sms: sms.value,
        terms: terms.value,
      })
    }
    alert('회원가입이 완료되었습니다!')
    router.push({ name: 'login' })
  } catch (err) {
    let message = '회원가입에 실패했습니다.'
    if (isAxiosError(err)) {
      const payload = err.response?.data as { message?: string; error?: string }
      message = payload?.message || payload?.error || `회원가입에 실패했습니다. (코드 ${err.response?.status ?? '알수없음'})`
    } else if (err instanceof Error) {
      message = err.message
    }
    alert(message)
  }
}

async function submitSocial() {
  const normalizedPhone = phone.value.replace(/\D/g, '')
  if (!name.value.trim() || !normalizedPhone || !birthDate.value || !gender.value) {
    alert('이름, 전화번호, 생년월일, 성별을 모두 입력해 주세요.')
    return
  }
  if (normalizedPhone.length < 9) {
    alert('전화번호를 확인해 주세요.')
    return
  }
  if (!terms.value) {
    alert('약관에 동의해 주세요.')
    return
  }

  if (useRemoteAuth) {
    if (!pendingRemote.value) {
      goLogin()
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
      alert('동의 처리에 실패했습니다. 다시 시도해 주세요.')
    }
    return
  }

  if (!pendingLocal.value) {
    goLogin()
    return
  }

  try {
    completeSocialOnboarding({
      id: pendingLocal.value.id,
      provider: pendingLocal.value.provider,
      agreedTerms: true,
      sms: sms.value,
      name: name.value || pendingLocal.value.name,
      gender: gender.value as 'M' | 'F',
      phone: normalizedPhone,
      birthDate: birthDate.value,
    })
    router.replace(pendingLocal.value.redirect || '/home')
  } catch (error) {
    console.error(error)
    alert('동의 처리에 실패했습니다. 다시 시도해 주세요.')
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
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  padding: 28px 24px 24px;
}
.logo {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin: 0 auto 12px;
  background: #fff7d1;
  box-shadow: inset 0 0 0 2px #ffe48e;
}
.logo-img {
  width: 70%;
  height: 70%;
  object-fit: contain;
}
.title {
  text-align: center;
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 700;
}
.description {
  margin: -4px 0 12px;
  text-align: center;
  font-size: 13px;
  color: #5b6471;
}
.form {
  display: grid;
  gap: 12px;
}

.field input {
  width: 100%;
  padding: 13px 14px;
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
.field.row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
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
.gender-icon {
  width: 12px;
  height: 12px;
  fill: currentColor;
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
  gap: 6px;
  color: #555;
  font-size: 14px;
}

.ghost {
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e3e6ec;
  cursor: pointer;
  font-weight: 600;
}

.primary {
  margin-top: 6px;
  background: #ffcf33;
  border: none;
  color: #201a00;
  font-weight: 700;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
}
.sub-links.center {
  text-align: center;
  margin-top: 6px;
}
</style>
