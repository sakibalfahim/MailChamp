"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { mailApi } from "@/lib/api-client";

export function AiDrawer({
  open,
  onClose,
  onGenerated,
}: {
  open: boolean;
  onClose: () => void;
  onGenerated: (result: {
    subject: string;
    body_html: string;
    body_text: string;
    intent: string;
    key_facts: string[];
    tone: string;
    strategy: "advanced" | "naive";
  }) => void;
}) {
  const [intent, setIntent] = useState("");
  const [factsInput, setFactsInput] = useState("");
  const [tone, setTone] = useState("formal");
  const [strategy, setStrategy] = useState<"advanced" | "naive">("advanced");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setSlow(false);
    const slowTimer = setTimeout(() => setSlow(true), 3000);
    const key_facts = factsInput
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      const result = await mailApi.generate({ intent, key_facts, tone, strategy });
      onGenerated({
        ...result,
        intent,
        key_facts,
        tone,
        strategy,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate failed");
    } finally {
      clearTimeout(slowTimer);
      setLoading(false);
      setSlow(false);
    }
  }

  const fieldClass =
    "w-full rounded-md border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)]";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="flex h-full w-full max-w-md flex-col border-s border-[var(--card-border)] bg-[var(--mail-chrome)] text-[var(--foreground)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-sm font-semibold">AI Assistant</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-[var(--mail-list)]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Intent</label>
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              rows={3}
              className={fieldClass}
              placeholder="What should this email accomplish?"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
              Key Facts (one per line)
            </label>
            <textarea
              value={factsInput}
              onChange={(e) => setFactsInput(e.target.value)}
              rows={4}
              className={fieldClass}
              placeholder={"Meeting on March 12\nContact: Priya Shah"}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className={fieldClass}>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="friendly">Friendly</option>
              <option value="urgent">Urgent</option>
              <option value="empathetic">Empathetic</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Strategy</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as "advanced" | "naive")}
              className={fieldClass}
            >
              <option value="advanced">Advanced (CoT + few-shot)</option>
              <option value="naive">Naive baseline</option>
            </select>
          </div>
          {slow && (
            <p className="rounded bg-amber-500/15 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
              Waking API… free-tier cold starts can take up to ~90s.
            </p>
          )}
          {error && (
            <p className="rounded bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">{error}</p>
          )}
        </div>
        <div className="border-t border-[var(--card-border)] p-4">
          <button
            onClick={handleGenerate}
            disabled={loading || !intent.trim() || !tone.trim()}
            className="w-full rounded-md bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate email"}
          </button>
        </div>
      </div>
    </div>
  );
}
