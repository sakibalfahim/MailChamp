import { requireSession } from "@/lib/session";

export default async function MailLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return <>{children}</>;
}
