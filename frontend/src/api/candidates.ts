import { apiClient } from "./client";
import type { CandidateListItem, Page, User } from "../types";

export interface CandidateProfileUpdatePayload {
  phone?: string | null;
  headline?: string | null;
  total_experience_years?: number | null;
  skills?: string[];
  location?: string | null;
}

export const getMyProfile = () => apiClient.get<User>("/candidates/me").then((res) => res.data);

export const updateMyProfile = (payload: CandidateProfileUpdatePayload) =>
  apiClient.patch<User>("/candidates/me", payload).then((res) => res.data);

export const uploadResume = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient
    .post<User>("/candidates/me/resume", formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((res) => res.data);
};

export const getResumeBlobUrl = (candidateId: string) =>
  apiClient
    .get(`/candidates/${candidateId}/resume`, { responseType: "blob" })
    .then((res) => URL.createObjectURL(res.data as Blob));

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
