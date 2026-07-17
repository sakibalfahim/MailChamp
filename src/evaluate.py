"""Evaluation runner: score generations and write JSON/CSV reports."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd

from src.client import load_config
from src.metrics.fact_inclusion import score_fact_inclusion
from src.metrics.professional_conciseness import score_professional_conciseness
from src.metrics.tone_alignment import score_tone_alignment

ROOT = Path(__file__).resolve().parents[1]

METRIC_DEFINITIONS = {
    "fact_inclusion": {
        "name": "Fact Inclusion Rate",
        "focus": "Whether every required key fact appears in the generated email.",
        "logic": (
            "For each key fact, compute rapidfuzz token_set_ratio against the email (casefold). "
            "A fact counts as included if score >= 70 OR all salient tokens (numbers, proper names, "
            "acronyms) from the fact appear in the email. Metric = included_facts / total_facts."
        ),
        "automated": True,
        "llm_judge": False,
    },
    "tone_alignment": {
        "name": "Tone Alignment Score",
        "focus": "Whether the email matches the requested tone.",
        "logic": (
            "LLM-as-a-Judge (Gemini, temperature=0) using prompts/judge_tone.md. "
            "Judge returns JSON {\"score\": 0-1, \"rationale\": ...} scoring tone only. "
            "Parse failures retry once, else score 0.0."
        ),
        "automated": True,
        "llm_judge": True,
    },
    "professional_conciseness": {
        "name": "Professional Conciseness",
        "focus": "Tight, well-formed professional email structure and length.",
        "logic": (
            "Hybrid heuristic (no LLM): structure checks (subject, greeting, body, CTA, sign-off) "
            "weighted 0.4; length fit vs human reference word count weighted 0.4; density band "
            "(40-120 words with CTA) weighted 0.2. Final clipped to [0,1]."
        ),
        "automated": True,
        "llm_judge": False,
    },
}


def load_scenarios() -> list[dict[str, Any]]:
    cfg = load_config()
    path = ROOT / cfg["paths"]["scenarios"]
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def _configured_model() -> str:
    return str(load_config()["model"])


def _generation_model() -> str:
    """Prefer the model recorded during batch generation over judge-session state."""
    cfg = load_config()
    index_path = ROOT / cfg["paths"]["generations"] / "index.json"
    if index_path.exists():
        try:
            data = json.loads(index_path.read_text(encoding="utf-8"))
            model = data.get("model")
            if isinstance(model, str) and model.strip():
                return model.strip()
        except (json.JSONDecodeError, OSError):
            pass
    return _configured_model()


def _read_generation(strategy: str, scenario_id: str) -> str:
    cfg = load_config()
    path = ROOT / cfg["paths"]["generations"] / strategy / f"{scenario_id}.txt"
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def _assert_generations_ready(scenarios: list[dict[str, Any]], strategies: list[str]) -> None:
    """Fail fast if batch output is missing, empty, or recorded errors."""
    cfg = load_config()
    gen_root = ROOT / cfg["paths"]["generations"]
    index_path = gen_root / "index.json"
    problems: list[str] = []

    if not index_path.exists():
        problems.append(
            f"Missing {index_path.relative_to(ROOT)} — run `python -m src.generate --batch` first."
        )
    else:
        try:
            index = json.loads(index_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            problems.append(f"Invalid generations index JSON: {exc}")
            index = None

        if isinstance(index, dict):
            for item in index.get("items", []):
                err = item.get("error")
                if err:
                    problems.append(
                        f"Generation error recorded for {item.get('strategy')}/"
                        f"{item.get('scenario_id')}: {err}"
                    )

    for strategy in strategies:
        for scenario in scenarios:
            sid = scenario["id"]
            path = gen_root / strategy / f"{sid}.txt"
            rel = path.relative_to(ROOT).as_posix()
            if not path.exists():
                problems.append(f"Missing generation file: {rel}")
            elif not path.read_text(encoding="utf-8").strip():
                problems.append(f"Empty generation file: {rel}")

    if problems:
        print("Evaluation aborted — generation inputs are not ready:", file=sys.stderr)
        for problem in problems:
            print(f"  - {problem}", file=sys.stderr)
        raise SystemExit(1)


def _build_analysis(report: dict[str, Any]) -> str:
    summary = report["strategy_summary"]
    winner = report["winner"]
    loser = "naive" if winner == "advanced" else "advanced"
    model = report.get("model") or _configured_model()

    winner_avg = summary[winner]["overall_avg"]
    loser_avg = summary[loser]["overall_avg"]

    loser_metrics = summary[loser]
    winner_metrics = summary[winner]
    dips: list[str] = []
    for key in (
        "fact_inclusion_avg",
        "tone_alignment_avg",
        "professional_conciseness_avg",
    ):
        gap = winner_metrics[key] - loser_metrics[key]
        if gap > 0:
            label = key.replace("_avg", "").replace("_", " ")
            dips.append(f"{label} (-{gap:.3f})")

    failure = dips[0] if dips else "lower overall consistency across scenarios"
    dip_text = ", ".join(dips) if dips else failure

    return f"""### Which strategy performed better?

**{winner}** won with an overall average of **{winner_avg:.3f}** vs **{loser_avg:.3f}** for {loser}.

| Strategy | Fact Inclusion | Tone Alignment | Professional Conciseness | Overall |
|----------|----------------|----------------|--------------------------|---------|
| advanced | {summary['advanced']['fact_inclusion_avg']:.3f} | {summary['advanced']['tone_alignment_avg']:.3f} | {summary['advanced']['professional_conciseness_avg']:.3f} | {summary['advanced']['overall_avg']:.3f} |
| naive | {summary['naive']['fact_inclusion_avg']:.3f} | {summary['naive']['tone_alignment_avg']:.3f} | {summary['naive']['professional_conciseness_avg']:.3f} | {summary['naive']['overall_avg']:.3f} |

### Biggest failure mode of the lower-performing strategy

{loser} underperformed most on: **{dip_text}**. Without role/few-shot/CoT guidance, the baseline prompt more often omits specific facts or drifts in tone under multi-fact scenarios.

### Production recommendation

Use **{winner} prompting** on free Gemini (`{model}`). It delivers higher scores on our custom metrics while staying on the zero-cost AI Studio tier (no billing enabled).
"""


def _summary_table(summary: dict[str, Any]) -> str:
    return (
        "| Strategy | Fact Inclusion (avg) | Tone Alignment (avg) "
        "| Professional Conciseness (avg) | Overall (avg) |\n"
        "|----------|---------------------|----------------------|"
        "-------------------------------|---------------|\n"
        f"| advanced | {summary['advanced']['fact_inclusion_avg']:.3f} | "
        f"{summary['advanced']['tone_alignment_avg']:.3f} | "
        f"{summary['advanced']['professional_conciseness_avg']:.3f} | "
        f"{summary['advanced']['overall_avg']:.3f} |\n"
        f"| naive | {summary['naive']['fact_inclusion_avg']:.3f} | "
        f"{summary['naive']['tone_alignment_avg']:.3f} | "
        f"{summary['naive']['professional_conciseness_avg']:.3f} | "
        f"{summary['naive']['overall_avg']:.3f} |"
    )


def _update_final_report(report: dict[str, Any]) -> None:
    report_path = ROOT / "docs" / "final_report.md"
    template = report_path.read_text(encoding="utf-8")
    table = _summary_table(report["strategy_summary"])
    analysis = _build_analysis(report)

    start = template.index("| Strategy | Fact Inclusion (avg) |")
    end = template.index("\n\n---\n\n## 4. Comparative analysis")
    template = template[:start] + table + template[end:]

    sec_start = template.index("## 4. Comparative analysis")
    sec_end = template.index("\n\n---\n\n## Export to PDF")
    template = (
        template[:sec_start]
        + "## 4. Comparative analysis\n\n"
        + analysis
        + template[sec_end:]
    )

    report_path.write_text(template, encoding="utf-8")
    print(f"Updated {report_path}")


def run_evaluation() -> dict[str, Any]:
    cfg = load_config()
    scenarios = load_scenarios()
    strategies = cfg["strategies"]

    _assert_generations_ready(scenarios, strategies)

    rows: list[dict[str, Any]] = []

    for strategy in strategies:
        for scenario in scenarios:
            sid = scenario["id"]
            email = _read_generation(strategy, sid)

            fact = score_fact_inclusion(scenario["key_facts"], email)
            tone = score_tone_alignment(scenario["tone"], email)
            concise = score_professional_conciseness(email, scenario["human_reference"])
            mean_score = (fact + tone + concise) / 3.0

            rows.append(
                {
                    "scenario_id": sid,
                    "strategy": strategy,
                    "fact_inclusion": round(fact, 4),
                    "tone_alignment": round(tone, 4),
                    "professional_conciseness": round(concise, 4),
                    "mean": round(mean_score, 4),
                }
            )
            print(f"Scored {strategy} / {sid}: mean={mean_score:.3f}")

    df = pd.DataFrame(rows)

    strategy_summary: dict[str, Any] = {}
    for strategy in strategies:
        subset = df[df["strategy"] == strategy]
        strategy_summary[strategy] = {
            "fact_inclusion_avg": round(float(subset["fact_inclusion"].mean()), 4),
            "tone_alignment_avg": round(float(subset["tone_alignment"].mean()), 4),
            "professional_conciseness_avg": round(
                float(subset["professional_conciseness"].mean()), 4
            ),
            "overall_avg": round(float(subset["mean"].mean()), 4),
        }

    winner = max(
        strategies,
        key=lambda s: strategy_summary[s]["overall_avg"],
    )

    report: dict[str, Any] = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "model": _generation_model(),
        "metric_definitions": METRIC_DEFINITIONS,
        "raw_scores": rows,
        "strategy_summary": strategy_summary,
        "winner": winner,
        "overall_average_all": round(float(df["mean"].mean()), 4),
    }

    results_dir = ROOT / cfg["paths"]["results"]
    results_dir.mkdir(parents=True, exist_ok=True)

    json_path = results_dir / "evaluation_report.json"
    csv_path = results_dir / "evaluation_report.csv"

    json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    df.to_csv(csv_path, index=False)

    print(f"Wrote {json_path}")
    print(f"Wrote {csv_path}")
    print(f"Winner: {winner} (overall_avg={strategy_summary[winner]['overall_avg']})")
    _update_final_report(report)
    return report


def main() -> None:
    run_evaluation()


if __name__ == "__main__":
    main()
