import { apiClient } from './client'

export interface LoginResponse {
  user: {
    id: string
    loginId: string
    name: string | null
    email: string | null
    phone: string | null
    gender: string | null
    birthDate: string | null
    createdAt: string
  }
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string | null
  refreshTokenExpiresAt: string | null
}

export async function login(loginId: string, password: string) {
  const res = await apiClient.post<LoginResponse>('/api/auth/login', {
    loginId,
    password,
  })
  return res.data
}

export interface SignUpPayload {
  loginId: string
  password: string
  name: string
  gender: 'M' | 'F'
  phone: string
  birthDate: string
  smsConsent: boolean
  termsConsent: boolean
}

export async function signUp(payload: SignUpPayload) {
  const res = await apiClient.post<LoginResponse>('/api/auth/signup', payload)
  return res.data
}

export async function fetchMe() {
  const res = await apiClient.get<{ me: LoginResponse['user'] }>('/api/me')
  return res.data.me
}

export type UpdateProfilePayload = Partial<Pick<SignUpPayload, 'name' | 'phone' | 'gender' | 'birthDate'>>

export async function updateProfile(payload: UpdateProfilePayload) {
  const res = await apiClient.patch<{ me: LoginResponse['user'] }>('/api/me', payload)
  return res.data.me
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export async function changePassword(payload: ChangePasswordPayload) {
  const res = await apiClient.patch<{ success: boolean }>('/api/me/password', payload)
  return res.data
}

export type SocialProvider = 'kakao' | 'google'

export interface SocialLoginRequest {
  provider: SocialProvider
  code?: string
  accessToken?: string
  profile?: { id: string; name?: string }
  redirectUri?: string
}

export type SocialLoginResponse =
  | ({ status: 'ok' } & LoginResponse)
  | {
      status: 'needs_consent'
      provider: SocialProvider
      pendingToken: string
      profileName?: string | null
    }

export async function socialLogin(payload: SocialLoginRequest) {
  const res = await apiClient.post<SocialLoginResponse>('/api/auth/social/login', payload)
  return res.data
}

export interface SocialConsentPayload {
  pendingToken: string
  termsConsent: boolean
  smsConsent?: boolean
  name?: string
  gender?: 'M' | 'F'
  phone?: string
  birthDate?: string
}

export async function completeSocialConsent(payload: SocialConsentPayload) {
  const res = await apiClient.post<LoginResponse>('/api/auth/social/consent', payload)
  return res.data
}
