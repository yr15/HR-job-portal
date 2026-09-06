import { apiClient } from "./client";
import type { Application, ApplicationStatus, Page } from "../types";

export const getMyApplications = (status?: ApplicationStatus, page = 1, pageSize = 10) =>
  apiClient
    .get<Page<Application>>("/applications/me", { params: { status, page, page_size: pageSize } })
    .then((res) => res.data);

export const getApplication = (applicationId: string) =>
  apiClient.get<Application>(`/applications/${applicationId}`).then((res) => res.data);

export const updateApplicationStatus = (applicationId: string, status: "SHORTLISTED" | "REJECTED") =>
  apiClient
    .patch<Application>(`/applications/${applicationId}/status`, { status })
    .then((res) => res.data);
