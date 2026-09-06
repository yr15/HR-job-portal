import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";
import { Spinner } from "../components/Spinner";

export function homePathForRole(role: UserRole): string {
  return role === "HR" ? "/hr/dashboard" : "/candidate/dashboard";
}

export function ProtectedRoute({ allowedRole }: { allowedRole: UserRole }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  return <Outlet />;
}
