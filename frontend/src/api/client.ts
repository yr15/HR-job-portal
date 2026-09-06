import axios from "axios";
import type { ApiErrorBody } from "../types";

export const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const TOKEN_STORAGE_KEY = "hirehub_token";

export const apiClient = axios.create({
  baseURL: `${apiBaseUrl}/api/v1`,
  // FastAPI expects repeated keys for array query params (?skills=A&skills=B),
  // not axios's default bracket notation (?skills[]=A&skills[]=B), which it silently ignores.
  paramsSerializer: { indexes: null },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;
    if (body?.error?.fields) {
      const firstField = Object.values(body.error.fields)[0];
      if (firstField?.[0]) return firstField[0];
    }
    if (body?.error?.message) return body.error.message;
  }
  return fallback;
}
