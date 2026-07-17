import { setRequestLocale, getTranslations } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Link } from "@/i18n/navigation";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");

  return (
    <MarketingShell>
      <div className="mx-auto max-w-5xl px-5 py-16">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">{t("subtitle")}</p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="mc-panel rounded-2xl p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">{t("freeName")}</p>
            <p className="mt-4 font-[family-name:var(--font-display)] text-5xl font-bold">{t("freePrice")}</p>
            <p className="mt-4 text-[var(--muted)]">{t("freeDesc")}</p>
            <Link
              href="/signup"
              className="mt-8 inline-flex rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)]"
            >
              {t("freeCta")}
            </Link>
          </div>
          <div className="mc-panel rounded-2xl p-8 opacity-90">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{t("teamName")}</p>
            <p className="mt-4 font-[family-name:var(--font-display)] text-5xl font-bold">{t("teamPrice")}</p>
            <p className="mt-4 text-[var(--muted)]">{t("teamDesc")}</p>
            <span className="mt-8 inline-flex cursor-not-allowed rounded-full border border-[var(--card-border)] px-6 py-2.5 text-sm font-semibold text-[var(--muted)]">
              {t("teamCta")}
            </span>
          </div>
        </div>
        <p className="mt-10 text-sm text-[var(--muted)]">{t("note")}</p>
      </div>
    </MarketingShell>
  );
}
