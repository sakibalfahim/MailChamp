"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, type Locale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        aria-label={t("language")}
        onChange={(e) => {
          router.replace(pathname, { locale: e.target.value as Locale });
        }}
        className="rounded-full border border-[var(--card-border)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)]"
      >
        {(Object.keys(localeNames) as Locale[]).map((code) => (
          <option key={code} value={code}>
            {localeNames[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
