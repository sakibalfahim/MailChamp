"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type EvalReport = {
  generated_at: string;
  model: string;
  metric_definitions: Record<string, { name: string; focus: string }>;
  raw_scores: Array<{
    scenario_id: string;
    strategy: string;
    fact_inclusion: number;
    tone_alignment: number;
    professional_conciseness: number;
    mean: number;
  }>;
  strategy_summary: Record<
    string,
    {
      fact_inclusion_avg: number;
      tone_alignment_avg: number;
      professional_conciseness_avg: number;
      overall_avg: number;
    }
  >;
  winner: string;
};

export default function InsightsPage() {
  const [report, setReport] = useState<EvalReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/insights/report")
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 401 ? "Sign in required" : "Report not found");
        return r.json();
      })
      .then(setReport)
      .catch((e) => setError(e.message));
  }, []);

  const chartData = report
    ? Object.entries(report.strategy_summary).map(([strategy, avg]) => ({
        strategy,
        mean: Number(avg.overall_avg.toFixed(4)),
        fact_inclusion: Number(avg.fact_inclusion_avg.toFixed(4)),
        tone_alignment: Number(avg.tone_alignment_avg.toFixed(4)),
        professional_conciseness: Number(avg.professional_conciseness_avg.toFixed(4)),
      }))
    : [];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--card-border)] bg-[var(--mail-chrome)] px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-xl font-medium">Insights</h1>
            <p className="text-sm text-[var(--muted)]">
              Python eval report — re-copy after re-running <code className="text-xs">src.evaluate</code>
            </p>
          </div>
          <Link href="/mail" className="text-sm text-[var(--primary)] hover:underline">
            ← Back to mail
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-8 p-6">
        {error && (
          <div className="rounded border border-red-300/40 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
            {error}. Copy <code>results/evaluation_report.json</code> →{" "}
            <code>web/src/content/evaluation_report.json</code>
          </div>
        )}
        {report && (
          <>
            <section className="mc-panel rounded-lg p-6">
              <h2 className="text-lg font-medium">Winner</h2>
              <p className="mt-2 text-3xl font-semibold capitalize text-[var(--primary)]">
                {report.winner}{" "}
                <span className="text-lg font-normal text-[var(--muted)]">
                  ({report.strategy_summary[report.winner]?.overall_avg.toFixed(4)} overall)
                </span>
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Model: {report.model} · Generated {new Date(report.generated_at).toLocaleString()}
              </p>
            </section>

            <section className="mc-panel rounded-lg p-6">
              <h2 className="mb-4 text-lg font-medium">Strategy comparison</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="strategy" />
                    <YAxis domain={[0, 1]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="mean" fill="#2563eb" name="Overall mean" />
                    <Bar dataKey="fact_inclusion" fill="#16a34a" name="Fact inclusion" />
                    <Bar dataKey="tone_alignment" fill="#ca8a04" name="Tone alignment" />
                    <Bar dataKey="professional_conciseness" fill="#dc2626" name="Conciseness" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="mc-panel rounded-lg p-6">
              <h2 className="mb-4 text-lg font-medium">Per-scenario scores</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--card-border)] text-[var(--muted)]">
                      <th className="py-2 pr-4">Scenario</th>
                      <th className="py-2 pr-4">Strategy</th>
                      <th className="py-2 pr-4">Facts</th>
                      <th className="py-2 pr-4">Tone</th>
                      <th className="py-2 pr-4">Concise</th>
                      <th className="py-2">Mean</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.raw_scores.map((row) => (
                      <tr key={`${row.scenario_id}-${row.strategy}`} className="border-b border-[var(--card-border)]">
                        <td className="py-2 pr-4">{row.scenario_id}</td>
                        <td className="py-2 pr-4 capitalize">{row.strategy}</td>
                        <td className="py-2 pr-4">{row.fact_inclusion.toFixed(3)}</td>
                        <td className="py-2 pr-4">{row.tone_alignment.toFixed(3)}</td>
                        <td className="py-2 pr-4">{row.professional_conciseness.toFixed(3)}</td>
                        <td className="py-2 font-medium">{row.mean.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mc-panel rounded-lg p-6">
              <h2 className="mb-3 text-lg font-medium">Metric definitions</h2>
              <dl className="space-y-3">
                {Object.entries(report.metric_definitions).map(([key, def]) => (
                  <div key={key}>
                    <dt className="font-medium">{def.name}</dt>
                    <dd className="text-sm text-[var(--muted)]">{def.focus}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
