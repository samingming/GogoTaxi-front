type OAuthTokenResponse = {
  access_token?: string
  error?: string
  error_description?: string
}

type OAuthTokenClient = {
  requestAccessToken(config?: { prompt?: string }): void
}

type GoogleSDK = {
  accounts?: {
    oauth2?: {
      initTokenClient(config: {
        client_id: string
        scope: string
        prompt?: string
        callback: (response: OAuthTokenResponse) => void
      }): OAuthTokenClient
    }
  }
}

declare global {
  interface Window {
    google?: GoogleSDK
  }
}

const GOOGLE_SDK_SRC = 'https://accounts.google.com/gsi/client'

let loadPromise: Promise<void> | null = null

function loadGoogleSDK(): Promise<void> {
  if (loadPromise) return loadPromise
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('Google SDK는 브라우저에서만 사용할 수 있습니다.'))
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SDK_SRC}"]`)
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Google SDK 로드에 실패했습니다.')))
      return
    }

    const script = document.createElement('script')
    script.src = GOOGLE_SDK_SRC
    script.async = true
    script.dataset.loaded = 'false'
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error('Google SDK 로드에 실패했습니다.'))
    document.head.appendChild(script)
  })

  return loadPromise
}

export async function loginWithGoogle(): Promise<{ accessToken: string }> {
  if (typeof window === 'undefined') {
    throw new Error('Google SDK는 브라우저에서만 사용할 수 있습니다.')
  }

  await loadGoogleSDK()
  const google = window.google
  if (!google?.accounts?.oauth2?.initTokenClient) {
    throw new Error('Google OAuth 클라이언트를 초기화할 수 없습니다.')
  }

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID가 설정되어 있지 않습니다.')
  }

  return await new Promise((resolve, reject) => {
    const client = google.accounts!.oauth2!.initTokenClient({
      client_id: clientId,
      scope: 'profile email',
      prompt: 'consent',
      callback: response => {
        if (response.access_token) {
          resolve({ accessToken: response.access_token })
        } else {
          const message = response.error_description || response.error || 'Google 로그인에 실패했습니다.'
          reject(new Error(message))
        }
      },
    })

    try {
      client.requestAccessToken({ prompt: 'consent' })
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Google 로그인 요청 중 오류가 발생했습니다.'))
    }
  })
}

export {}
