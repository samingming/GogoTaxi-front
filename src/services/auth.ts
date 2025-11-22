// src/services/auth.ts

export type User = {
  id: string
  name: string
  password: string
  phone: string
  birthDate: string
  gender: 'M' | 'F' | ''
  sms: boolean
  terms: boolean
}

export type AuthProfile = Pick<User, 'id' | 'name'>

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const USERS_KEY = 'gtx_users'
const TOKEN_KEY = 'auth_token'
const CURRENT_KEY = 'auth_user'
const PENDING_SOCIAL_KEY = 'gtx_pending_social'

const memoryStorage: StorageLike = (() => {
  const store = new Map<string, string>()
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
    removeItem(key: string) {
      store.delete(key)
    },
  }
})()

function getStorage(): StorageLike {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  return memoryStorage
}

// 초기 목업 데이터는 한 번만 채워 둡니다.
;(function seedMockUsers() {
  const storage = getStorage()
  if (storage.getItem(USERS_KEY)) return

  const mock: User[] = [
    {
      id: 'test1',
      name: '홍길동',
      password: '1111',
      phone: '01000000000',
      birthDate: '1990-01-01',
      gender: 'M',
      sms: false,
      terms: true,
    },
    {
      id: 'kim',
      name: '김철수',
      password: '1234',
      phone: '01012345678',
      birthDate: '1995-05-12',
      gender: 'F',
      sms: true,
      terms: true,
    },
  ]
  storage.setItem(USERS_KEY, JSON.stringify(mock))
})()

function loadUsers(): User[] {
  const storage = getStorage()
  try {
    return JSON.parse(storage.getItem(USERS_KEY) || '[]') as User[]
  } catch {
    return []
  }
}

function saveUsers(users: User[]) {
  const storage = getStorage()
  storage.setItem(USERS_KEY, JSON.stringify(users))
}

function storePendingSocial(pending: PendingSocial) {
  const storage = getStorage()
  storage.setItem(PENDING_SOCIAL_KEY, JSON.stringify(pending))
}

function clearPendingSocialInternal() {
  const storage = getStorage()
  storage.removeItem(PENDING_SOCIAL_KEY)
}

export function findUserById(id: string) {
  return loadUsers().find(user => user.id === id)
}

export function findUserByName(name: string) {
  return loadUsers().find(user => user.name === name)
}

export function registerUser(user: User) {
  const users = loadUsers()
  if (users.some(existing => existing.id === user.id)) {
    throw new Error('이미 사용 중인 아이디입니다.')
  }
  users.push(user)
  saveUsers(users)
}

export function login(id: string, password: string) {
  const user = findUserById(id)
  if (!user) throw new Error('존재하지 않는 아이디입니다.')
  if (user.password !== password) throw new Error('비밀번호가 일치하지 않습니다.')

  const token = `local-${Date.now()}`
  const storage = getStorage()
  storage.setItem(TOKEN_KEY, token)
  storage.setItem(CURRENT_KEY, JSON.stringify({ id: user.id, name: user.name }))
  clearPendingSocialInternal()
  return token
}

export function logout() {
  const storage = getStorage()
  storage.removeItem(TOKEN_KEY)
  storage.removeItem(CURRENT_KEY)
}

export function getCurrentUser(): AuthProfile | null {
  const storage = getStorage()
  const raw = storage.getItem(CURRENT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthProfile
  } catch {
    return null
  }
}

export function isAuthed() {
  const storage = getStorage()
  return Boolean(storage.getItem(TOKEN_KEY))
}

export function updateUserPassword(id: string, nextPassword: string): Pick<User, 'id' | 'name'> {
  const users = loadUsers()

  const target = users.find(u => u.id === id)
  if (!target) throw new Error('존재하지 않는 아이디입니다.')

  const updatedUsers = users.map(u => (u.id === id ? ({ ...u, password: nextPassword } as User) : u))

  saveUsers(updatedUsers)

  return { id: target.id, name: target.name }
}

export type SocialProvider = 'kakao' | 'google'
type SocialProfile = { id: string; name?: string }

type PendingSocial = {
  id: string
  provider: SocialProvider
  name?: string
  redirect?: string
}

export type SocialLoginResult =
  | { status: 'ok'; token: string }
  | { status: 'needs_terms'; pending: PendingSocial }

export function socialLogin(
  provider: SocialProvider,
  profile?: SocialProfile,
  options?: { redirect?: string }
): SocialLoginResult {
  if (!profile?.id) {
    throw new Error('소셜 로그인 정보가 올바르지 않습니다.')
  }

  const users = loadUsers()
  const index = users.findIndex(user => user.id === profile.id)
  let user: User

  if (index >= 0) {
    const existing = users[index]
    if (!existing) {
      throw new Error('알 수 없는 오류가 발생했습니다.')
    }
    user = existing
    if (!user.name && profile.name) {
      user = { ...user, name: profile.name }
      users[index] = user
      saveUsers(users)
    }
  } else {
    user = {
      id: profile.id,
      name: profile.name || `${provider} 사용자`,
      password: '',
      phone: '',
      birthDate: '',
      gender: '',
      sms: false,
      terms: false,
    }
    users.push(user)
    saveUsers(users)
  }

  if (!user.terms) {
    const pending: PendingSocial = {
      id: user.id,
      provider,
      name: user.name,
      redirect: options?.redirect,
    }
    storePendingSocial(pending)
    return { status: 'needs_terms', pending }
  }

  const token = `${provider}-${Date.now()}`
  const storage = getStorage()
  storage.setItem(TOKEN_KEY, token)
  storage.setItem(CURRENT_KEY, JSON.stringify({ id: user.id, name: user.name }))
  clearPendingSocialInternal()
  return { status: 'ok', token }
}

export function getPendingSocial(): PendingSocial | null {
  const storage = getStorage()
  const raw = storage.getItem(PENDING_SOCIAL_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PendingSocial
  } catch {
    return null
  }
}

export function clearPendingSocial() {
  clearPendingSocialInternal()
}

export function completeSocialOnboarding(params: {
  id: string
  provider: SocialProvider
  agreedTerms: boolean
  sms?: boolean
  name?: string
  gender?: User['gender']
  phone?: string
  birthDate?: string
}) {
  if (!params.agreedTerms) {
    throw new Error('약관 동의가 필요합니다.')
  }

  const users = loadUsers()

  const existing = users.find(u => u.id === params.id)
  if (!existing) {
    throw new Error('사용자 정보를 찾을 수 없습니다.')
  }

  const updated: User = {
    ...existing,
    name: params.name?.trim() || existing.name,
    sms: params.sms ?? existing.sms,
    gender: params.gender ?? existing.gender,
    phone: params.phone ?? existing.phone,
    birthDate: params.birthDate ?? existing.birthDate,
    terms: true,
  }

  const updatedUsers = users.map(user => (user.id === params.id ? updated : user))
  saveUsers(updatedUsers)

  const storage = getStorage()
  const token = `${params.provider}-${Date.now()}`
  storage.setItem(TOKEN_KEY, token)
  storage.setItem(CURRENT_KEY, JSON.stringify({ id: updated.id, name: updated.name }))
  clearPendingSocialInternal()
  return token
}
