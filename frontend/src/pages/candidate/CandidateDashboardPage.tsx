import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCandidateStats } from "../../api/dashboard";
import { searchJobs } from "../../api/jobs";
import { getErrorMessage } from "../../api/client";
import { Spinner } from "../../components/Spinner";
import { ErrorBanner } from "../../components/ErrorBanner";
import { EmptyState } from "../../components/EmptyState";
import { StatusBreakdownChart } from "../../components/charts/StatusBreakdownChart";
import type { CandidateStats, Job } from "../../types";

export function CandidateDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CandidateStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    Promise.all([getCandidateStats(), searchJobs({ page: 1, page_size: 5 })])
      .then(([candidateStats, jobs]) => {
        setStats(candidateStats);
        setRecentJobs(jobs.items);
      })
      .catch((err) => setError(getErrorMessage(err, "Could not load your dashboard.")))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Welcome back, {user?.full_name?.split(" ")[0]}</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <ErrorBanner message={error} />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-slate-900">{stats?.total_applications ?? 0}</p>
              <p className="mt-1 text-sm text-slate-500">Total Applications</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-medium text-slate-700">Applications by status</h2>
              <div className="mt-2">
                <StatusBreakdownChart
                  data={[
                    { label: "Applied", value: stats?.applied_count ?? 0, colorRole: "neutral" },
                    { label: "Shortlisted", value: stats?.shortlisted_count ?? 0, colorRole: "good" },
                    { label: "Rejected", value: stats?.rejected_count ?? 0, colorRole: "critical" },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Latest openings</h2>
              <Link to="/candidate/jobs" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Browse all jobs &rarr;
              </Link>
            </div>
            {recentJobs.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="No open jobs right now" description="Check back soon for new postings." />
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    to={`/candidate/jobs/${job.id}`}
                    className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300"
                  >
                    <h3 className="font-medium text-slate-900">{job.title}</h3>
                    <p className="text-sm text-slate-500">
                      {job.company_name} &middot; {job.location}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
