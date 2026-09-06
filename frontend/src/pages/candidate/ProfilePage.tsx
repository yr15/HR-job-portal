import { useRef, useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { getResumeBlobUrl, updateMyProfile, uploadResume } from "../../api/candidates";
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

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [resumeError, setResumeError] = useState<string | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isViewingResume, setIsViewingResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      });
      await refreshUser();
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, "Could not save your profile."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setResumeError(null);
    setIsUploadingResume(true);
    try {
      await uploadResume(file);
      await refreshUser();
    } catch (err) {
      setResumeError(getErrorMessage(err, "Could not upload your resume."));
    } finally {
      setIsUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleViewResume = async () => {
    if (!user) return;
    setIsViewingResume(true);
    setResumeError(null);
    try {
      const blobUrl = await getResumeBlobUrl(user.id);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setResumeError(getErrorMessage(err, "Could not open your resume."));
    } finally {
      setIsViewingResume(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900">My Profile</h1>
      <p className="mt-1 text-sm text-slate-500">
        Keep this up to date — recruiters see it when you apply and when browsing the candidate directory.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium text-slate-700">Resume</h2>
        {resumeError && (
          <div className="mt-2">
            <ErrorBanner message={resumeError} />
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {profile?.resume_filename ? (
            <>
              <span className="text-sm text-slate-600">{profile.resume_filename}</span>
              <button
                type="button"
                onClick={handleViewResume}
                disabled={isViewingResume}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {isViewingResume ? "Opening…" : "View"}
              </button>
            </>
          ) : (
            <span className="text-sm text-slate-400">No resume uploaded yet.</span>
          )}
          <label className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 cursor-pointer">
            {isUploadingResume ? "Uploading…" : profile?.resume_filename ? "Replace" : "Upload"}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={isUploadingResume}
              onChange={handleResumeSelected}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-400">PDF only, up to 5MB.</p>
      </div>

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
