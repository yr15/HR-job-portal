import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getJob, getJobApplicants } from "../../api/jobs";
import { bulkUpdateApplicationStatus, updateApplicationStatus } from "../../api/applications";
import { getErrorMessage } from "../../api/client";
import { Spinner } from "../../components/Spinner";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { Pagination } from "../../components/Pagination";
import { StatusBadge } from "../../components/StatusBadge";
import { StarRating } from "../../components/StarRating";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { inputClass } from "../../components/FormField";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { Application, ApplicationStatus, Job } from "../../types";

const STATUS_OPTIONS: ApplicationStatus[] = ["APPLIED", "SHORTLISTED", "REJECTED"];
const RATING_OPTIONS = [5, 4, 3, 2, 1];

export function ApplicantsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [minExperience, setMinExperience] = useState("");
  const [maxExperience, setMaxExperience] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [location, setLocation] = useState("");
  const [selectedRatings, setSelectedRatings] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingRejection, setPendingRejection] = useState<Application | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkActing, setIsBulkActing] = useState(false);
  const [isPendingBulkReject, setIsPendingBulkReject] = useState(false);
  const pageSize = 10;

  const debouncedQ = useDebouncedValue(q);
  const debouncedMinExperience = useDebouncedValue(minExperience);
  const debouncedMaxExperience = useDebouncedValue(maxExperience);
  const debouncedSkillsText = useDebouncedValue(skillsText);
  const debouncedLocation = useDebouncedValue(location);

  useEffect(() => {
    if (!jobId) return;
    getJob(jobId).then(setJob).catch(() => undefined);
  }, [jobId]);

  const load = () => {
    if (!jobId) return;
    setIsLoading(true);
    setError(null);
    const skills = debouncedSkillsText
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    getJobApplicants(jobId, {
      q: debouncedQ || undefined,
      status: status || undefined,
      min_experience: debouncedMinExperience ? Number(debouncedMinExperience) : undefined,
      max_experience: debouncedMaxExperience ? Number(debouncedMaxExperience) : undefined,
      skills: skills.length > 0 ? skills : undefined,
      location: debouncedLocation || undefined,
      ratings: selectedRatings.size > 0 ? Array.from(selectedRatings) : undefined,
      page,
      page_size: pageSize,
    })
      .then((data) => {
        setApplicants(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(getErrorMessage(err, "Could not load applicants.")))
      .finally(() => setIsLoading(false));
  };

  useEffect(
    load,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      jobId,
      debouncedQ,
      status,
      debouncedMinExperience,
      debouncedMaxExperience,
      debouncedSkillsText,
      debouncedLocation,
      selectedRatings,
      page,
    ],
  );

  const toggleRating = (rating: number) => {
    setSelectedRatings((prev) => {
      const next = new Set(prev);
      if (next.has(rating)) next.delete(rating);
      else next.add(rating);
      return next;
    });
    setPage(1);
  };

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

  const toggleSelected = (applicationId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(applicationId)) next.delete(applicationId);
      else next.add(applicationId);
      return next;
    });
  };

  const allOnPageSelected = applicants.length > 0 && applicants.every((a) => selectedIds.has(a.id));

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        applicants.forEach((a) => next.delete(a.id));
      } else {
        applicants.forEach((a) => next.add(a.id));
      }
      return next;
    });
  };

  const handleBulkStatusChange = async (newStatus: "SHORTLISTED" | "REJECTED") => {
    setIsBulkActing(true);
    setError(null);
    try {
      await bulkUpdateApplicationStatus(Array.from(selectedIds), newStatus);
      setSelectedIds(new Set());
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Could not update the selected applicants."));
    } finally {
      setIsBulkActing(false);
    }
  };

  const confirmBulkReject = async () => {
    await handleBulkStatusChange("REJECTED");
    setIsPendingBulkReject(false);
  };

  return (
    <div>
      <Link to="/hr/jobs" className="text-sm text-indigo-600 hover:text-indigo-500">
        &larr; Back to my jobs
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-900">
          Applicants{job ? ` — ${job.title}` : ""}
        </h1>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{selectedIds.size} selected</span>
            <button
              type="button"
              disabled={isBulkActing}
              onClick={() => handleBulkStatusChange("SHORTLISTED")}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              Shortlist Selected
            </button>
            <button
              type="button"
              disabled={isBulkActing}
              onClick={() => setIsPendingBulkReject(true)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Reject Selected
            </button>
          </div>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Sorted by ATS match rating (highest first). Ratings are a simple skills/experience match score, not a
        judgment of the candidate.
      </p>

      <div className="mt-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input
            className={inputClass}
            type="number"
            min={0}
            max={60}
            step={0.5}
            placeholder="Min experience (yrs)"
            value={minExperience}
            onChange={(e) => {
              setMinExperience(e.target.value);
              setPage(1);
            }}
          />
          <input
            className={inputClass}
            type="number"
            min={0}
            max={60}
            step={0.5}
            placeholder="Max experience (yrs)"
            value={maxExperience}
            onChange={(e) => {
              setMaxExperience(e.target.value);
              setPage(1);
            }}
          />
          <input
            className={inputClass}
            placeholder="Skills (comma-separated)"
            value={skillsText}
            onChange={(e) => {
              setSkillsText(e.target.value);
              setPage(1);
            }}
          />
          <input
            className={inputClass}
            placeholder="Location"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-500">Rating:</span>
          {RATING_OPTIONS.map((rating) => (
            <label key={rating} className="flex items-center gap-1.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={selectedRatings.has(rating)}
                onChange={() => toggleRating(rating)}
              />
              <StarRating rating={rating} />
            </label>
          ))}
        </div>
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
            <label className="flex items-center gap-2 text-sm text-slate-500">
              <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAllOnPage} />
              Select all on this page
            </label>
            {applicants.map((application) => (
              <div key={application.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selectedIds.has(application.id)}
                    onChange={() => toggleSelected(application.id)}
                  />
                  <div className="flex-1">
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
                    <div className="mt-1">
                      <StarRating rating={application.ats_rating} score={application.ats_score} />
                    </div>
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

      <ConfirmDialog
        open={isPendingBulkReject}
        title={`Reject ${selectedIds.size} applicant${selectedIds.size === 1 ? "" : "s"}?`}
        description="They'll be marked as rejected. You can still reconsider any of them later."
        confirmLabel="Reject Selected"
        onConfirm={confirmBulkReject}
        onCancel={() => setIsPendingBulkReject(false)}
        isBusy={isBulkActing}
      />
    </div>
  );
}
