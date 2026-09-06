import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { searchCandidates } from "../../api/candidates";
import { sendBulkMessage } from "../../api/messages";
import { getErrorMessage } from "../../api/client";
import { Spinner } from "../../components/Spinner";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { Pagination } from "../../components/Pagination";
import { FormField, inputClass } from "../../components/FormField";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { CandidateListItem } from "../../types";

interface MessageTemplate {
  id: string;
  label: string;
  subject: string;
  prefix: string;
  suffix: string;
}

const CUSTOM_TEMPLATE_ID = "custom";

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  { id: CUSTOM_TEMPLATE_ID, label: "Custom (no template)", subject: "", prefix: "", suffix: "" },
  {
    id: "shortlisted",
    label: "Shortlisted for Interview",
    subject: "You've been shortlisted!",
    prefix: "Hi,\n\nGreat news — we've reviewed your profile and would like to move forward.",
    suffix: "Our team will follow up shortly to schedule next steps.\n\nBest regards",
  },
  {
    id: "followup",
    label: "Application Follow-up",
    subject: "Following up on your application",
    prefix: "Hi,\n\nThank you for your interest in joining our team.",
    suffix: "We'll keep you posted on next steps.\n\nBest regards",
  },
  {
    id: "opportunity",
    label: "New Opportunity",
    subject: "A new opportunity you might like",
    prefix: "Hi,\n\nWe came across your profile and thought you'd be a great fit for a role we're hiring for.",
    suffix: "Let us know if you'd like to learn more.\n\nBest regards",
  },
];

export function CandidateDirectoryPage() {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [page, setPage] = useState(1);
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const debouncedQ = useDebouncedValue(q);
  const debouncedLocation = useDebouncedValue(location);
  const debouncedSkillsText = useDebouncedValue(skillsText);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const skills = debouncedSkillsText
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    searchCandidates({
      q: debouncedQ || undefined,
      location: debouncedLocation || undefined,
      skills: skills.length > 0 ? skills : undefined,
      page,
      page_size: pageSize,
    })
      .then((data) => {
        setCandidates(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(getErrorMessage(err, "Could not load candidates.")))
      .finally(() => setIsLoading(false));
  }, [debouncedQ, debouncedLocation, debouncedSkillsText, page]);

  const toggleSelected = (candidateId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(candidateId)) next.delete(candidateId);
      else next.add(candidateId);
      return next;
    });
  };

  const allOnPageSelected = candidates.length > 0 && candidates.every((c) => selectedIds.has(c.id));

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        candidates.forEach((c) => next.delete(c.id));
      } else {
        candidates.forEach((c) => next.add(c.id));
      }
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Candidate Directory</h1>
        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Message Selected ({selectedIds.size})
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          className={inputClass}
          placeholder="Search by name or headline"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <input
          className={inputClass}
          placeholder="Location"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            setPage(1);
          }}
        />
        <input
          className={inputClass}
          placeholder="Skills (comma-separated)"
          value={skillsText}
          onChange={(e) => {
            setSkillsText(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : error ? (
          <ErrorBanner message={error} />
        ) : candidates.length === 0 ? (
          <EmptyState title="No candidates match your search" description="Try broadening your filters." />
        ) : (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-500">
              <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAllOnPage} />
              Select all on this page
            </label>
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selectedIds.has(candidate.id)}
                  onChange={() => toggleSelected(candidate.id)}
                />
                <Link to={`/hr/candidates/${candidate.id}`} className="flex-1">
                  <h2 className="font-medium text-slate-900">{candidate.full_name}</h2>
                  <p className="text-sm text-slate-500">
                    {candidate.headline ?? "No headline"}
                    {candidate.total_experience_years != null && ` · ${candidate.total_experience_years} yrs`}
                    {candidate.location && ` · ${candidate.location}`}
                  </p>
                  {candidate.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {candidate.skills.slice(0, 6).map((skill) => (
                        <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </div>
            ))}
          </div>
        )}
        {!isLoading && !error && (
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        )}
      </div>

      {isComposeOpen && (
        <ComposeMessageModal
          recipientCount={selectedIds.size}
          onCancel={() => setIsComposeOpen(false)}
          onSent={() => {
            setIsComposeOpen(false);
            setSelectedIds(new Set());
          }}
          candidateIds={Array.from(selectedIds)}
        />
      )}
    </div>
  );
}

function ComposeMessageModal({
  recipientCount,
  candidateIds,
  onCancel,
  onSent,
}: {
  recipientCount: number;
  candidateIds: string[];
  onCancel: () => void;
  onSent: () => void;
}) {
  const [templateId, setTemplateId] = useState(CUSTOM_TEMPLATE_ID);
  const [subject, setSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const template = MESSAGE_TEMPLATES.find((t) => t.id === templateId) ?? MESSAGE_TEMPLATES[0];

  const handleTemplateChange = (newTemplateId: string) => {
    setTemplateId(newTemplateId);
    const newTemplate = MESSAGE_TEMPLATES.find((t) => t.id === newTemplateId);
    setSubject(newTemplate?.subject ?? "");
    setMessageContent("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSending(true);
    const body = [template.prefix, messageContent, template.suffix].filter(Boolean).join("\n\n");
    try {
      await sendBulkMessage({ candidate_ids: candidateIds, subject, body });
      onSent();
    } catch (err) {
      setError(getErrorMessage(err, "Could not send this message."));
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-slate-900">
          Message {recipientCount} candidate{recipientCount === 1 ? "" : "s"}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          This sends an in-app inbox notice, not a real email — candidates see it on their dashboard.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && <ErrorBanner message={error} />}

          <FormField label="Template" htmlFor="message-template">
            <select
              id="message-template"
              className={inputClass}
              value={templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
            >
              {MESSAGE_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Subject" htmlFor="message-subject">
            <input
              id="message-subject"
              required
              className={inputClass}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </FormField>

          {template.prefix && (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              {template.prefix}
            </p>
          )}

          <FormField label="Your message" htmlFor="message-body">
            <textarea
              id="message-body"
              required
              rows={4}
              placeholder="Write the part specific to this batch of candidates…"
              className={inputClass}
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
            />
          </FormField>

          {template.suffix && (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              {template.suffix}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSending}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {isSending ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
