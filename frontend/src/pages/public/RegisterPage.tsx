import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../api/client";
import { ErrorBanner } from "../../components/ErrorBanner";
import { FormField, inputClass } from "../../components/FormField";
import type { UserRole } from "../../types";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>("CANDIDATE");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register({
        email,
        password,
        full_name: fullName,
        role,
        company_name: role === "HR" ? companyName : undefined,
      });
      navigate("/login", { state: { message: "Account created. Please sign in." } });
    } catch (err) {
      setError(getErrorMessage(err, "Could not create your account."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-indigo-600">HireHub</h1>
          <p className="mt-1 text-sm text-slate-500">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {error && <ErrorBanner message={error} />}

          <div>
            <span className="block text-sm font-medium text-slate-700">I am a</span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(["CANDIDATE", "HR"] as UserRole[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRole(option)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${
                    role === option
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {option === "CANDIDATE" ? "Candidate" : "HR / Recruiter"}
                </button>
              ))}
            </div>
          </div>

          <FormField label="Full name" htmlFor="full_name">
            <input
              id="full_name"
              required
              className={inputClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </FormField>

          {role === "HR" && (
            <FormField label="Company name" htmlFor="company_name">
              <input
                id="company_name"
                required
                className={inputClass}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </FormField>
          )}

          <FormField label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>

          <FormField label="Password" htmlFor="password">
            <input
              id="password"
              type="password"
              required
              minLength={8}
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-400">At least 8 characters, including a letter and a digit.</p>
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
