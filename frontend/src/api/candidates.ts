import { apiClient } from "./client";
import type { CandidateListItem, Page, User } from "../types";

export interface CandidateProfileUpdatePayload {
  phone?: string | null;
  headline?: string | null;
  total_experience_years?: number | null;
  skills?: string[];
  location?: string | null;
  resume_url?: string | null;
}

export const getMyProfile = () => apiClient.get<User>("/candidates/me").then((res) => res.data);

export const updateMyProfile = (payload: CandidateProfileUpdatePayload) =>
  apiClient.patch<User>("/candidates/me", payload).then((res) => res.data);

export interface CandidateDirectoryParams {
  q?: string;
  skills?: string[];
  location?: string;
  min_experience?: number;
  max_experience?: number;
  page?: number;
  page_size?: number;
}

export const searchCandidates = (params: CandidateDirectoryParams) =>
  apiClient.get<Page<CandidateListItem>>("/candidates", { params }).then((res) => res.data);

export const getCandidate = (candidateId: string) =>
  apiClient.get<User>(`/candidates/${candidateId}`).then((res) => res.data);
