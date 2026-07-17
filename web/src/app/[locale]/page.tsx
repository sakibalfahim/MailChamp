import { setRequestLocale } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { LandingFeatures, LandingHero, LandingStory } from "@/components/marketing/landing-sections";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <MarketingShell>
      <LandingHero />
      <LandingStory />
      <LandingFeatures />
    </MarketingShell>
  );
}
