import { setRequestLocale, getTranslations } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Link } from "@/i18n/navigation";
import { posts } from "@/content/blog/posts";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");

  return (
    <MarketingShell>
      <div className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">{t("title")}</h1>
        <p className="mt-3 text-[var(--muted)]">{t("subtitle")}</p>
        <ul className="mt-12 space-y-6">
          {posts.map((post) => (
            <li key={post.slug} className="mc-panel rounded-2xl p-6">
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{post.excerpt}</p>
              <div className="mt-4 flex items-center gap-3 text-sm">
                <Link href={`/blog/${post.slug}`} className="font-medium text-[var(--primary)]">
                  {t("readMore")}
                </Link>
                {locale !== "en" && (
                  <span className="text-xs text-[var(--muted)]">{t("englishOnly")}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </MarketingShell>
  );
}
