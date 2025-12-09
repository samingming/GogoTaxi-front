/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // {} 대신 object, any 대신 unknown 사용
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare global {
  interface ImportMetaEnv {
    readonly VITE_KAKAO_JS_KEY?: string
    readonly VITE_GOOGLE_CLIENT_ID?: string
    readonly VITE_API_URL?: string
    readonly VITE_USE_MOCK_API?: string
    readonly VITE_API_BASE_URL?: string
    readonly VITE_SOCKET_URL?: string
    readonly VITE_UBER_CLIENT_ID?: string
    readonly VITE_MY_ROOMS_PATH?: string
    readonly VITE_ROOM_DETAIL_PATH?: string
    readonly VITE_ROOM_LEAVE_PATH?: string
    readonly VITE_ROOM_LEAVE_METHOD?: string
    readonly VITE_ROOM_JOIN_PATH?: string
    readonly VITE_ROOM_JOIN_METHOD?: string
    readonly VITE_WALLET_RECEIPT_OCR_PATH?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }

  interface Window {
    kakao?: unknown
  }
}

export {}
