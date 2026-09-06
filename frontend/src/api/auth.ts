import { apiClient } from "./client";
import type { User, UserRole } from "../types";

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  company_name?: string;
  designation?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const register = (payload: RegisterPayload) =>
  apiClient.post<User>("/auth/register", payload).then((res) => res.data);

export const login = (payload: LoginPayload) =>
  apiClient.post<TokenResponse>("/auth/login", payload).then((res) => res.data);

export const getMe = () => apiClient.get<User>("/auth/me").then((res) => res.data);
