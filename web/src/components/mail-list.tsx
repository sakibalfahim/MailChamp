"use client";

import { Link } from "@/i18n/navigation";
import { cn, formatDate, previewText } from "@/lib/utils";
import type { EmailRecord } from "@/lib/api-client";
import { StatusBadge } from "./status-badge";

export function MailList({
  emails,
  selectedId,
  search,
}: {
  emails: EmailRecord[];
  selectedId?: string;
  search: string;
}) {
  const q = search.trim().toLowerCase();
  const filtered = q
    ? emails.filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          e.body_text.toLowerCase().includes(q),
      )
    : emails;

  if (filtered.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-[var(--muted)]">
        {q ? "No matches." : "No messages in this folder."}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[var(--card-border)] overflow-y-auto">
      {filtered.map((email) => (
        <li key={email.id}>
          <Link
            href={`/mail/${email.id}`}
            className={cn(
              "block px-4 py-3 hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]",
              selectedId === email.id && "bg-[color-mix(in_srgb,var(--primary)_18%,transparent)]",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-medium text-[var(--foreground)]">
                {email.subject || "(no subject)"}
              </p>
              <span className="shrink-0 text-xs text-[var(--muted)]">
                {formatDate(email.updated_at)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={email.status} />
              <p className="truncate text-xs text-[var(--muted)]">
                {previewText(email.body_text || email.body_html.replace(/<[^>]+>/g, " "))}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
