import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../api/client";
import { ErrorBanner } from "../../components/ErrorBanner";
import { FormField, inputClass } from "../../components/FormField";
import { homePathForRole } from "../../routes/ProtectedRoute";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = (location.state as { message?: string } | null)?.message;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(homePathForRole(user.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Invalid email or password."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-indigo-600">HireHub</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {successMessage && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}
          {error && <ErrorBanner message={error} />}
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
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Register
          </Link>
        </p>
        <div className="mt-6 rounded-md border border-slate-200 bg-white p-4 text-xs text-slate-500">
          <p className="font-medium text-slate-600">Demo credentials</p>
          <p className="mt-1">HR: hr@test.com / Hr@12345</p>
          <p>Candidate: candidate@test.com / Candidate@12345</p>
        </div>
      </div>
    </div>
  );
}
