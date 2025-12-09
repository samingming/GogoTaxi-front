<template>
  <section class="auth-wrap">
    <div class="card">
      <div class="logo">
        <img src="@/assets/logo_my.png" alt="꼬꼬택 로고" class="logo-img" />
      </div>
      <h1 class="title">로그인</h1>

      <!-- ✅ 핸들러 이름만 onSubmit 으로 변경 -->
      <form class="form" @submit.prevent="login">
        <div class="field">
          <input
            v-model="id"
            type="text"
            placeholder="아이디"
            autocomplete="username"
          />
        </div>
        <div class="field">
          <input
            v-model="pw"
            type="password"
            placeholder="비밀번호"
            autocomplete="current-password"
          />
        </div>

        <button class="primary" type="submit" :disabled="loading">
          {{ loading ? "로그인 중..." : "로그인" }}
        </button>

        <div class="sub-links">
          <router-link to="/find-account">아이디/비밀번호 찾기</router-link>
          <router-link to="/register">회원가입</router-link>
        </div>
      </form>

      <div class="sep"><span>또는</span></div>
      <div class="social">
        <button class="social-btn kakao" type="button" @click="kakaoLogin">
          <span class="kakao-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16 4C8.268 4 2 8.61 2 14.24c0 3.75 2.68 6.97 6.7 8.65L7.724 27.4a1 1 0 0 0 1.46 1.1l5.474-3.11c.447.03.9.05 1.342.05 7.732 0 14-4.61 14-10.24C30 8.61 23.732 4 16 4Z"
                fill="#000000"
              />
            </svg>
          </span>
          <span class="kakao-label">카카오 로그인</span>
        </button>

        <button
          class="social-btn google gsi-material-button"
          type="button"
          @click="googleLogin"
        >
          <span class="gsi-material-button-state"></span>
          <span class="gsi-material-button-content-wrapper">
            <span class="gsi-material-button-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.60l6.85-6.85C35.90 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
            </span>
            <span class="gsi-material-button-contents">Google 로그인</span>
          </span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// ✅ 백엔드 로그인 API
import type { LoginResponse, SocialLoginResponse } from '@/api/auth'
import { login as loginApi, socialLogin as socialLoginApi } from '@/api/auth'

// ✅ 소셜 로그인 기존 로직 유지
import { socialLogin as socialLoginLocal } from '@/services/auth'
import { loginWithKakao } from '@/services/kakao'
import { loginWithGoogle } from '@/services/google'
import { isAuthApiConfigured } from '@/services/apiAuth'

const router = useRouter()
const route = useRoute()

const id = ref('')
const pw = ref('')
const loading = ref(false)
const useRemoteAuth = isAuthApiConfigured

const PENDING_TOKEN_KEY = 'gogotaxi_pending_social_token'
const PENDING_PROVIDER_KEY = 'gogotaxi_pending_social_provider'
const PENDING_NAME_KEY = 'gogotaxi_pending_social_name'
const PENDING_REDIRECT_KEY = 'gogotaxi_pending_social_redirect'

// 로그인 후 이동할 경로
function resolveRedirect() {
  return (route.query.redirect as string) || '/home'
}

// 에러 메시지 뽑기
function resolveErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: unknown } }).response
    const data = response?.data
    if (typeof data === 'string') return data
    if (data && typeof data === 'object' && 'message' in data) {
      return String((data as { message: unknown }).message)
    }
  }
  return err instanceof Error ? err.message : fallback
}

function persistSession(res: LoginResponse) {
  const accessToken = res.accessToken || (res as { token?: string }).token
  if (accessToken) {
    localStorage.setItem('gogotaxi_token', accessToken)
    localStorage.setItem('gogotaxi_access_token', accessToken)
  }
  localStorage.setItem('gogotaxi_user', JSON.stringify(res.user))
  const refreshToken = res.refreshToken
  if (refreshToken) localStorage.setItem('gogotaxi_refresh_token', refreshToken)
}

function storePendingConsent(params: { token: string; provider: string; name?: string; redirect?: string }) {
  localStorage.setItem(PENDING_TOKEN_KEY, params.token)
  localStorage.setItem(PENDING_PROVIDER_KEY, params.provider)
  if (params.name) {
    localStorage.setItem(PENDING_NAME_KEY, params.name)
  } else {
    localStorage.removeItem(PENDING_NAME_KEY)
  }
  if (params.redirect) {
    localStorage.setItem(PENDING_REDIRECT_KEY, params.redirect)
  } else {
    localStorage.removeItem(PENDING_REDIRECT_KEY)
  }
}

function clearPendingConsent() {
  localStorage.removeItem(PENDING_TOKEN_KEY)
  localStorage.removeItem(PENDING_PROVIDER_KEY)
  localStorage.removeItem(PENDING_NAME_KEY)
  localStorage.removeItem(PENDING_REDIRECT_KEY)
}

async function handleRemoteSocial(result: SocialLoginResponse, redirect: string) {
  if (result.status === 'needs_consent') {
    storePendingConsent({
      token: result.pendingToken,
      provider: result.provider,
      name: result.profileName ?? undefined,
      redirect,
    })
    router.push({ name: 'social-consent' })
    return
  }
  clearPendingConsent()
  persistSession(result)
  router.push(redirect)
}

// 🔥 실제 로그인 처리
async function login() {
  if (!id.value || !pw.value) {
    alert('아이디와 비밀번호를 모두 입력해 주세요.')
    return
  }

  loading.value = true

  try {
    const res = await loginApi(id.value.trim(), pw.value)
    persistSession(res)
    router.push(resolveRedirect())
  } catch (err: unknown) {
    console.error(err)
    const msg = resolveErrorMessage(err, '로그인에 실패했습니다.')
    alert(msg)
  } finally {
    loading.value = false
  }
}
// 카카오 로그인
async function kakaoLogin() {
  const redirect = resolveRedirect()
  if (useRemoteAuth) {
    // Use backend-driven OAuth start to ensure we get pendingToken via callback.
    const base = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || ''
    const url = `${base}/api/auth/social/kakao/start?state=${encodeURIComponent(redirect)}`
    window.location.href = url
    return
  }
  try {
    const profile = await loginWithKakao()
    const result = socialLoginLocal('kakao', profile, { redirect })
    if (result.status === 'needs_terms') {
      router.push({ name: 'social-consent' })
      return
    }
    router.push(redirect)
  } catch (err: unknown) {
    console.error(err)
    const msg =
      err instanceof Error
        ? err.message
        : '카카오 로그인 중 오류가 발생했어요.'
    alert(msg)
  }
}
// 구글 로그인
async function googleLogin() {
  try {
    const redirect = resolveRedirect()
    const { accessToken } = await loginWithGoogle()
    if (useRemoteAuth) {
      const result = await socialLoginApi({
        provider: 'google',
        accessToken,
        redirectUri: redirect,
      })
      await handleRemoteSocial(result, redirect)
    } else {
      const result = socialLoginLocal(
        'google',
        { id: accessToken, name: 'Google 사용자' },
        { redirect }
      )
      if (result.status === 'needs_terms') {
        router.push({ name: 'social-consent' })
        return
      }
      router.push(redirect)
    }
  } catch (err: unknown) {
    console.error(err)
    const msg =
      err instanceof Error ? err.message : 'Google 로그인 중 오류가 발생했어요.'
    alert(msg)
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
  max-width: 380px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  padding: 28px 22px 22px;
}

.logo {
  width: 72px;
  height: 72px;
  border-radius: 48%;
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
  margin: 0 0 16px;
  font-size: 22px;
  font-weight: 700;
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
  outline: none;
  font-size: 16px;
  background: #fafbff;
}

.field input:focus {
  border-color: #8aa8ff;
  background: #fff;
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

.sub-links {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.sep {
  margin: 18px 0 10px;
  text-align: center;
  color: #9aa3af;
  font-size: 12px;
}

.sep span {
  background: #fff;
  padding: 0 8px;
}

.social {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.social-btn {
  width: 200px;
  height: 50px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 12px;
  cursor: pointer;
  border: none;
  background: none;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
}

.kakao {
  background: #fee500;
  color: rgba(0, 0, 0, 0.85);
  font-family: 'Roboto', 'Noto Sans KR', sans-serif;
}

.kakao-icon {
  display: inline-flex;
  width: 22px;
  height: 22px;
}

.kakao-icon svg {
  width: 100%;
  height: 100%;
  display: block;
  fill: #000000;
}

.kakao-label {
  white-space: nowrap;
}

.gsi-material-button {
  border-radius: 12px;
  border: 1px solid #dadce0;
  background-color: #fff;
  font-family: 'Roboto', arial, sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #202124;
  letter-spacing: 0.1px;
}

.gsi-material-button:focus-visible {
  outline: 3px solid rgba(66, 133, 244, 0.35);
  outline-offset: 2px;
}

.gsi-material-button:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
}

.gsi-material-button .gsi-material-button-content-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.gsi-material-button .gsi-material-button-icon {
  width: 20px;
  height: 20px;
  display: inline-flex;
}

.gsi-material-button .gsi-material-button-icon svg {
  width: 100%;
  height: 100%;
  display: block;
}

.gsi-material-button .gsi-material-button-contents {
  white-space: nowrap;
}

.gsi-material-button .gsi-material-button-state {
  display: none;
}
</style>
