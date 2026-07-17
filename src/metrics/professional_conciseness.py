"""Professional Conciseness metric (hybrid heuristics)."""

from __future__ import annotations

import re

CTA_CUES = (
    "please",
    "could you",
    "can you",
    "let me know",
    "confirm",
    "schedule",
    "reply",
    "asap",
    "send",
    "share",
    "review",
    "update",
)

SIGNOFF_CUES = (
    "regards",
    "thanks",
    "thank you",
    "best",
    "sincerely",
    "cheers",
    "warm regards",
    "kind regards",
)


def _word_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text))


def _has_subject(text: str) -> bool:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if not lines:
        return False
    first = lines[0]
    return first.lower().startswith("subject:") or len(first.split()) <= 12


def _has_greeting(text: str) -> bool:
    lowered = text.casefold()
    return any(
        cue in lowered
        for cue in ("dear ", "hi ", "hello ", "hey ", "greetings")
    )


def _has_body(text: str) -> bool:
    sentences = re.split(r"[.!?]+", text)
    sentences = [s.strip() for s in sentences if s.strip()]
    return len(sentences) >= 2 or _word_count(text) >= 40


def _has_cta(text: str) -> bool:
    lowered = text.casefold()
    return any(cue in lowered for cue in CTA_CUES)


def _has_signoff(text: str) -> bool:
    lowered = text.casefold()
    return any(cue in lowered for cue in SIGNOFF_CUES)


def score_professional_conciseness(email: str, human_reference: str) -> float:
    if not email.strip():
        return 0.0

    checks = [
        _has_subject(email),
        _has_greeting(email),
        _has_body(email),
        _has_cta(email),
        _has_signoff(email),
    ]
    structure = (sum(checks) / 5.0) * 0.4

    gen_words = _word_count(email)
    ref_words = max(_word_count(human_reference), 1)
    length_fit = max(0.0, 1.0 - abs(gen_words - ref_words) / ref_words) * 0.4

    has_cta = _has_cta(email)
    if 40 <= gen_words <= 120 and has_cta:
        density = 1.0
    elif has_cta:
        density = 0.5
    else:
        density = 0.0
    density *= 0.2

    return max(0.0, min(1.0, structure + length_fit + density))
