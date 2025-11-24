// src/services/kakao.ts
// Helper for loading Kakao JavaScript SDK and performing login flow.

type KakaoSDK = {
  init(appKey: string): void
  isInitialized(): boolean
  Auth: {
    login(config: {
      scope?: string
      success(response: unknown): void
      fail(error: unknown): void
    }): void
    logout(): void
  }
  API: {
    request<T = unknown>(config: {
      url: string
      data?: Record<string, unknown>
    }): Promise<T>
  }
}

declare global {
  interface Window {
    Kakao?: KakaoSDK
  }
}

const KAKAO_SDK_URL = 'https://developers.kakao.com/sdk/js/kakao.min.js'
const SDK_SCRIPT_ID = 'kakao-sdk'

async function loadKakaoScript(): Promise<void> {
  if (typeof document === 'undefined') {
    throw new Error('카카오 SDK는 브라우저 환경에서만 사용할 수 있습니다.')
  }
  if (document.getElementById(SDK_SCRIPT_ID)) return

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.id = SDK_SCRIPT_ID
    script.src = `${KAKAO_SDK_URL}?autoload=false`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('카카오 SDK 로드에 실패했습니다.'))
    document.head.appendChild(script)
  })
}

async function ensureKakao(): Promise<KakaoSDK> {
  if (typeof window === 'undefined') {
    throw new Error('카카오 SDK는 브라우저 환경에서만 사용할 수 있습니다.')
  }

  if (!window.Kakao) {
    await loadKakaoScript()
    if (!window.Kakao) {
      throw new Error('카카오 SDK가 로드되지 않았습니다.')
    }
  }

  const kakao = window.Kakao
  if (!kakao.isInitialized()) {
    const appKey = import.meta.env.VITE_KAKAO_JS_KEY
    if (!appKey) {
      throw new Error('VITE_KAKAO_JS_KEY가 설정되어 있지 않습니다.')
    }
    kakao.init(appKey)
  }

  return kakao
}

type KakaoUserResponse = {
  id?: number
  properties?: { nickname?: string }
  kakao_account?: {
    profile?: { nickname?: string }
  }
}

export async function loginWithKakao(): Promise<{ id: string; name?: string; accessToken?: string }> {
  const kakao = await ensureKakao()

  let accessToken: string | undefined

  await new Promise<void>((resolve, reject) => {
    kakao.Auth.login({
      scope: 'profile_nickname',
      success: (response: unknown) => {
        const token = response as { access_token?: string; accessToken?: string }
        accessToken = token.accessToken || token.access_token
        resolve()
      },
      fail: error => reject(error),
    })
  })

  try {
    const profile = await kakao.API.request<KakaoUserResponse>({ url: '/v2/user/me' })
    const id = profile.id ? String(profile.id) : ''
    if (!id) throw new Error('카카오 사용자 식별자를 가져오지 못했습니다.')
    const nickname =
      profile.kakao_account?.profile?.nickname ?? profile.properties?.nickname ?? undefined
    return { id, name: nickname, accessToken }
  } catch (error) {
    kakao.Auth.logout()
    throw error instanceof Error
      ? error
      : new Error('카카오 사용자 정보를 가져오지 못했습니다.')
  }
}

export {}
