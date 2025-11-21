import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { refreshUserBalance } from '@/stores/userStore'

declare global {
  interface Window {
    __gogoTaxiViewportHandlerAdded__?: boolean
  }
}

function setViewportUnit() {
  if (typeof window === 'undefined') return
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--app-vh', `${vh}px`)
}

if (typeof window !== 'undefined' && !window.__gogoTaxiViewportHandlerAdded__) {
  window.__gogoTaxiViewportHandlerAdded__ = true
  setViewportUnit()
  window.addEventListener('resize', setViewportUnit)
  window.addEventListener('orientationchange', setViewportUnit)
}

const app = createApp(App)
app.use(router)        // router를 전역 등록

const bootstrap = async () => {
  if (typeof window !== 'undefined') {
    try {
      await refreshUserBalance()
    } catch (error) {
      console.warn('지갑 잔액을 불러오지 못했습니다.', error)
    }
  }
  app.mount('#app')
}

bootstrap()
