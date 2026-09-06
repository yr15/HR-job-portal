import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { applyToJob, getJob } from "../../api/jobs";
import { getMyApplications } from "../../api/applications";
import { getErrorMessage } from "../../api/client";
import { Spinner } from "../../components/Spinner";
import { ErrorBanner } from "../../components/ErrorBanner";
import { ActiveBadge } from "../../components/StatusBadge";
import type { Job } from "../../types";

function formatSalary(job: Job): string | null {
  if (job.salary_min == null && job.salary_max == null) return null;
  if (job.salary_min != null && job.salary_max != null) {
    return `₹${job.salary_min.toLocaleString()} - ₹${job.salary_max.toLocaleString()} / year`;
  }
  const value = job.salary_min ?? job.salary_max;
  return `₹${value?.toLocaleString()} / year`;
}

export function JobDetailsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    setIsLoading(true);
    setError(null);
    Promise.all([getJob(jobId), getMyApplications(undefined, 1, 100)])
      .then(([jobData, applications]) => {
        setJob(jobData);
        setHasApplied(applications.items.some((application) => application.job.id === jobId));
      })
      .catch((err) => setError(getErrorMessage(err, "This job could not be found.")))
      .finally(() => setIsLoading(false));
  }, [jobId]);

  const handleApply = async () => {
    if (!jobId) return;
    setIsApplying(true);
    setApplyError(null);
    try {
      await applyToJob(jobId, coverNote);
      setHasApplied(true);
      setApplySuccess(true);
    } catch (err) {
      setApplyError(getErrorMessage(err, "Could not submit your application."));
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error || !job) {
    return <ErrorBanner message={error ?? "This job could not be found."} />;
  }

  const salary = formatSalary(job);

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/candidate/jobs" className="text-sm text-indigo-600 hover:text-indigo-500">
        &larr; Back to search
      </Link>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{job.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {job.company_name} &middot; {job.location}
            </p>
          </div>
          <ActiveBadge isActive={job.is_active} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-400">Employment Type</dt>
            <dd className="font-medium text-slate-700">{job.employment_type.replace("_", " ")}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Experience</dt>
            <dd className="font-medium text-slate-700">
              {job.min_experience_years}
              {job.max_experience_years != null ? ` - ${job.max_experience_years}` : "+"} years
            </dd>
          </div>
          {salary && (
            <div>
              <dt className="text-slate-400">Salary</dt>
              <dd className="font-medium text-slate-700">{salary}</dd>
            </div>
          )}
        </dl>

        {job.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {job.skills.map((skill) => (
              <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                {skill}
              </span>
            ))}
          </div>
        )}

        <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{job.description}</p>

        <div className="mt-8 border-t border-slate-200 pt-6">
          {!job.is_active ? (
            <p className="text-sm text-slate-500">This job is no longer accepting applications.</p>
          ) : hasApplied || applySuccess ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              You have already applied to this job.
            </div>
          ) : (
            <div className="space-y-3">
              {applyError && <ErrorBanner message={applyError} />}
              <textarea
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                rows={3}
                placeholder="Add a short note to the recruiter (optional)"
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
              />
              <button
                type="button"
                onClick={handleApply}
                disabled={isApplying}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {isApplying ? "Submitting…" : "Apply Now"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
