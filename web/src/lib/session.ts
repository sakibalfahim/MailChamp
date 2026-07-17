import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
  }
  return session!;
}
