import { useNavigate } from "react-router-dom";
import { createJob } from "../../api/jobs";
import { JobForm } from "../../components/JobForm";
import type { JobFormValues } from "../../api/jobs";

export function CreateJobPage() {
  const navigate = useNavigate();

  const handleSubmit = async (values: JobFormValues) => {
    const job = await createJob(values);
    navigate(`/hr/jobs`, { state: { message: `"${job.title}" was posted.` } });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900">Post a Job</h1>
      <p className="mt-1 text-sm text-slate-500">This job will be visible to candidates immediately.</p>
      <div className="mt-6">
        <JobForm onSubmit={handleSubmit} submitLabel="Post Job" />
      </div>
    </div>
  );
}
