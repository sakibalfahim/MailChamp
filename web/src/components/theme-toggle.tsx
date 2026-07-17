"use client";

import { useTheme } from "@/components/theme-provider";
import { useTranslations } from "next-intl";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const themes = [
  { id: "system" as const, icon: Monitor, labelKey: "themeSystem" as const },
  { id: "light" as const, icon: Sun, labelKey: "themeLight" as const },
  { id: "dark" as const, icon: Moon, labelKey: "themeDark" as const },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("nav");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-[var(--card-border)] bg-[var(--card)] p-0.5"
      role="group"
      aria-label={t("theme")}
    >
      {themes.map(({ id, icon: Icon, labelKey }) => {
        const active = mounted && theme === id;
        return (
          <button
            key={id}
            type="button"
            title={t(labelKey)}
            aria-label={t(labelKey)}
            aria-pressed={active}
            onClick={() => setTheme(id)}
            className={`rounded-full p-1.5 transition ${
              active
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
