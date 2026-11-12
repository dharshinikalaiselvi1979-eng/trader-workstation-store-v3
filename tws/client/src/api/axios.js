import axios from "axios";

const STORAGE_KEY = "tws_user";

// In development Vite proxies /api → Express :3000; in production use same origin.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true, // send/receive HTTP-only cookies automatically
});

// Attach Bearer token from localStorage (fallback when cookie isn't set)
api.interceptors.request.use((config) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.token) config.headers.Authorization = `Bearer ${stored.token}`;
  } catch {
    /* ignore */
  }
  return config;
});

// Auto-redirect on 401 (session expired / cookie cleared)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthCall = url.includes("/auth/google") || url.includes("/auth/me");
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem(STORAGE_KEY);
      if (window.location.pathname !== "/login") window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export const errMsg = (err) =>
  err.response?.data?.message ||
  (err.request && !err.response
    ? "Can't reach the server. Is it running?"
    : err.message);

export default api;

