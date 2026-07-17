"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BarChart3, Mail, Sparkles } from "lucide-react";

export function LandingHero() {
  const t = useTranslations("landing");
  const reduce = useReducedMotion();

  return (
    <section className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-5 pb-16 pt-20">
      <motion.p
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]"
      >
        {t("eyebrow")}
      </motion.p>
      <motion.h1
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="mt-4 font-[family-name:var(--font-display)] text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl"
      >
        <span className="mc-gradient-text">{t("headline")}</span>
      </motion.h1>
      <motion.p
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.12 }}
        className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--muted)] sm:text-xl"
      >
        {t("subhead")}
      </motion.p>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-10 flex flex-wrap gap-3"
      >
        <Link
          href="/signup"
          className="rounded-full bg-[var(--primary)] px-8 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_-12px_var(--primary)] hover:bg-[var(--primary-hover)]"
        >
          {t("ctaPrimary")}
        </Link>
        <Link
          href="/insights"
          className="rounded-full border border-[var(--card-border)] bg-[var(--card)] px-8 py-3 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--primary)]"
        >
          {t("ctaSecondary")}
        </Link>
      </motion.div>
      <p className="mt-16 text-xs uppercase tracking-[0.25em] text-[var(--muted)]">{t("scrollHint")}</p>
    </section>
  );
}

export function LandingStory() {
  const t = useTranslations("landing");
  const reduce = useReducedMotion();
  const beats = [
    { title: t("story1Title"), body: t("story1Body") },
    { title: t("story2Title"), body: t("story2Body") },
    { title: t("story3Title"), body: t("story3Body") },
  ];

  return (
    <section className="mx-auto max-w-6xl space-y-24 px-5 py-24">
      {beats.map((beat, i) => (
        <motion.article
          key={beat.title}
          initial={reduce ? false : { opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, delay: i * 0.05 }}
          className="max-w-3xl"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">0{i + 1}</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            {beat.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[var(--muted)]">{beat.body}</p>
        </motion.article>
      ))}
    </section>
  );
}

export function LandingFeatures() {
  const t = useTranslations("landing");
  const items = [
    { icon: Sparkles, title: t("featureAi"), desc: t("featureAiDesc") },
    { icon: Mail, title: t("featureMail"), desc: t("featureMailDesc") },
    { icon: BarChart3, title: t("featureInsights"), desc: t("featureInsightsDesc") },
  ];

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-28 md:grid-cols-3">
      {items.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="mc-panel rounded-2xl p-6">
          <Icon className="h-6 w-6 text-[var(--primary)]" />
          <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
        </div>
      ))}
    </section>
  );
}
