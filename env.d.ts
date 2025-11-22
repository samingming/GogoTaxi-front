/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // {} 대신 object, any 대신 unknown 사용
  const component: DefineComponent<object, object, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_KAKAO_JS_KEY?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_API_URL?: string
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface Window {
    kakao?: any
  }
}

export {}
