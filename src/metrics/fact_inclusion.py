"""Fact Inclusion Rate metric."""

from __future__ import annotations

import re

from rapidfuzz import fuzz

SALIENT_TOKEN_RE = re.compile(
    r"\b\d+(?:\.\d+)?%?\b|\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b|\b[A-Z]{2,}\b"
)


def _salient_tokens(text: str) -> list[str]:
    return [m.group(0) for m in SALIENT_TOKEN_RE.finditer(text)]


def _fact_included(fact: str, email: str) -> bool:
    fact_cf = fact.casefold()
    email_cf = email.casefold()

    fuzzy_score = fuzz.token_set_ratio(fact_cf, email_cf)
    if fuzzy_score >= 70:
        return True

    tokens = _salient_tokens(fact)
    if not tokens:
        return False

    return all(token.casefold() in email_cf for token in tokens)


def score_fact_inclusion(key_facts: list[str], email: str) -> float:
    if not key_facts:
        return 0.0
    if not email.strip():
        return 0.0

    included = sum(1 for fact in key_facts if _fact_included(fact, email))
    return included / len(key_facts)
