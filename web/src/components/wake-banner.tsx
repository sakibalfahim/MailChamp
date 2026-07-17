"use client";

export function WakeBanner({ visible, label }: { visible: boolean; label?: string }) {
  if (!visible) return null;
  return (
    <div className="border-b border-amber-300/40 bg-amber-500/15 px-4 py-2 text-sm text-amber-950 dark:text-amber-100">
      {label ?? "Waking API…"} — free-tier hosts sleep after idle (~90s on first request).
    </div>
  );
}
