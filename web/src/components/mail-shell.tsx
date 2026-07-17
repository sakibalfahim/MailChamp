"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { MailSidebar } from "./mail-sidebar";
import { MailList } from "./mail-list";
import { MailReadingPane } from "./mail-reading-pane";
import { WakeBanner } from "./wake-banner";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { mailApi, type EmailRecord } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";

function folderToStatus(folder: string): string {
  switch (folder) {
    case "drafts":
      return "draft";
    case "sent":
      return "sent";
    case "archive":
      return "archived";
    default:
      return "all";
  }
}

export function MailShell({ initialId }: { initialId?: string }) {
  const t = useTranslations("mail");
  const router = useRouter();
  const searchParams = useSearchParams();
  const folder = searchParams.get("folder") ?? "all";
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [selected, setSelected] = useState<EmailRecord | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [waking, setWaking] = useState(false);

  const selectedId = initialId;

  const loadEmails = useCallback(async () => {
    setLoading(true);
    setWaking(false);
    const timer = setTimeout(() => setWaking(true), 3000);
    try {
      const status = folderToStatus(folder);
      const data = await mailApi.list(status === "all" ? "all" : status);
      setEmails(data.emails);
      if (selectedId) {
        const found = data.emails.find((e) => e.id === selectedId);
        if (found) setSelected(found);
        else {
          const detail = await mailApi.get(selectedId);
          setSelected(detail);
        }
      } else {
        setSelected(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setWaking(false);
    }
  }, [folder, selectedId]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.target instanceof HTMLElement && e.target.isContentEditable) return;
      if (e.key === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) router.push("/mail/compose");
      if (e.key === "/") {
        e.preventDefault();
        document.getElementById("mail-search")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  async function handleArchive() {
    if (!selected) return;
    await mailApi.patch(selected.id, { status: "archived" });
    await loadEmails();
    router.push(`/mail?folder=${folder === "all" ? "" : folder}`);
  }

  async function handleDelete() {
    if (!selected || !confirm("Permanently delete this message?")) return;
    await mailApi.delete(selected.id);
    await loadEmails();
    router.push(`/mail?folder=${folder === "all" ? "" : folder}`);
  }

  async function handleMarkSent() {
    if (!selected) return;
    await mailApi.patch(selected.id, { status: "sent" });
    await loadEmails();
  }

  async function signOut() {
    await authClient.signOut();
    router.push("/");
  }

  return (
    <div className="flex h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <WakeBanner visible={waking} label={t("waking")} />
      <header className="flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--mail-chrome)] px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href="/mail" className="font-[family-name:var(--font-display)] text-lg font-semibold">
            MailChamp
          </Link>
          <input
            id="mail-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="w-64 rounded-full bg-[var(--mail-list)] px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          <button onClick={signOut} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
            {t("signOut")}
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <MailSidebar folder={folder} />
        <section className="flex w-80 shrink-0 flex-col border-e border-[var(--card-border)] bg-[var(--mail-chrome)]">
          {loading ? (
            <div className="p-4 text-sm text-[var(--muted)]">…</div>
          ) : (
            <MailList emails={emails} selectedId={selectedId} search={search} />
          )}
        </section>
        <section className="min-w-0 flex-1 bg-[var(--mail-chrome)]">
          <MailReadingPane
            email={selected}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onMarkSent={handleMarkSent}
          />
        </section>
      </div>
    </div>
  );
}
