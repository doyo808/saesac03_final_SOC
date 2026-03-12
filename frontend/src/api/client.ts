import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";

interface AuthTokenResponse {
  accessToken: string;
}

let accessToken: string | null = null;

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");

function buildApiUrl(path: string) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

export const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  withCredentials: true,
});

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

function shouldSkipRefresh(config?: InternalAxiosRequestConfig) {
  if (!config?.url) {
    return true;
  }
  return (
    config.url.includes("/api/auth/login") ||
    config.url.includes("/api/auth/register") ||
    config.url.includes("/api/auth/refresh") ||
    config.url.includes("/api/auth/logout")
  );
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    config.headers = headers;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !shouldSkipRefresh(original)
    ) {
      original._retry = true;
      try {
        const response = await axios.post<AuthTokenResponse>(
          buildApiUrl("/api/auth/refresh"),
          {},
          { withCredentials: true },
        );
        setAccessToken(response.data.accessToken);

        const headers = AxiosHeaders.from(original.headers);
        headers.set("Authorization", `Bearer ${response.data.accessToken}`);
        original.headers = headers;
        return api(original);
      } catch (refreshError) {
        clearAccessToken();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
