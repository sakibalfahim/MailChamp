import { defineRouting } from "next-intl/routing";

export const locales = ["en", "ar", "bn", "zh", "fr", "ru", "es"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  bn: "বাংলা",
  zh: "中文",
  fr: "Français",
  ru: "Русский",
  es: "Español",
};

export const rtlLocales: Locale[] = ["ar"];

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale: "en",
  localePrefix: "always",
});
