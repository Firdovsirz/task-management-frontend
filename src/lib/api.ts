import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';

export const TOKEN_COOKIE = 'fr_task_token';

const configured = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');

/**
 * With no NEXT_PUBLIC_API_URL the browser talks to this app's own /api routes,
 * which proxy to the Spring Boot API server-side (no CORS, API can stay private).
 */
export const api = axios.create({
  baseURL: configured ? `${configured}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_COOKIE);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login')
    ) {
      Cookies.remove(TOKEN_COOKIE);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

interface ApiErrorBody {
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export function apiError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const axiosError = error as AxiosError<ApiErrorBody>;
  const data = axiosError?.response?.data;
  if (data?.fieldErrors) {
    const first = Object.values(data.fieldErrors)[0];
    if (first) return first;
  }
  return data?.message || data?.error || axiosError?.message || fallback;
}
