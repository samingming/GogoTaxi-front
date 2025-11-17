// /api/me 호출용
import { apiClient } from "./client";

export async function fetchMe() {
  const res = await apiClient.get("/api/me");
  return res.data; // { me: {...} }
}