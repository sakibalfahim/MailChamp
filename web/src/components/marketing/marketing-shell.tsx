import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { ParticlesBackground } from "./particles-background";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
      <ParticlesBackground />
      <div className="mc-gradient-bg relative z-10 min-h-screen">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
