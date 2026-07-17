import { setRequestLocale, getTranslations } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export default async function DocsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("docs");

  const sections = [
    { title: t("gettingStarted"), body: t("gettingStartedBody") },
    { title: t("folders"), body: t("foldersBody") },
    { title: t("api"), body: t("apiBody") },
    { title: t("prompts"), body: t("promptsBody") },
  ];

  return (
    <MarketingShell>
      <div className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">{t("title")}</h1>
        <p className="mt-3 text-[var(--muted)]">{t("subtitle")}</p>
        <div className="mt-12 space-y-8">
          {sections.map((s) => (
            <section key={s.title} className="mc-panel rounded-2xl p-6">
              <h2 className="text-xl font-semibold">{s.title}</h2>
              <p className="mt-3 leading-relaxed text-[var(--muted)]">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </MarketingShell>
  );
}
