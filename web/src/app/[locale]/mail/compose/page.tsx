"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { Sparkles, X } from "lucide-react";
import { ComposeEditor } from "@/components/compose-editor";
import { AiDrawer } from "@/components/ai-drawer";
import { mailApi } from "@/lib/api-client";

export function ComposePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("<p></p>");
  const [bodyText, setBodyText] = useState("");
  const [intent, setIntent] = useState<string | undefined>();
  const [keyFacts, setKeyFacts] = useState<string[]>([]);
  const [tone, setTone] = useState<string | undefined>();
  const [strategy, setStrategy] = useState<"advanced" | "naive" | undefined>("advanced");
  const [aiOpen, setAiOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadDraft = useCallback(async () => {
    if (!editId) return;
    const email = await mailApi.get(editId);
    setSubject(email.subject);
    setBodyHtml(email.body_html || "<p></p>");
    setBodyText(email.body_text);
    setIntent(email.intent ?? undefined);
    setKeyFacts(email.key_facts ?? []);
    setTone(email.tone ?? undefined);
    setStrategy(email.strategy ?? "advanced");
  }, [editId]);

  useEffect(() => {
    loadDraft().catch(console.error);
  }, [loadDraft]);

  async function saveDraft() {
    setSaving(true);
    try {
      const payload = {
        subject,
        body_html: bodyHtml,
        body_text: bodyText,
        intent,
        key_facts: keyFacts,
        tone,
        strategy,
        status: "draft" as const,
      };
      if (editId) {
        await mailApi.patch(editId, payload);
      } else {
        await mailApi.create(payload);
      }
      router.push("/mail?folder=drafts");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function markSent() {
    setSaving(true);
    try {
      const payload = {
        subject,
        body_html: bodyHtml,
        body_text: bodyText,
        intent,
        key_facts: keyFacts,
        tone,
        strategy,
        status: "sent" as const,
      };
      if (editId) {
        await mailApi.patch(editId, payload);
      } else {
        await mailApi.create(payload);
      }
      router.push("/mail?folder=sent");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <header className="flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--mail-chrome)] px-4 py-3">
        <h1 className="text-lg font-medium">
          {editId ? "Edit draft" : "New message"}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAiOpen(true)}
            className="flex items-center gap-1 rounded-md border border-[var(--primary)] px-3 py-1.5 text-sm text-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]"
          >
            <Sparkles className="h-4 w-4" />
            AI Assist
          </button>
          <Link href="/mail" className="rounded p-1 hover:bg-[var(--mail-list)]">
            <X className="h-5 w-5 text-[var(--muted)]" />
          </Link>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto p-4">
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--mail-chrome)] shadow-sm">
          <div className="border-b border-[var(--card-border)] px-4 py-3">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
            />
          </div>
          <ComposeEditor
            html={bodyHtml}
            onChange={(html, text) => {
              setBodyHtml(html);
              setBodyText(text);
            }}
          />
          <div className="flex justify-end gap-2 border-t border-[var(--card-border)] px-4 py-3">
            <button
              onClick={saveDraft}
              disabled={saving}
              className="rounded-md border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--mail-list)] disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              onClick={markSent}
              disabled={saving}
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              Mark Sent
            </button>
          </div>
        </div>
      </div>
      <AiDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onGenerated={(r) => {
          setSubject(r.subject);
          setBodyHtml(r.body_html || `<p>${r.body_text.replace(/\n/g, "</p><p>")}</p>`);
          setBodyText(r.body_text);
          setIntent(r.intent);
          setKeyFacts(r.key_facts);
          setTone(r.tone);
          setStrategy(r.strategy);
        }}
      />
    </div>
  );
}

export default function ComposePageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--muted)]">Loading compose…</div>}>
      <ComposePageClient />
    </Suspense>
  );
}
