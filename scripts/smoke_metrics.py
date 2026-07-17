"""Quick offline validation of deterministic metrics."""
from pathlib import Path
import json

from src.metrics.fact_inclusion import score_fact_inclusion
from src.metrics.professional_conciseness import score_professional_conciseness

ROOT = Path(__file__).resolve().parents[1]
scenarios = json.loads((ROOT / "data" / "scenarios.json").read_text(encoding="utf-8"))
s = scenarios[0]
score = score_fact_inclusion(s["key_facts"], s["human_reference"])
concise = score_professional_conciseness(s["human_reference"], s["human_reference"])
print(f"fact_inclusion_reference={score:.3f}")
print(f"conciseness_self={concise:.3f}")
