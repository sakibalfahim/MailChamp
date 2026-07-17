"use client";

import { Suspense } from "react";
import { MailShell } from "@/components/mail-shell";

function MailPageInner() {
  return <MailShell />;
}

export default function MailPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-gray-500">Loading mail…</div>}>
      <MailPageInner />
    </Suspense>
  );
}
