import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getJob, updateJob } from "../../api/jobs";
import { getErrorMessage } from "../../api/client";
import { JobForm } from "../../components/JobForm";
import { Spinner } from "../../components/Spinner";
import { ErrorBanner } from "../../components/ErrorBanner";
import type { Job } from "../../types";
import type { JobFormValues } from "../../api/jobs";

export function EditJobPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    getJob(jobId)
      .then(setJob)
      .catch((err) => setError(getErrorMessage(err, "This job could not be found.")))
      .finally(() => setIsLoading(false));
  }, [jobId]);

  const handleSubmit = async (values: JobFormValues) => {
    if (!jobId) return;
    await updateJob(jobId, values);
    navigate("/hr/jobs", { state: { message: "Job updated." } });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error || !job) {
    return <ErrorBanner message={error ?? "This job could not be found."} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900">Edit Job</h1>
      <div className="mt-6">
        <JobForm initialJob={job} onSubmit={handleSubmit} submitLabel="Save Changes" />
      </div>
    </div>
  );
}
