"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine, ISourceOptions } from "@tsparticles/engine";

async function initEngine(engine: Engine) {
  await loadSlim(engine);
}

function SpaceParticles() {
  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      detectRetina: true,
      interactivity: {
        events: {
          onHover: { enable: true, mode: "grab" },
          onClick: { enable: true, mode: "push" },
        },
        modes: {
          grab: { distance: 140, links: { opacity: 0.55 } },
          push: { quantity: 2 },
        },
      },
      particles: {
        number: { value: 70, density: { enable: true } },
        color: { value: ["#e2e8f0", "#93c5fd", "#67e8f9"] },
        links: {
          enable: true,
          distance: 130,
          color: "#cbd5e1",
          opacity: 0.35,
          width: 1,
        },
        move: {
          enable: true,
          speed: 0.55,
          outModes: { default: "out" },
        },
        opacity: { value: { min: 0.25, max: 0.9 } },
        size: { value: { min: 1, max: 2.4 } },
        shape: { type: "circle" },
      },
    }),
    [],
  );

  return (
    <Particles
      id="mailchamp-space"
      className="pointer-events-auto absolute inset-0 h-full w-full"
      options={options}
    />
  );
}

export function ParticlesBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // SSR + first client paint must match (null) to avoid hydration mismatch.
  if (!mounted || reduceMotion || resolvedTheme !== "dark") return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0b1224_0%,#050814_70%)]" />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.55), transparent), radial-gradient(1px 1px at 80px 120px, rgba(186,230,253,0.45), transparent), radial-gradient(1.5px 1.5px at 160px 80px, rgba(255,255,255,0.35), transparent)",
          backgroundSize: "200px 200px",
        }}
      />
      <ParticlesProvider init={initEngine}>
        <SpaceParticles />
      </ParticlesProvider>
    </div>
  );
}
