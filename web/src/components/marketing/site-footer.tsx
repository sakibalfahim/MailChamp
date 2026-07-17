import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const n = await getTranslations("nav");

  return (
    <footer className="relative z-10 border-t border-[var(--card-border)] py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold">{t("rights")}</p>
          <p className="mt-1 max-w-md text-sm text-[var(--muted)]">{t("tagline")}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-[var(--muted)]">
          <Link href="/docs">{n("docs")}</Link>
          <Link href="/pricing">{n("pricing")}</Link>
          <Link href="/about">{n("about")}</Link>
          <Link href="/contact">{n("contact")}</Link>
        </div>
      </div>
    </footer>
  );
}
