import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDashboardStats } from "../../api/dashboard";
import { getErrorMessage } from "../../api/client";
import { Spinner } from "../../components/Spinner";
import { ErrorBanner } from "../../components/ErrorBanner";
import { StatusBreakdownChart } from "../../components/charts/StatusBreakdownChart";
import { TrendLineChart } from "../../components/charts/TrendLineChart";
import type { DashboardStats } from "../../types";

const STAT_CARDS: { key: keyof DashboardStats; label: string; accent: string }[] = [
  { key: "total_jobs", label: "Total Jobs", accent: "text-slate-900" },
  { key: "active_jobs", label: "Active Jobs", accent: "text-emerald-600" },
  { key: "total_applications", label: "Total Applications", accent: "text-slate-900" },
];

export function HRDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(getErrorMessage(err, "Could not load your dashboard.")))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Welcome back, {user?.full_name?.split(" ")[0]}</h1>
          <p className="text-sm text-slate-500">{user?.hr_profile?.company_name}</p>
        </div>
        <Link
          to="/hr/jobs/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Post a Job
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <ErrorBanner message={error} />
      ) : (
        stats && (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {STAT_CARDS.map((card) => (
                <div key={card.key} className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
                  <p className={`text-2xl font-bold ${card.accent}`}>{stats[card.key] as number}</p>
                  <p className="mt-1 text-sm text-slate-500">{card.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-medium text-slate-700">Applications by status</h2>
                <div className="mt-4">
                  <StatusBreakdownChart
                    data={[
                      { label: "Applied", value: stats.applied_count, colorRole: "neutral" },
                      { label: "Shortlisted", value: stats.shortlisted_count, colorRole: "good" },
                      { label: "Rejected", value: stats.rejected_count, colorRole: "critical" },
                    ]}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-medium text-slate-700">Applications received — last 14 days</h2>
                <div className="mt-4">
                  <TrendLineChart data={stats.applications_by_day} />
                </div>
              </div>
            </div>
          </>
        )
      )}

      <div className="mt-8 flex gap-4">
        <Link to="/hr/jobs" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Manage my jobs &rarr;
        </Link>
        <Link to="/hr/candidates" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Browse candidates &rarr;
        </Link>
      </div>
    </div>
  );
}
