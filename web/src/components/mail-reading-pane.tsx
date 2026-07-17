"use client";

import { sanitizeHtml } from "@/lib/sanitize";
import type { EmailRecord } from "@/lib/api-client";
import { StatusBadge } from "./status-badge";
import { formatDate } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

export function MailReadingPane({
  email,
  onArchive,
  onDelete,
  onMarkSent,
}: {
  email: EmailRecord | null;
  onArchive: () => void;
  onDelete: () => void;
  onMarkSent: () => void;
}) {
  if (!email) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-[var(--muted)]">
        Select a message to read
      </div>
    );
  }

  const safeHtml = sanitizeHtml(email.body_html || email.body_text.replace(/\n/g, "<br>"));

  return (
    <article className="flex h-full flex-col overflow-hidden bg-[var(--mail-chrome)]">
      <header className="border-b border-[var(--card-border)] px-6 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-normal text-[var(--foreground)]">
            {email.subject || "(no subject)"}
          </h1>
          <StatusBadge status={email.status} />
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">{formatDate(email.updated_at)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/mail/compose?id=${email.id}`}
            className="rounded border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--mail-list)]"
          >
            Edit
          </Link>
          {email.status === "draft" && (
            <button
              onClick={onMarkSent}
              className="rounded border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--mail-list)]"
            >
              Mark Sent
            </button>
          )}
          {email.status !== "archived" && (
            <button
              onClick={onArchive}
              className="rounded border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--mail-list)]"
            >
              Archive
            </button>
          )}
          <button
            onClick={onDelete}
            className="rounded border border-red-300/50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400"
          >
            Delete
          </button>
        </div>
      </header>
      <div
        className="prose prose-sm max-w-none flex-1 overflow-y-auto px-6 py-4 text-[var(--foreground)] dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </article>
  );
}
