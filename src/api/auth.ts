// 로그인 API
import { apiClient } from "./client";

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    nickname: string;
    createdAt: string;
  };
  token: string;
}

export async function login(email: string, password: string) {
  const res = await apiClient.post<LoginResponse>("/api/auth/login", {
    email,
    password,
  });
  return res.data;
}

export interface SignUpPayload {
  email: string;
  password: string;
  nickname: string;
}

export async function signUp(payload: SignUpPayload) {
  const res = await apiClient.post<LoginResponse>("/api/auth/signup", payload);
  return res.data;
}