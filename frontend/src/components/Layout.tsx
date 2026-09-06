import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUnreadMessageCount } from "../api/messages";

const CANDIDATE_LINKS = [
  { to: "/candidate/dashboard", label: "Dashboard" },
  { to: "/candidate/jobs", label: "Find Jobs" },
  { to: "/candidate/applications", label: "My Applications" },
  { to: "/candidate/inbox", label: "Inbox" },
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
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const links = user?.role === "HR" ? HR_LINKS : CANDIDATE_LINKS;

  useEffect(() => {
    if (user?.role !== "CANDIDATE") return;
    getUnreadMessageCount()
      .then(setUnreadCount)
      .catch(() => undefined);
  }, [user?.role, location.pathname]);

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
                    `flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium ${
                      isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  {link.label}
                  {link.to === "/candidate/inbox" && unreadCount > 0 && (
                    <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                      {unreadCount}
                    </span>
                  )}
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
                `flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600"
                }`
              }
            >
              {link.label}
              {link.to === "/candidate/inbox" && unreadCount > 0 && (
                <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                  {unreadCount}
                </span>
              )}
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
