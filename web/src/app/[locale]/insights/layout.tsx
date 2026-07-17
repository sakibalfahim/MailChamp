import { requireSession } from "@/lib/session";

export default async function InsightsLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return <>{children}</>;
}
