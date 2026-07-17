"use client";

import { useLayoutEffect, type ReactNode } from "react";

/** Keep <html lang/dir> in sync when locale changes (html lives in root layout). */
export function LocaleDocumentAttrs({
  locale,
  dir,
  children,
}: {
  locale: string;
  dir: "ltr" | "rtl";
  children: ReactNode;
}) {
  useLayoutEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return children;
}
