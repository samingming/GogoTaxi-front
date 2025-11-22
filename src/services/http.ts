import axios from "axios"

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  import.meta.env.VITE_API_URL?.replace(/\/$/, "")

export const apiClient = axios.create({
  baseURL: apiBaseUrl || undefined,
  headers: {
    "Content-Type": "application/json",
  },
})

// Alias to match existing imports (e.g., apiAuth.ts)
export const http = apiClient
export default apiClient
