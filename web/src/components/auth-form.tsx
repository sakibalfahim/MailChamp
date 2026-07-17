"use client";

import type { FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { Link, useRouter } from "@/i18n/navigation";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const locale = useLocale();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const name = String(fd.get("name") ?? email.split("@")[0] ?? "User");

    if (mode === "signup") {
      const { error } = await authClient.signUp.email({ email, password, name });
      if (error) {
        alert(error.message ?? "Sign up failed");
        return;
      }
    } else {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        alert(error.message ?? "Sign in failed");
        return;
      }
    }
    router.push("/mail");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">{t("name")}</label>
          <input
            name="name"
            type="text"
            className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">{t("email")}</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">{t("password")}</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-full bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)]"
      >
        {mode === "signup" ? t("submitSignup") : t("submitLogin")}
      </button>
      <p className="text-xs text-[var(--muted)]">{t("noForgot")}</p>
      <p className="text-center text-sm text-[var(--muted)]">
        {mode === "login" ? (
          <Link href="/signup" locale={locale} className="text-[var(--primary)] hover:underline">
            {t("toSignup")}
          </Link>
        ) : (
          <Link href="/login" locale={locale} className="text-[var(--primary)] hover:underline">
            {t("toLogin")}
          </Link>
        )}
      </p>
    </form>
  );
}
