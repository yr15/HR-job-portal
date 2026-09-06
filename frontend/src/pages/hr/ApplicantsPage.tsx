import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getJob, getJobApplicants } from "../../api/jobs";
import { updateApplicationStatus } from "../../api/applications";
import { getErrorMessage } from "../../api/client";
import { Spinner } from "../../components/Spinner";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { Pagination } from "../../components/Pagination";
import { StatusBadge } from "../../components/StatusBadge";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { inputClass } from "../../components/FormField";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { Application, ApplicationStatus, Job } from "../../types";

const STATUS_OPTIONS: ApplicationStatus[] = ["APPLIED", "SHORTLISTED", "REJECTED"];

export function ApplicantsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingRejection, setPendingRejection] = useState<Application | null>(null);
  const pageSize = 10;
  const debouncedQ = useDebouncedValue(q);

  useEffect(() => {
    if (!jobId) return;
    getJob(jobId).then(setJob).catch(() => undefined);
  }, [jobId]);

  const load = () => {
    if (!jobId) return;
    setIsLoading(true);
    setError(null);
    getJobApplicants(jobId, { q: debouncedQ || undefined, status: status || undefined, page, page_size: pageSize })
      .then((data) => {
        setApplicants(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(getErrorMessage(err, "Could not load applicants.")))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [jobId, debouncedQ, status, page]);

  const handleStatusChange = async (applicationId: string, newStatus: "SHORTLISTED" | "REJECTED") => {
    setUpdatingId(applicationId);
    try {
      await updateApplicationStatus(applicationId, newStatus);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Could not update this application."));
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmRejection = async () => {
    if (!pendingRejection) return;
    await handleStatusChange(pendingRejection.id, "REJECTED");
    setPendingRejection(null);
  };

  return (
    <div>
      <Link to="/hr/jobs" className="text-sm text-indigo-600 hover:text-indigo-500">
        &larr; Back to my jobs
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          Applicants{job ? ` — ${job.title}` : ""}
        </h1>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          className={inputClass}
          placeholder="Search by name or skill"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <select
          className={`${inputClass} sm:w-48`}
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
        ) : applicants.length === 0 ? (
          <EmptyState title="No applicants match this view" description="Try clearing your filters." />
        ) : (
          <div className="space-y-3">
            {applicants.map((application) => (
              <div key={application.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      to={`/hr/candidates/${application.candidate.id}`}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      {application.candidate.full_name}
                    </Link>
                    <p className="text-sm text-slate-500">
                      {application.candidate.candidate_profile?.headline ?? "No headline"}
                      {application.candidate.candidate_profile?.total_experience_years != null &&
                        ` · ${application.candidate.candidate_profile.total_experience_years} yrs`}
                      {application.candidate.candidate_profile?.location &&
                        ` · ${application.candidate.candidate_profile.location}`}
                    </p>
                    {application.candidate.candidate_profile && application.candidate.candidate_profile.skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {application.candidate.candidate_profile.skills.slice(0, 6).map((skill) => (
                          <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    {application.cover_note && (
                      <p className="mt-2 text-sm italic text-slate-500">&ldquo;{application.cover_note}&rdquo;</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={application.status} />
                    <span className="text-xs text-slate-400">
                      {new Date(application.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                  {application.status !== "SHORTLISTED" && (
                    <button
                      type="button"
                      disabled={updatingId === application.id}
                      onClick={() => handleStatusChange(application.id, "SHORTLISTED")}
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                    >
                      {application.status === "REJECTED" ? "Reconsider — Shortlist" : "Shortlist"}
                    </button>
                  )}
                  {application.status !== "REJECTED" && (
                    <button
                      type="button"
                      disabled={updatingId === application.id}
                      onClick={() => setPendingRejection(application)}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingRejection !== null}
        title="Reject this application?"
        description={`${pendingRejection?.candidate.full_name} will be marked as rejected. You can still reconsider them later.`}
        confirmLabel="Reject"
        onConfirm={confirmRejection}
        onCancel={() => setPendingRejection(null)}
        isBusy={updatingId === pendingRejection?.id}
      />
    </div>
  );
}
