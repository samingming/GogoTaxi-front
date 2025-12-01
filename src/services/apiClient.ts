import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
})

apiClient.interceptors.request.use(config => {
  const token =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('gogotaxi_token') ||
    localStorage.getItem('auth_token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const SETTLEMENT_PATH_PATTERN = /\/api\/settlements\/rooms\/[^/]+\/(hold|finalize)(\?|$)/i

const maybeRefreshNotifications = (url?: string, method?: string) => {
  if (!url || method?.toUpperCase() !== 'POST') return
  if (!SETTLEMENT_PATH_PATTERN.test(url)) return
  import('@/stores/notificationStore')
    .then(module => module.fetchNotificationFeed?.())
    .catch(error => {
      console.warn('알림을 새로고침하지 못했습니다.', error)
    })
}

apiClient.interceptors.response.use(
  response => {
    maybeRefreshNotifications(response.config?.url, response.config?.method)
    return response
  },
  error => {
    maybeRefreshNotifications(error.config?.url, error.config?.method)
    return Promise.reject(error)
  },
)

export default apiClient
