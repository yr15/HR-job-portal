import { useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateMyHRProfile } from "../../api/hr";
import { getErrorMessage } from "../../api/client";
import { ErrorBanner } from "../../components/ErrorBanner";
import { FormField, inputClass } from "../../components/FormField";

export function HRProfilePage() {
  const { user, refreshUser } = useAuth();
  const profile = user?.hr_profile;

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [companyName, setCompanyName] = useState(profile?.company_name ?? "");
  const [designation, setDesignation] = useState(profile?.designation ?? "");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSaving(true);
    try {
      await updateMyHRProfile({
        full_name: fullName,
        company_name: companyName,
        designation: designation || null,
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
        Your name and company appear on every job you post and message you send.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {error && <ErrorBanner message={error} />}
        {success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Profile saved.
          </div>
        )}

        <div className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">{user?.email}</div>

        <FormField label="Full name" htmlFor="full_name">
          <input
            id="full_name"
            required
            minLength={2}
            className={inputClass}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </FormField>

        <FormField label="Company name" htmlFor="company_name">
          <input
            id="company_name"
            required
            className={inputClass}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </FormField>

        <FormField label="Designation" htmlFor="designation">
          <input
            id="designation"
            placeholder="e.g. Talent Acquisition Manager"
            className={inputClass}
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
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
