import { apiClient } from "./client";
import type { Application, EmploymentType, Job, Page } from "../types";

export interface JobSearchParams {
  q?: string;
  skills?: string[];
  location?: string;
  employment_type?: EmploymentType;
  experience_years?: number;
  page?: number;
  page_size?: number;
}

export interface JobFormValues {
  title: string;
  description: string;
  skills: string[];
  location: string;
  employment_type: EmploymentType;
  min_experience_years: number;
  max_experience_years: number | null;
  salary_min: number | null;
  salary_max: number | null;
}

export const searchJobs = (params: JobSearchParams) =>
  apiClient.get<Page<Job>>("/jobs", { params }).then((res) => res.data);

export const getJob = (jobId: string) => apiClient.get<Job>(`/jobs/${jobId}`).then((res) => res.data);

export const createJob = (payload: JobFormValues) =>
  apiClient.post<Job>("/jobs", payload).then((res) => res.data);

export const updateJob = (jobId: string, payload: Partial<JobFormValues>) =>
  apiClient.patch<Job>(`/jobs/${jobId}`, payload).then((res) => res.data);

export const setJobStatus = (jobId: string, isActive: boolean) =>
  apiClient.patch<Job>(`/jobs/${jobId}/status`, { is_active: isActive }).then((res) => res.data);

export const getMyJobs = (page = 1, pageSize = 10) =>
  apiClient.get<Page<Job>>("/hr/jobs", { params: { page, page_size: pageSize } }).then((res) => res.data);

export const applyToJob = (jobId: string, coverNote?: string) =>
  apiClient
    .post<Application>(`/jobs/${jobId}/apply`, { cover_note: coverNote || undefined })
    .then((res) => res.data);

export interface ApplicantSearchParams {
  status?: string;
  q?: string;
  page?: number;
  page_size?: number;
}

export const getJobApplicants = (jobId: string, params: ApplicantSearchParams) =>
  apiClient.get<Page<Application>>(`/jobs/${jobId}/applications`, { params }).then((res) => res.data);
