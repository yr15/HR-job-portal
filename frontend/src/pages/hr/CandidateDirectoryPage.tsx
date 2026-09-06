import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchCandidates } from "../../api/candidates";
import { getErrorMessage } from "../../api/client";
import { Spinner } from "../../components/Spinner";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { Pagination } from "../../components/Pagination";
import { inputClass } from "../../components/FormField";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { CandidateListItem } from "../../types";

export function CandidateDirectoryPage() {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [page, setPage] = useState(1);
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  const debouncedQ = useDebouncedValue(q);
  const debouncedLocation = useDebouncedValue(location);
  const debouncedSkillsText = useDebouncedValue(skillsText);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const skills = debouncedSkillsText
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    searchCandidates({
      q: debouncedQ || undefined,
      location: debouncedLocation || undefined,
      skills: skills.length > 0 ? skills : undefined,
      page,
      page_size: pageSize,
    })
      .then((data) => {
        setCandidates(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(getErrorMessage(err, "Could not load candidates.")))
      .finally(() => setIsLoading(false));
  }, [debouncedQ, debouncedLocation, debouncedSkillsText, page]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Candidate Directory</h1>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          className={inputClass}
          placeholder="Search by name or headline"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
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
        <input
          className={inputClass}
          placeholder="Skills (comma-separated)"
          value={skillsText}
          onChange={(e) => {
            setSkillsText(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : error ? (
          <ErrorBanner message={error} />
        ) : candidates.length === 0 ? (
          <EmptyState title="No candidates match your search" description="Try broadening your filters." />
        ) : (
          <div className="space-y-3">
            {candidates.map((candidate) => (
              <Link
                key={candidate.id}
                to={`/hr/candidates/${candidate.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-medium text-slate-900">{candidate.full_name}</h2>
                    <p className="text-sm text-slate-500">
                      {candidate.headline ?? "No headline"}
                      {candidate.total_experience_years != null && ` · ${candidate.total_experience_years} yrs`}
                      {candidate.location && ` · ${candidate.location}`}
                    </p>
                  </div>
                </div>
                {candidate.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {candidate.skills.slice(0, 6).map((skill) => (
                      <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
        {!isLoading && !error && (
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}
