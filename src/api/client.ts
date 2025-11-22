// axios 클라이언트 정의
import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  import.meta.env.VITE_API_URL?.replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL,
});

// 모든 요청에 토큰 자동 첨부
apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("gogotaxi_access_token") ||
    localStorage.getItem("gogotaxi_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
