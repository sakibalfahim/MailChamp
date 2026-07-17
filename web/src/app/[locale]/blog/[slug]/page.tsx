import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { getPost, posts } from "@/content/blog/posts";
import { Link } from "@/i18n/navigation";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = getPost(slug);
  if (!post) notFound();
  const t = await getTranslations("blog");

  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-5 py-16">
        <Link href="/blog" className="text-sm text-[var(--primary)]">
          ← {t("title")}
        </Link>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-bold">{post.title}</h1>
        {locale !== "en" && (
          <p className="mt-3 text-sm text-[var(--muted)]">{t("englishOnly")}</p>
        )}
        <div className="prose mt-8 max-w-none whitespace-pre-wrap text-[var(--foreground)] leading-relaxed">
          {post.body}
        </div>
      </article>
    </MarketingShell>
  );
}
