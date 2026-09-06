import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { searchJobs } from "../../api/jobs";
import { getErrorMessage } from "../../api/client";
import { Spinner } from "../../components/Spinner";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { Pagination } from "../../components/Pagination";
import { inputClass } from "../../components/FormField";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { EmploymentType, Job } from "../../types";

const EMPLOYMENT_TYPES: EmploymentType[] = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"];

export function JobSearchPage() {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">("");
  const [skillsText, setSkillsText] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [page, setPage] = useState(1);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 10;

  const debouncedQ = useDebouncedValue(q);
  const debouncedLocation = useDebouncedValue(location);
  const debouncedSkillsText = useDebouncedValue(skillsText);
  const debouncedExperienceYears = useDebouncedValue(experienceYears);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const skills = debouncedSkillsText
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    searchJobs({
      q: debouncedQ || undefined,
      location: debouncedLocation || undefined,
      employment_type: employmentType || undefined,
      skills: skills.length > 0 ? skills : undefined,
      experience_years: debouncedExperienceYears ? Number(debouncedExperienceYears) : undefined,
      page,
      page_size: pageSize,
    })
      .then((data) => {
        setJobs(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(getErrorMessage(err, "Could not load jobs.")))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, debouncedLocation, employmentType, debouncedSkillsText, debouncedExperienceYears, page]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Find your next role</h1>
      <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          className={inputClass}
          placeholder="Title or keyword"
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
        <select
          className={inputClass}
          value={employmentType}
          onChange={(e) => {
            setEmploymentType(e.target.value as EmploymentType | "");
            setPage(1);
          }}
        >
          <option value="">Any employment type</option>
          {EMPLOYMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace("_", " ")}
            </option>
          ))}
        </select>
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
          type="number"
          min={0}
          max={50}
          step={0.5}
          placeholder="Your years of experience"
          value={experienceYears}
          onChange={(e) => {
            setExperienceYears(e.target.value);
            setPage(1);
          }}
        />
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Search
        </button>
      </form>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : error ? (
          <ErrorBanner message={error} />
        ) : jobs.length === 0 ? (
          <EmptyState title="No jobs match your search" description="Try broadening your filters." />
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                to={`/candidate/jobs/${job.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-900">{job.title}</h2>
                    <p className="text-sm text-slate-500">
                      {job.company_name} &middot; {job.location} &middot; {job.employment_type.replace("_", " ")}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-slate-400">
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
                {job.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.skills.slice(0, 6).map((skill) => (
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
