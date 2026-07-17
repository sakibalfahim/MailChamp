import { setRequestLocale, getTranslations } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <MarketingShell>
      <div className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">{t("title")}</h1>
        <div className="mt-8 space-y-5 text-lg leading-relaxed text-[var(--muted)]">
          <p>{t("body1")}</p>
          <p>{t("body2")}</p>
          <p>{t("body3")}</p>
        </div>
      </div>
    </MarketingShell>
  );
}
