import { http } from './http'

export type SignupPayload = {
  loginId: string
  password: string
  name: string
  gender: 'M' | 'F'
  phone: string
  birthDate: string
  smsConsent: boolean
  termsConsent: boolean
}

export type LoginPayload = {
  loginId: string
  password: string
}

const isBrowser = typeof window !== 'undefined'
export const isAuthApiConfigured = Boolean(import.meta.env.VITE_API_URL)

function ensureConfigured() {
  if (!isAuthApiConfigured) {
    throw new Error('VITE_API_URL이 설정되어 있지 않습니다.')
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
  const { data } = await http.post('/auth/signup', payload)
  return data
}

export async function loginWithApi(payload: LoginPayload) {
  ensureConfigured()
  const { data } = await http.post('/auth/login', payload)
  persistToken(data)
  return data
}
