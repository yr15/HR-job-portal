import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyApplications } from "../../api/applications";
import { searchJobs } from "../../api/jobs";
import { getErrorMessage } from "../../api/client";
import { Spinner } from "../../components/Spinner";
import { ErrorBanner } from "../../components/ErrorBanner";
import { EmptyState } from "../../components/EmptyState";
import type { ApplicationStatus, Job } from "../../types";

interface Counts {
  APPLIED: number;
  SHORTLISTED: number;
  REJECTED: number;
}

const STAT_CARDS: { key: keyof Counts; label: string; accent: string }[] = [
  { key: "APPLIED", label: "Applied", accent: "text-blue-600" },
  { key: "SHORTLISTED", label: "Shortlisted", accent: "text-emerald-600" },
  { key: "REJECTED", label: "Rejected", accent: "text-red-600" },
];

export function CandidateDashboardPage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    Promise.all([getMyApplications(undefined, 1, 100), searchJobs({ page: 1, page_size: 5 })])
      .then(([applications, jobs]) => {
        const tally: Counts = { APPLIED: 0, SHORTLISTED: 0, REJECTED: 0 };
        applications.items.forEach((application) => {
          tally[application.status as ApplicationStatus] += 1;
        });
        setCounts(tally);
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
          <div className="mt-6 grid grid-cols-3 gap-4">
            {STAT_CARDS.map((card) => (
              <div key={card.key} className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className={`text-2xl font-bold ${card.accent}`}>{counts?.[card.key] ?? 0}</p>
                <p className="mt-1 text-sm text-slate-500">{card.label}</p>
              </div>
            ))}
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
