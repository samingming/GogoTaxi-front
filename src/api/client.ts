// axios 클라이언트
import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // http://34.207.148.130:8080
});

// 모든 요청에 토큰 자동으로 실어 보내기
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("gogotaxi_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});