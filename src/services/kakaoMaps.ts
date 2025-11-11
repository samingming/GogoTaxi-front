const KAKAO_SDK_URL = 'https://dapi.kakao.com/v2/maps/sdk.js'

type KakaoNamespace = typeof window.kakao

let loaderPromise: Promise<KakaoNamespace | null> | null = null

function buildScriptSrc(appKey: string, libraries: string[]) {
  const params = new URLSearchParams({
    appkey: appKey,
    autoload: 'false',
  })
  if (libraries.length) {
    params.append('libraries', Array.from(new Set(libraries)).join(','))
  }
  return `${KAKAO_SDK_URL}?${params.toString()}`
}

export function loadKakaoMaps(options?: { libraries?: string[] }) {
  if (loaderPromise) return loaderPromise

  loaderPromise = new Promise<KakaoNamespace | null>((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null)
      return
    }

    if (window.kakao?.maps) {
      resolve(window.kakao)
      return
    }

    const appKey = import.meta.env.VITE_KAKAO_JS_KEY
    if (!appKey) {
      console.error('[kakaoMaps] VITE_KAKAO_JS_KEY가 설정되지 않았습니다.')
      resolve(null)
      return
    }

    const libraries = ['services', ...(options?.libraries ?? [])]
    const script = document.createElement('script')
    script.src = buildScriptSrc(appKey, libraries)
    script.async = true
    script.onload = () => {
      if (!window.kakao?.maps) {
        console.error('[kakaoMaps] Kakao Maps SDK가 정상적으로 로드되지 않았습니다.')
        resolve(null)
        return
      }
      window.kakao.maps.load(() => resolve(window.kakao ?? null))
    }
    script.onerror = (event) => {
      console.error('[kakaoMaps] Kakao Maps SDK 로드 중 오류가 발생했습니다.', event)
      resolve(null)
    }
    document.head.appendChild(script)
  })

  return loaderPromise
}

export type { KakaoNamespace }

