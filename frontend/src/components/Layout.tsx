import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CANDIDATE_LINKS = [
  { to: "/candidate/dashboard", label: "Dashboard" },
  { to: "/candidate/jobs", label: "Find Jobs" },
  { to: "/candidate/applications", label: "My Applications" },
  { to: "/candidate/profile", label: "Profile" },
];

const HR_LINKS = [
  { to: "/hr/dashboard", label: "Dashboard" },
  { to: "/hr/jobs", label: "My Jobs" },
  { to: "/hr/jobs/new", label: "Post a Job" },
  { to: "/hr/candidates", label: "Candidates" },
];

export function Layout() {
  const { user, logout } = useAuth();
  const links = user?.role === "HR" ? HR_LINKS : CANDIDATE_LINKS;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-8">
            <span className="text-lg font-bold text-indigo-600">HireHub</span>
            <nav className="hidden gap-1 sm:flex">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm font-medium ${
                      isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-500 sm:inline">
              {user?.full_name} <span className="text-slate-400">&middot; {user?.role}</span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 sm:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
