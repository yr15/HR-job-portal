import { useState, type FormEvent } from "react";
import { getErrorMessage } from "../api/client";
import { ErrorBanner } from "./ErrorBanner";
import { FormField, inputClass } from "./FormField";
import type { EmploymentType, Job } from "../types";
import type { JobFormValues } from "../api/jobs";

const EMPLOYMENT_TYPES: EmploymentType[] = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"];

interface JobFormProps {
  initialJob?: Job;
  onSubmit: (values: JobFormValues) => Promise<void>;
  submitLabel: string;
}

export function JobForm({ initialJob, onSubmit, submitLabel }: JobFormProps) {
  const [title, setTitle] = useState(initialJob?.title ?? "");
  const [description, setDescription] = useState(initialJob?.description ?? "");
  const [skillsText, setSkillsText] = useState(initialJob?.skills.join(", ") ?? "");
  const [location, setLocation] = useState(initialJob?.location ?? "");
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    initialJob?.employment_type ?? "FULL_TIME",
  );
  const [minExperience, setMinExperience] = useState(initialJob?.min_experience_years?.toString() ?? "0");
  const [maxExperience, setMaxExperience] = useState(initialJob?.max_experience_years?.toString() ?? "");
  const [salaryMin, setSalaryMin] = useState(initialJob?.salary_min?.toString() ?? "");
  const [salaryMax, setSalaryMax] = useState(initialJob?.salary_max?.toString() ?? "");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        skills: skillsText
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        location,
        employment_type: employmentType,
        min_experience_years: Number(minExperience || 0),
        max_experience_years: maxExperience ? Number(maxExperience) : null,
        salary_min: salaryMin ? Number(salaryMin) : null,
        salary_max: salaryMax ? Number(salaryMax) : null,
      });
    } catch (err) {
      setError(getErrorMessage(err, "Could not save this job."));
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      {error && <ErrorBanner message={error} />}

      <FormField label="Job title" htmlFor="title">
        <input id="title" required minLength={3} className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
      </FormField>

      <FormField label="Description" htmlFor="description">
        <textarea
          id="description"
          required
          minLength={20}
          rows={5}
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Location" htmlFor="location">
          <input id="location" required className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} />
        </FormField>
        <FormField label="Employment type" htmlFor="employment_type">
          <select
            id="employment_type"
            className={inputClass}
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
          >
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Skills (comma-separated)" htmlFor="skills">
        <input
          id="skills"
          className={inputClass}
          placeholder="Python, FastAPI, PostgreSQL"
          value={skillsText}
          onChange={(e) => setSkillsText(e.target.value)}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Min experience (years)" htmlFor="min_experience">
          <input
            id="min_experience"
            type="number"
            min={0}
            max={50}
            step={0.5}
            className={inputClass}
            value={minExperience}
            onChange={(e) => setMinExperience(e.target.value)}
          />
        </FormField>
        <FormField label="Max experience (years, optional)" htmlFor="max_experience">
          <input
            id="max_experience"
            type="number"
            min={0}
            max={50}
            step={0.5}
            className={inputClass}
            value={maxExperience}
            onChange={(e) => setMaxExperience(e.target.value)}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Salary min (optional)" htmlFor="salary_min">
          <input
            id="salary_min"
            type="number"
            min={0}
            className={inputClass}
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
          />
        </FormField>
        <FormField label="Salary max (optional)" htmlFor="salary_max">
          <input
            id="salary_max"
            type="number"
            min={0}
            className={inputClass}
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
          />
        </FormField>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {isSubmitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
