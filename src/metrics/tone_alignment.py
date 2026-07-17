"""Tone Alignment Score metric (LLM-as-a-Judge)."""

from __future__ import annotations

import json
import re
from pathlib import Path

from src.client import generate_text, load_config

ROOT = Path(__file__).resolve().parents[2]


def _load_judge_prompt() -> str:
    path = ROOT / load_config()["paths"]["prompts"]["judge_tone"]
    return path.read_text(encoding="utf-8")


def _parse_judge_response(text: str) -> float:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

    data = json.loads(text)
    score = float(data["score"])
    return max(0.0, min(1.0, score))


def score_tone_alignment(target_tone: str, email: str) -> float:
    if not email.strip():
        return 0.0

    template = _load_judge_prompt()
    prompt = (
        template.replace("{{TONE}}", target_tone).replace("{{EMAIL}}", email)
    )

    cfg = load_config()
    for attempt in range(2):
        try:
            raw = generate_text(prompt, temperature=float(cfg["temperature_judge"]))
            return _parse_judge_response(raw)
        except (json.JSONDecodeError, KeyError, TypeError, ValueError):
            if attempt == 1:
                return 0.0
        except Exception:
            if attempt == 1:
                return 0.0
    return 0.0
