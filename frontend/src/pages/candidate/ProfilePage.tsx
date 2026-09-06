import { useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateMyProfile } from "../../api/candidates";
import { getErrorMessage } from "../../api/client";
import { ErrorBanner } from "../../components/ErrorBanner";
import { FormField, inputClass } from "../../components/FormField";

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const profile = user?.candidate_profile;

  const [headline, setHeadline] = useState(profile?.headline ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [experience, setExperience] = useState(profile?.total_experience_years?.toString() ?? "");
  const [skillsText, setSkillsText] = useState(profile?.skills.join(", ") ?? "");
  const [resumeUrl, setResumeUrl] = useState(profile?.resume_url ?? "");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSaving(true);
    try {
      await updateMyProfile({
        headline: headline || null,
        phone: phone || null,
        location: location || null,
        total_experience_years: experience ? Number(experience) : null,
        skills: skillsText
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        resume_url: resumeUrl || null,
      });
      await refreshUser();
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, "Could not save your profile."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900">My Profile</h1>
      <p className="mt-1 text-sm text-slate-500">
        Keep this up to date — recruiters see it when you apply and when browsing the candidate directory.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {error && <ErrorBanner message={error} />}
        {success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Profile saved.
          </div>
        )}

        <div className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {user?.full_name} &middot; {user?.email}
        </div>

        <FormField label="Headline" htmlFor="headline">
          <input
            id="headline"
            className={inputClass}
            placeholder="e.g. Backend Engineer"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Phone" htmlFor="phone">
            <input id="phone" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FormField>
          <FormField label="Years of experience" htmlFor="experience">
            <input
              id="experience"
              type="number"
              min={0}
              max={60}
              step={0.5}
              className={inputClass}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Location" htmlFor="location">
          <input id="location" className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} />
        </FormField>

        <FormField label="Skills (comma-separated)" htmlFor="skills">
          <input
            id="skills"
            className={inputClass}
            placeholder="Python, FastAPI, PostgreSQL"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
          />
        </FormField>

        <FormField label="Resume link" htmlFor="resume_url">
          <input
            id="resume_url"
            className={inputClass}
            placeholder="https://drive.google.com/…"
            value={resumeUrl}
            onChange={(e) => setResumeUrl(e.target.value)}
          />
        </FormField>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
