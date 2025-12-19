import axios from 'axios';

type Nullable<T> = T | null;

const ACCESS_KEYS = ['gogotaxi_access_token', 'gogotaxi_token', 'auth_token'];
const REFRESH_KEYS = ['gogotaxi_refresh_token', 'auth_refresh_token'];

const getAccessToken = (): Nullable<string> => {
  if (typeof window === 'undefined') return null;
  for (const key of ACCESS_KEYS) {
    const val = window.localStorage.getItem(key);
    if (val) return val;
  }
  return null;
};

const getRefreshToken = (): Nullable<string> => {
  if (typeof window === 'undefined') return null;
  for (const key of REFRESH_KEYS) {
    const val = window.localStorage.getItem(key);
    if (val) return val;
  }
  return null;
};

const persistTokens = (accessToken?: string | null, refreshToken?: string | null) => {
  if (typeof window === 'undefined') return;
  if (accessToken) {
    window.localStorage.setItem('gogotaxi_access_token', accessToken);
    window.localStorage.setItem('gogotaxi_token', accessToken);
    window.localStorage.setItem('auth_token', accessToken);
  }
  if (refreshToken) {
    window.localStorage.setItem('gogotaxi_refresh_token', refreshToken);
    window.localStorage.setItem('auth_refresh_token', refreshToken);
  }
};

const clearTokens = () => {
  if (typeof window === 'undefined') return;
  [...ACCESS_KEYS, ...REFRESH_KEYS].forEach((key) => window.localStorage.removeItem(key));
};

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const refreshUrl = '/api/auth/refresh';
  refreshPromise = axios
    .post(
      refreshUrl,
      { refreshToken },
      { baseURL: import.meta.env.VITE_API_BASE_URL || '', withCredentials: true }
    )
    .then((res) => {
      const access = (res.data?.accessToken as string) ?? (res.data?.token as string) ?? null;
      const nextRefresh = (res.data?.refreshToken as string) ?? refreshToken;
      persistTokens(access, nextRefresh);
      return access;
    })
    .catch(() => {
      clearTokens();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

const rawBaseUrl =
  (import.meta.env.VITE_API_BASE_URL?.trim() ?? '') ||
  (import.meta.env.VITE_API_URL?.trim() ?? '')

let normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, '')
if (/\/api$/i.test(normalizedBaseUrl)) {
  normalizedBaseUrl = normalizedBaseUrl.replace(/\/api$/i, '')
}
if (/\/api\/?$/i.test(rawBaseUrl) && !normalizedBaseUrl) {
  normalizedBaseUrl = rawBaseUrl
}

const apiClient = axios.create({
  baseURL: normalizedBaseUrl || '',
  withCredentials: true,
})

apiClient.interceptors.request.use(config => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const original: any = error?.config || {};

    const isAuthRefresh = typeof original?.url === 'string' && original.url.includes('/auth/refresh');
    if (status !== 401 || original._retry || isAuthRefresh) {
      return Promise.reject(error);
    }

    original._retry = true;
    const nextAccess = await refreshAccessToken();
    if (!nextAccess) {
      return Promise.reject(error);
    }

    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${nextAccess}`;
    return apiClient(original);
  }
);

const SETTLEMENT_PATH_PATTERN = /\/api\/settlements\/rooms\/[^/]+\/(hold|finalize)(\?|$)/i
const RECEIPT_SETTLEMENT_PATH_PATTERN = /\/api\/receipts\/analyze(\?|$)/i

const maybeRefreshNotifications = (url?: string, method?: string) => {
  if (!url || method?.toUpperCase() !== 'POST') return
  if (!SETTLEMENT_PATH_PATTERN.test(url)) return
  import('@/stores/notificationStore')
    .then(module => module.fetchNotificationFeed?.())
    .catch(error => {
      console.warn('알림을 새로고침하지 못했습니다.', error)
    })
}

const maybeRefreshWallet = (url?: string, method?: string) => {
  if (!url || method?.toUpperCase() !== 'POST') return
  if (!SETTLEMENT_PATH_PATTERN.test(url) && !RECEIPT_SETTLEMENT_PATH_PATTERN.test(url)) return
  import('@/stores/userStore')
    .then(module => module.refreshUserBalance?.())
    .catch(error => {
      console.warn('꼬꼬페이 잔액을 새로고침하지 못했습니다.', error)
    })
}

apiClient.interceptors.response.use(
  response => {
    maybeRefreshNotifications(response.config?.url, response.config?.method)
    maybeRefreshWallet(response.config?.url, response.config?.method)
    return response
  },
  error => {
    maybeRefreshNotifications(error.config?.url, error.config?.method)
    maybeRefreshWallet(error.config?.url, error.config?.method)
    return Promise.reject(error)
  },
)

export default apiClient
