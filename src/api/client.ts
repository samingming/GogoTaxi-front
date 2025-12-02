// axios 클라이언트 정의
import axios from "axios";

const ACCESS_KEYS = ["gogotaxi_access_token", "gogotaxi_token", "auth_token"];
const REFRESH_KEYS = ["gogotaxi_refresh_token", "auth_refresh_token"];

const getAccessToken = () => {
  if (typeof window === "undefined") return null;
  for (const key of ACCESS_KEYS) {
    const val = window.localStorage.getItem(key);
    if (val) return val;
  }
  return null;
};

const getRefreshToken = () => {
  if (typeof window === "undefined") return null;
  for (const key of REFRESH_KEYS) {
    const val = window.localStorage.getItem(key);
    if (val) return val;
  }
  return null;
};

const persistTokens = (accessToken?: string | null, refreshToken?: string | null) => {
  if (typeof window === "undefined") return;
  if (accessToken) {
    window.localStorage.setItem("gogotaxi_access_token", accessToken);
    window.localStorage.setItem("gogotaxi_token", accessToken);
    window.localStorage.setItem("auth_token", accessToken);
  }
  if (refreshToken) {
    window.localStorage.setItem("gogotaxi_refresh_token", refreshToken);
    window.localStorage.setItem("auth_refresh_token", refreshToken);
  }
};

const clearTokens = () => {
  if (typeof window === "undefined") return;
  [...ACCESS_KEYS, ...REFRESH_KEYS].forEach((key) => window.localStorage.removeItem(key));
};

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const refreshUrl = "/api/auth/refresh";
  refreshPromise = axios
    .post(
      refreshUrl,
      { refreshToken },
      { baseURL, withCredentials: true }
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

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  import.meta.env.VITE_API_URL?.replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL,
});

// 모든 요청에 토큰 자동 첨부
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const original: any = error?.config || {};

    const isAuthRefresh = typeof original?.url === "string" && original.url.includes("/auth/refresh");
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
