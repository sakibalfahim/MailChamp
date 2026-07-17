"""Gemini API client with rate limiting, retries, and model fallback."""

from __future__ import annotations

import os
import re
import time
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv
from google import genai
from google.genai import types

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config.yaml"

_last_request_at: float = 0.0
_active_model: str | None = None


def load_config() -> dict[str, Any]:
    with CONFIG_PATH.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_api_key() -> str:
    load_dotenv(ROOT / ".env")
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key:
        raise RuntimeError(
            "GEMINI_API_KEY is missing. Copy .env.example to .env and add your free "
            "Gemini API key from https://aistudio.google.com (do not enable billing)."
        )
    return key


def get_client() -> genai.Client:
    return genai.Client(api_key=get_api_key())


def get_active_model() -> str:
    global _active_model
    if _active_model is None:
        _active_model = load_config()["model"]
    return _active_model


def _throttle() -> None:
    global _last_request_at
    delay = float(load_config().get("request_delay_seconds", 15))
    elapsed = time.time() - _last_request_at
    if elapsed < delay:
        time.sleep(delay - elapsed)
    _last_request_at = time.time()


def _candidate_models() -> list[str]:
    cfg = load_config()
    primary = cfg["model"]
    fallbacks = cfg.get("model_fallbacks", [])
    seen: set[str] = set()
    ordered: list[str] = []
    for model in [primary, *fallbacks]:
        if model not in seen:
            seen.add(model)
            ordered.append(model)
    return ordered


def _retry_sleep_seconds(exc: Exception, attempt: int, backoff: list[int]) -> float:
    msg = str(exc)
    match = re.search(r"retry in ([0-9]+(?:\.[0-9]+)?)s", msg, flags=re.IGNORECASE)
    if match:
        return float(match.group(1)) + 1.0
    return float(backoff[min(attempt, len(backoff) - 1)])


def generate_text(prompt: str, temperature: float) -> str:
    """Generate text with throttling, retries, and model fallback."""
    global _active_model

    cfg = load_config()
    client = get_client()
    max_retries = int(cfg.get("max_retries", 3))
    backoff = [8, 20, 40, 60, 90, 120]

    models = _candidate_models()
    last_error: Exception | None = None

    for model in models:
        for attempt in range(max_retries):
            try:
                _throttle()
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=temperature),
                )
                _active_model = model
                text = (response.text or "").strip()
                if not text:
                    raise RuntimeError("Empty response from Gemini")
                return text
            except Exception as exc:  # noqa: BLE001 - retry on API errors
                last_error = exc
                err = str(exc).lower()
                if "404" in err or "not found" in err or "not_found" in err:
                    break
                if "429" in err or "rate" in err or "quota" in err or "503" in err or "unavailable" in err:
                    if attempt < max_retries - 1:
                        time.sleep(_retry_sleep_seconds(exc, attempt, backoff))
                        continue
                if attempt < max_retries - 1:
                    time.sleep(_retry_sleep_seconds(exc, attempt, backoff))
                    continue
                break

    raise RuntimeError(f"Gemini generation failed after retries: {last_error}")
