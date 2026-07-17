"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Archive, BarChart3, Inbox, Mail, PenSquare, Send } from "lucide-react";

export function MailSidebar({ folder }: { folder: string }) {
  const t = useTranslations("mail");
  const pathname = usePathname();

  const nav = [
    { href: "/mail" as const, label: t("allMail"), icon: Mail, folder: "all" },
    { href: "/mail?folder=drafts" as const, label: t("drafts"), icon: Inbox, folder: "drafts" },
    { href: "/mail?folder=sent" as const, label: t("sent"), icon: Send, folder: "sent" },
    { href: "/mail?folder=archive" as const, label: t("archive"), icon: Archive, folder: "archive" },
  ];

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-e border-[var(--card-border)] bg-[var(--mail-list)]">
      <div className="p-3">
        <Link
          href="/mail/compose"
          className="flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--primary)_22%,transparent)] px-4 py-3 text-sm font-medium text-[var(--foreground)] shadow-sm hover:bg-[color-mix(in_srgb,var(--primary)_32%,transparent)]"
        >
          <PenSquare className="h-4 w-4" />
          {t("compose")}
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 px-2">
        {nav.map((item) => {
          const active = pathname.startsWith("/mail") && folder === item.folder;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-e-full px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]",
                active && "bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] font-medium",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/insights"
          className={cn(
            "flex items-center gap-3 rounded-e-full px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]",
            pathname === "/insights" && "bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] font-medium",
          )}
        >
          <BarChart3 className="h-4 w-4 shrink-0" />
          {t("insights")}
        </Link>
      </nav>
    </aside>
  );
}
