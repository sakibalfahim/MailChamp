"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/blog" as const, key: "blog" as const },
  { href: "/docs" as const, key: "docs" as const },
  { href: "/pricing" as const, key: "pricing" as const },
  { href: "/about" as const, key: "about" as const },
  { href: "/contact" as const, key: "contact" as const },
];

export function SiteHeader() {
  const t = useTranslations("nav");

  return (
    <header className="relative z-20 border-b border-[var(--card-border)] bg-[color-mix(in_srgb,var(--background)_82%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[var(--foreground)]">
            MailChamp
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-[var(--muted)] md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-[var(--foreground)]">
                {t(l.key)}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
          <Link
            href="/login"
            className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] sm:inline"
          >
            {t("signIn")}
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[var(--primary)] px-3.5 py-1.5 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
          >
            {t("signUp")}
          </Link>
        </div>
      </div>
    </header>
  );
}
