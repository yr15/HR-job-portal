import { apiClient } from "./client";
import type { DashboardStats } from "../types";

export const getDashboardStats = () =>
  apiClient.get<DashboardStats>("/hr/dashboard/stats").then((res) => res.data);
