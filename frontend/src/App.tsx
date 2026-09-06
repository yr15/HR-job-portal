import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { Spinner } from "./components/Spinner";
import { ProtectedRoute, homePathForRole } from "./routes/ProtectedRoute";
import { PublicRoute } from "./routes/PublicRoute";
import { LoginPage } from "./pages/public/LoginPage";
import { RegisterPage } from "./pages/public/RegisterPage";
import { CandidateDashboardPage } from "./pages/candidate/CandidateDashboardPage";
import { JobSearchPage } from "./pages/candidate/JobSearchPage";
import { JobDetailsPage } from "./pages/candidate/JobDetailsPage";
import { MyApplicationsPage } from "./pages/candidate/MyApplicationsPage";
import { InboxPage } from "./pages/candidate/InboxPage";
import { ProfilePage } from "./pages/candidate/ProfilePage";
import { HRDashboardPage } from "./pages/hr/HRDashboardPage";
import { MyJobsPage } from "./pages/hr/MyJobsPage";
import { CreateJobPage } from "./pages/hr/CreateJobPage";
import { EditJobPage } from "./pages/hr/EditJobPage";
import { ApplicantsPage } from "./pages/hr/ApplicantsPage";
import { CandidateDirectoryPage } from "./pages/hr/CandidateDirectoryPage";
import { CandidateDetailPage } from "./pages/hr/CandidateDetailPage";
import { HRProfilePage } from "./pages/hr/HRProfilePage";

function RootRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <Navigate to={user ? homePathForRole(user.role) : "/login"} replace />;
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="text-sm text-slate-500">The page you&apos;re looking for doesn&apos;t exist.</p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRole="CANDIDATE" />}>
        <Route element={<Layout />}>
          <Route path="/candidate/dashboard" element={<CandidateDashboardPage />} />
          <Route path="/candidate/jobs" element={<JobSearchPage />} />
          <Route path="/candidate/jobs/:jobId" element={<JobDetailsPage />} />
          <Route path="/candidate/applications" element={<MyApplicationsPage />} />
          <Route path="/candidate/inbox" element={<InboxPage />} />
          <Route path="/candidate/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRole="HR" />}>
        <Route element={<Layout />}>
          <Route path="/hr/dashboard" element={<HRDashboardPage />} />
          <Route path="/hr/jobs" element={<MyJobsPage />} />
          <Route path="/hr/jobs/new" element={<CreateJobPage />} />
          <Route path="/hr/jobs/:jobId/edit" element={<EditJobPage />} />
          <Route path="/hr/jobs/:jobId/applicants" element={<ApplicantsPage />} />
          <Route path="/hr/candidates" element={<CandidateDirectoryPage />} />
          <Route path="/hr/candidates/:candidateId" element={<CandidateDetailPage />} />
          <Route path="/hr/profile" element={<HRProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
