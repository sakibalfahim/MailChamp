import { setRequestLocale, getTranslations } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ContactForm } from "@/components/marketing/contact-form";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <MarketingShell>
      <div className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">{t("title")}</h1>
        <p className="mt-3 text-[var(--muted)]">{t("subtitle")}</p>
        <ContactForm />
      </div>
    </MarketingShell>
  );
}
