"use client";

import type { FormEvent } from "react";
import { useTranslations } from "next-intl";

export function ContactForm() {
  const t = useTranslations("contact");

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "");
    const email = String(fd.get("email") ?? "");
    const message = String(fd.get("message") ?? "");
    const subject = encodeURIComponent(`MailChamp contact from ${name}`);
    const body = encodeURIComponent(`From: ${name} <${email}>\n\n${message}`);
    window.location.href = `mailto:hello@mailchamp.local?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={onSubmit} className="mc-panel mt-10 max-w-xl space-y-4 rounded-2xl p-6">
      <div>
        <label className="mb-1 block text-sm font-medium">{t("name")}</label>
        <input
          name="name"
          required
          className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t("email")}</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t("message")}</label>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)]"
      >
        {t("submit")}
      </button>
      <p className="text-xs text-[var(--muted)]">{t("hint")}</p>
    </form>
  );
}
