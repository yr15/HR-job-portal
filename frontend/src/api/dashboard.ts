import { apiClient } from "./client";
import type { CandidateStats, DashboardStats } from "../types";

export const getDashboardStats = () =>
  apiClient.get<DashboardStats>("/hr/dashboard/stats").then((res) => res.data);

export const getCandidateStats = () =>
  apiClient.get<CandidateStats>("/candidates/me/stats").then((res) => res.data);
