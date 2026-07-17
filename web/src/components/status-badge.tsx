"use client";

import { cn } from "@/lib/utils";

const labels: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  archived: "Archived",
};

const styles: Record<string, string> = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  sent: "bg-green-50 text-green-700 border-green-200",
  archived: "bg-gray-100 text-gray-600 border-gray-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        styles[status] ?? styles.draft,
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}
