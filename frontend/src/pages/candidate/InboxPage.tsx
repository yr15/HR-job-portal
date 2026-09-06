import { useEffect, useState } from "react";
import { getMyMessages, markMessageRead } from "../../api/messages";
import { getErrorMessage } from "../../api/client";
import { Spinner } from "../../components/Spinner";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { Pagination } from "../../components/Pagination";
import type { Message } from "../../types";

export function InboxPage() {
  const [page, setPage] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getMyMessages(page, pageSize)
      .then((data) => {
        setMessages(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(getErrorMessage(err, "Could not load your inbox.")))
      .finally(() => setIsLoading(false));
  }, [page]);

  const handleExpand = async (message: Message) => {
    setExpandedId(expandedId === message.id ? null : message.id);
    if (message.read_at === null) {
      try {
        const updated = await markMessageRead(message.id);
        setMessages((prev) => prev.map((m) => (m.id === message.id ? updated : m)));
      } catch {
        // Non-critical — the message still opened, just failed to mark read. Leave state as-is.
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900">Inbox</h1>
      <p className="mt-1 text-sm text-slate-500">Notices from recruiters — not real email, viewable only here.</p>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : error ? (
          <ErrorBanner message={error} />
        ) : messages.length === 0 ? (
          <EmptyState title="No messages yet" description="Recruiter notices will show up here." />
        ) : (
          <div className="space-y-2">
            {messages.map((message) => {
              const isExpanded = expandedId === message.id;
              const isUnread = message.read_at === null;
              return (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => handleExpand(message)}
                  className={`block w-full rounded-lg border p-4 text-left shadow-sm ${
                    isUnread ? "border-indigo-200 bg-indigo-50/40" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`text-sm ${isUnread ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                        {isUnread && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-indigo-600" />}
                        {message.subject}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {message.sender_name}
                        {message.sender_company && ` · ${message.sender_company}`}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-slate-400">
                      {new Date(message.sent_at).toLocaleDateString()}
                    </span>
                  </div>
                  {isExpanded && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{message.body}</p>}
                </button>
              );
            })}
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
