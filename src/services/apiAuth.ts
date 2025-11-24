import { http } from './http'

export type SignupPayload = {
  email: string
  password: string
  nickname: string
}

export type LoginPayload = {
  email: string
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
  const tokenCandidate =
    (payload?.token as string | undefined) ??
    (payload?.accessToken as string | undefined) ??
    ((payload?.data as Record<string, unknown>)?.token as string | undefined) ??
    ((payload?.data as Record<string, unknown>)?.accessToken as string | undefined)

  if (typeof tokenCandidate === 'string') {
    window.localStorage.setItem('auth_token', tokenCandidate)
  }
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
