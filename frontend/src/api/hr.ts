import { apiClient } from "./client";
import type { User } from "../types";

export interface HRProfileUpdatePayload {
  full_name?: string;
  company_name?: string;
  designation?: string | null;
}

export const getMyHRProfile = () => apiClient.get<User>("/hr/me").then((res) => res.data);

export const updateMyHRProfile = (payload: HRProfileUpdatePayload) =>
  apiClient.patch<User>("/hr/me", payload).then((res) => res.data);
