export const posts = [
  {
    slug: "advanced-vs-naive",
    title: "Advanced vs naive prompting: why 0.878 won",
    excerpt:
      "How our Python eval compared strategies and why MailChamp ships the advanced prompt by default.",
    body: `MailChamp began as a research CLI. We generated emails with advanced and naive prompts, then judged tone, clarity, and usefulness.

The advanced strategy scored **0.8783** against naive **0.7883** on \`gemini-3.1-flash-lite-preview\`. That gap is why the product defaults to advanced CoT + few-shot prompting — and why Insights still reads the same evaluation JSON.

We do not rewrite metrics in the web stack. The Python pipeline remains the source of truth.`,
  },
  {
    slug: "zero-dollar-stack",
    title: "Shipping enterprise polish on a $0 stack",
    excerpt:
      "Neon, Vercel Hobby, Render free Go, Gemini AI Studio — and the cold-start UX that makes it usable.",
    body: `Enterprise *style* does not require enterprise invoices. MailChamp runs on Neon Postgres, Next.js on Vercel Hobby, and a Go API on Render's free tier.

Cold starts are real (~30–50s on Render, plus Neon wake). Our client budgets **90s**, shows a wake banner, and retries once. That honesty is part of the product.

Rejected for this phase: Cloud Run and Fly.io (cards), TipTap Pro, and paid email providers.`,
  },
  {
    slug: "archive-not-inbox",
    title: "All Mail, not fake Inbox",
    excerpt:
      "We refused to invent receiving mail. The folders match what the app actually does.",
    body: `MailChamp is not a mail provider. There is no SMTP or IMAP in v1. “Sent” flips status. Archive and hard delete are real.

So the left rail is honest: **All Mail / Drafts / Sent / Archive**. Gmail-quality chrome without inbox fiction.`,
  },
] as const;

export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug);
}
