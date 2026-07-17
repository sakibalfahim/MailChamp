"""Email generation: one-shot CLI and batch evaluation mode."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from src.client import generate_text, get_active_model, load_config

ROOT = Path(__file__).resolve().parents[1]


def _read_prompt(strategy: str) -> str:
    cfg = load_config()
    rel = cfg["paths"]["prompts"][strategy]
    return (ROOT / rel).read_text(encoding="utf-8")


def _format_facts(facts: list[str]) -> str:
    return "\n".join(f"- {fact}" for fact in facts)


def render_prompt(strategy: str, intent: str, facts: list[str], tone: str) -> str:
    template = _read_prompt(strategy)
    return (
        template.replace("{{INTENT}}", intent)
        .replace("{{FACTS}}", _format_facts(facts))
        .replace("{{TONE}}", tone)
    )


def extract_email(raw: str, strategy: str) -> str:
    if strategy == "advanced":
        match = re.search(r"<email>\s*(.*?)\s*</email>", raw, flags=re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return raw.strip()


def load_scenarios() -> list[dict[str, Any]]:
    cfg = load_config()
    path = ROOT / cfg["paths"]["scenarios"]
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def generate_one(
    intent: str,
    facts: list[str],
    tone: str,
    strategy: str = "advanced",
) -> str:
    cfg = load_config()
    prompt = render_prompt(strategy, intent, facts, tone)
    raw = generate_text(prompt, temperature=float(cfg["temperature_generate"]))
    return extract_email(raw, strategy)


def run_batch() -> dict[str, Any]:
    cfg = load_config()
    scenarios = load_scenarios()
    strategies = cfg["strategies"]
    gen_root = ROOT / cfg["paths"]["generations"]
    gen_root.mkdir(parents=True, exist_ok=True)

    index: dict[str, Any] = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "model": None,
        "items": [],
    }

    total = len(scenarios) * len(strategies)
    done = 0
    failures: list[str] = []

    for strategy in strategies:
        out_dir = gen_root / strategy
        out_dir.mkdir(parents=True, exist_ok=True)

        for scenario in scenarios:
            sid = scenario["id"]
            out_path = out_dir / f"{sid}.txt"
            item: dict[str, Any] = {
                "scenario_id": sid,
                "strategy": strategy,
                "path": str(out_path.relative_to(ROOT)).replace("\\", "/"),
                "error": None,
            }

            try:
                email = generate_one(
                    intent=scenario["intent"],
                    facts=scenario["key_facts"],
                    tone=scenario["tone"],
                    strategy=strategy,
                )
                if not email.strip():
                    raise RuntimeError("Model returned an empty email")
                out_path.write_text(email, encoding="utf-8")
                item["chars"] = len(email)
            except Exception as exc:  # noqa: BLE001
                item["error"] = str(exc)
                failures.append(f"{strategy}/{sid}: {exc}")
                # Do not overwrite a prior good file with empty content on failure.
                if not out_path.exists():
                    out_path.write_text("", encoding="utf-8")

            index["items"].append(item)
            done += 1
            status = "FAIL" if item["error"] else "ok"
            print(f"[{done}/{total}] {strategy} scenario {sid} ({status})", flush=True)

    index["model"] = get_active_model()
    index_path = gen_root / "index.json"
    index_path.write_text(json.dumps(index, indent=2), encoding="utf-8")
    print(f"Wrote generations index to {index_path}")

    if failures:
        print("Batch generation finished with errors:", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        raise SystemExit(1)

    return index


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate professional emails")
    parser.add_argument("--batch", action="store_true", help="Run all 10 scenarios x strategies")
    parser.add_argument("--intent", type=str, help="Email intent (one-shot mode)")
    parser.add_argument("--facts", type=str, help="Semicolon-separated key facts")
    parser.add_argument("--tone", type=str, help="Desired tone")
    parser.add_argument(
        "--strategy",
        type=str,
        default="advanced",
        choices=["advanced", "naive"],
        help="Prompting strategy (default: advanced)",
    )
    args = parser.parse_args()

    if args.batch:
        run_batch()
        return

    if not args.intent or not args.facts or not args.tone:
        parser.error("One-shot mode requires --intent, --facts, and --tone (or use --batch)")

    facts = [f.strip() for f in args.facts.split(";") if f.strip()]
    email = generate_one(args.intent, facts, args.tone, strategy=args.strategy)
    print(email)


if __name__ == "__main__":
    main()
