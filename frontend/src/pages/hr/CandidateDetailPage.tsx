import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCandidate, getResumeBlobUrl } from "../../api/candidates";
import { getErrorMessage } from "../../api/client";
import { Spinner } from "../../components/Spinner";
import { ErrorBanner } from "../../components/ErrorBanner";
import type { User } from "../../types";

export function CandidateDetailPage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [candidate, setCandidate] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isViewingResume, setIsViewingResume] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;
    getCandidate(candidateId)
      .then(setCandidate)
      .catch((err) => setError(getErrorMessage(err, "This candidate could not be found.")))
      .finally(() => setIsLoading(false));
  }, [candidateId]);

  const handleViewResume = async () => {
    if (!candidateId) return;
    setIsViewingResume(true);
    setResumeError(null);
    try {
      const blobUrl = await getResumeBlobUrl(candidateId);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setResumeError(getErrorMessage(err, "Could not open this candidate's resume."));
    } finally {
      setIsViewingResume(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error || !candidate) {
    return <ErrorBanner message={error ?? "This candidate could not be found."} />;
  }

  const profile = candidate.candidate_profile;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/hr/candidates" className="text-sm text-indigo-600 hover:text-indigo-500">
        &larr; Back to directory
      </Link>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">{candidate.full_name}</h1>
        <p className="mt-1 text-sm text-slate-500">{profile?.headline ?? "No headline provided"}</p>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-400">Email</dt>
            <dd className="font-medium text-slate-700">{candidate.email}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Phone</dt>
            <dd className="font-medium text-slate-700">{profile?.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Experience</dt>
            <dd className="font-medium text-slate-700">
              {profile?.total_experience_years != null ? `${profile.total_experience_years} years` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Location</dt>
            <dd className="font-medium text-slate-700">{profile?.location ?? "—"}</dd>
          </div>
        </dl>

        <div className="mt-4">
          {resumeError && (
            <div className="mb-2">
              <ErrorBanner message={resumeError} />
            </div>
          )}
          {profile?.resume_filename ? (
            <button
              type="button"
              onClick={handleViewResume}
              disabled={isViewingResume}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {isViewingResume ? "Opening…" : `View resume (${profile.resume_filename})`}
            </button>
          ) : (
            <p className="text-sm text-slate-400">No resume uploaded.</p>
          )}
        </div>

        {profile && profile.skills.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-slate-400">Skills</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
