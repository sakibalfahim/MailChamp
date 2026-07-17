import { Suspense } from "react";
import { MailShell } from "@/components/mail-shell";

export default async function MailDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm">…</div>}>
      <MailShell initialId={id} />
    </Suspense>
  );
}
