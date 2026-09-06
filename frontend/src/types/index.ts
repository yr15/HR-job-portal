export type UserRole = "HR" | "CANDIDATE";

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";

export type ApplicationStatus = "APPLIED" | "SHORTLISTED" | "REJECTED";

export interface CandidateProfile {
  phone: string | null;
  headline: string | null;
  total_experience_years: number | null;
  skills: string[];
  location: string | null;
  resume_filename: string | null;
}

export interface HRProfile {
  company_name: string;
  designation: string | null;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  candidate_profile: CandidateProfile | null;
  hr_profile: HRProfile | null;
}

export interface Job {
  id: string;
  hr_id: string;
  title: string;
  description: string;
  skills: string[];
  location: string;
  employment_type: EmploymentType;
  min_experience_years: number;
  max_experience_years: number | null;
  salary_min: number | null;
  salary_max: number | null;
  company_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  status: ApplicationStatus;
  cover_note: string | null;
  applied_at: string;
  updated_at: string;
  job: Job;
  candidate: User;
}

export interface CandidateListItem {
  id: string;
  full_name: string;
  headline: string | null;
  total_experience_years: number | null;
  skills: string[];
  location: string | null;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface DashboardStats {
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
  applied_count: number;
  shortlisted_count: number;
  rejected_count: number;
}

export interface CandidateStats {
  total_applications: number;
  applied_count: number;
  shortlisted_count: number;
  rejected_count: number;
}

export interface Message {
  id: string;
  subject: string;
  body: string;
  sent_at: string;
  read_at: string | null;
  sender_name: string;
  sender_company: string | null;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}
