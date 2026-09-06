import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getMyJobs, setJobStatus } from "../../api/jobs";
import { getErrorMessage } from "../../api/client";
import { Spinner } from "../../components/Spinner";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { Pagination } from "../../components/Pagination";
import { ActiveBadge } from "../../components/StatusBadge";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import type { Job } from "../../types";

export function MyJobsPage() {
  const location = useLocation();
  const flashMessage = (location.state as { message?: string } | null)?.message;

  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobPendingToggle, setJobPendingToggle] = useState<Job | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const pageSize = 10;

  const load = () => {
    setIsLoading(true);
    setError(null);
    getMyJobs(page, pageSize)
      .then((data) => {
        setJobs(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(getErrorMessage(err, "Could not load your jobs.")))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [page]);

  const confirmToggle = async () => {
    if (!jobPendingToggle) return;
    setIsToggling(true);
    try {
      await setJobStatus(jobPendingToggle.id, !jobPendingToggle.is_active);
      setJobPendingToggle(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Could not update this job."));
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">My Jobs</h1>
        <Link
          to="/hr/jobs/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Post a Job
        </Link>
      </div>

      {flashMessage && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {flashMessage}
        </div>
      )}

      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : error ? (
          <ErrorBanner message={error} />
        ) : jobs.length === 0 ? (
          <EmptyState title="You haven't posted any jobs yet" description="Get started by posting your first job." />
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Job</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{job.title}</p>
                      <p className="text-sm text-slate-500">
                        {job.location} &middot; {job.employment_type.replace("_", " ")}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <ActiveBadge isActive={job.is_active} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3 text-sm">
                        <Link
                          to={`/hr/jobs/${job.id}/applicants`}
                          className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          Applicants
                        </Link>
                        <Link to={`/hr/jobs/${job.id}/edit`} className="font-medium text-slate-600 hover:text-slate-900">
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setJobPendingToggle(job)}
                          className="font-medium text-red-600 hover:text-red-500"
                        >
                          {job.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={jobPendingToggle !== null}
        title={jobPendingToggle?.is_active ? "Deactivate this job?" : "Activate this job?"}
        description={
          jobPendingToggle?.is_active
            ? "Candidates will no longer be able to find or apply to this job."
            : "This job will become visible to candidates again."
        }
        confirmLabel={jobPendingToggle?.is_active ? "Deactivate" : "Activate"}
        onConfirm={confirmToggle}
        onCancel={() => setJobPendingToggle(null)}
        isBusy={isToggling}
      />
    </div>
  );
}
