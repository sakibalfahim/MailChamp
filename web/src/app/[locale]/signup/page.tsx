import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { AuthForm } from "@/components/auth-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    redirect({ href: "/mail", locale });
  }

  const t = await getTranslations("auth");

  return (
    <div className="mc-gradient-bg flex min-h-screen items-center justify-center px-4">
      <div className="absolute end-4 top-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <div className="mc-panel w-full max-w-md rounded-2xl p-8">
        <Link href="/" className="font-[family-name:var(--font-display)] text-lg font-semibold hover:text-[var(--primary)]">
          MailChamp
        </Link>
        <h1 className="mt-6 text-2xl font-semibold">{t("signupTitle")}</h1>
        <div className="mt-6">
          <AuthForm mode="signup" />
        </div>
      </div>
    </div>
  );
}
