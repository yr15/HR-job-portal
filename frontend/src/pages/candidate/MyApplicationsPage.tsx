import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyApplications } from "../../api/applications";
import { getErrorMessage } from "../../api/client";
import { Spinner } from "../../components/Spinner";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { Pagination } from "../../components/Pagination";
import { StatusBadge } from "../../components/StatusBadge";
import { inputClass } from "../../components/FormField";
import type { Application, ApplicationStatus } from "../../types";

const STATUS_OPTIONS: ApplicationStatus[] = ["APPLIED", "SHORTLISTED", "REJECTED"];

export function MyApplicationsPage() {
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [page, setPage] = useState(1);
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getMyApplications(status || undefined, page, pageSize)
      .then((data) => {
        setApplications(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(getErrorMessage(err, "Could not load your applications.")))
      .finally(() => setIsLoading(false));
  }, [status, page]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">My Applications</h1>
        <select
          className={`${inputClass} w-48`}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ApplicationStatus | "");
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : error ? (
          <ErrorBanner message={error} />
        ) : applications.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description="Jobs you apply to will show up here with their current status."
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Job
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Applied
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td className="px-4 py-3">
                      <Link
                        to={`/candidate/jobs/${application.job.id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        {application.job.title}
                      </Link>
                      <p className="text-sm text-slate-500">
                        {application.job.company_name} &middot; {application.job.location}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(application.applied_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={application.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
