import { http } from './http'

export type SignupPayload = {
  loginId: string
  password: string
  name: string
  gender?: 'M' | 'F'
  phone?: string
  birthDate?: string
  smsConsent?: boolean
  termsConsent?: boolean
}

export type LoginPayload = {
  loginId: string
  password: string
}

const isBrowser = typeof window !== 'undefined'
const apiBase = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL
export const isAuthApiConfigured = Boolean(apiBase)

function ensureConfigured() {
  if (!isAuthApiConfigured) {
    throw new Error('API Base URL env(VITE_API_BASE_URL 또는 VITE_API_URL)가 설정되어 있지 않습니다.')
  }
}

function persistToken(data: unknown) {
  if (!isBrowser) return
  const payload = data as Record<string, unknown>
  const toStr = (v: unknown) => (typeof v === 'string' ? v : undefined)
  const accessToken =
    toStr(payload?.accessToken) ??
    toStr(payload?.token) ??
    toStr((payload?.data as Record<string, unknown>)?.accessToken) ??
    toStr((payload?.data as Record<string, unknown>)?.token)
  const refreshToken =
    toStr(payload?.refreshToken) ??
    toStr((payload?.data as Record<string, unknown>)?.refreshToken)
  if (accessToken) window.localStorage.setItem('auth_token', accessToken)
  if (refreshToken) window.localStorage.setItem('auth_refresh_token', refreshToken)
}

export async function signupWithApi(payload: SignupPayload) {
  ensureConfigured()
  // Backend expects loginId/password/name/etc.
  const body = {
    loginId: payload.loginId,
    password: payload.password,
    name: payload.name || payload.loginId,
    gender: payload.gender,
    phone: payload.phone,
    birthDate: payload.birthDate,
    smsConsent: payload.smsConsent,
    termsConsent: payload.termsConsent,
  }
  const { data } = await http.post('/api/auth/signup', body)
  return data
}

export async function loginWithApi(payload: LoginPayload) {
  ensureConfigured()
  // Backend expects loginId/password.
  const body = { loginId: payload.loginId, password: payload.password }
  // Backend routes are namespaced under /api, so include the prefix to avoid 404.
  const { data } = await http.post('/api/auth/login', body)
  persistToken(data)
  return data
}

export async function checkLoginIdAvailability(loginId: string) {
  ensureConfigured()
  const { data } = await http.get<{ available: boolean; loginId: string }>('/api/auth/check-id', {
    params: { loginId },
  })
  return data
}
