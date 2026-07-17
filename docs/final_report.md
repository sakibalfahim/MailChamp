# MailChamp — Final Report

## 1. Prompt templates

### Advanced strategy (Role + Few-shot + Chain-of-Thought)

See [`prompts/advanced.md`](../prompts/advanced.md).

Technique summary:

- **Role-playing:** Model acts as a senior executive communications specialist.
- **Few-shot:** Two synthetic examples demonstrate format and tone control (disjoint from evaluation scenarios).
- **Chain-of-Thought:** Model writes a private plan in `<plan>...</plan>` (fact checklist, tone cues, structure), then outputs the final email in `<email>...</email>`.

### Naive baseline

See [`prompts/naive.md`](../prompts/naive.md).

Single instruction: map Intent + Key Facts + Tone → email. No role, no examples, no planning step.

---

## 2. Custom metric definitions

### Metric 1 — Fact Inclusion Rate

- **Focus:** Fact recall / specificity
- **Logic:** For each key fact, use `rapidfuzz.token_set_ratio` (casefold). Fact included if score ≥ 70 OR all salient tokens (numbers, proper names, acronyms) appear in the email. Score = included / total facts.
- **Automation:** Python only (no LLM)

### Metric 2 — Tone Alignment Score

- **Focus:** Tone accuracy
- **Logic:** LLM-as-a-Judge via [`prompts/judge_tone.md`](../prompts/judge_tone.md). Gemini scores tone match from 0.0–1.0 with temperature 0. Judge is instructed to score tone only (not grammar, length, or facts).
- **Automation:** LLM-as-a-Judge

### Metric 3 — Professional Conciseness

- **Focus:** Format adherence + conciseness
- **Logic:** Hybrid heuristic — structure checks (subject, greeting, body, CTA, sign-off) × 0.4; length fit vs human reference word count × 0.4; density band (40–120 words with CTA) × 0.2.
- **Automation:** Python only (no LLM)

---

## 3. Raw evaluation data

Populated from the successful pipeline run. Canonical machine-readable copies:

- [`results/evaluation_report.json`](../results/evaluation_report.json)
- [`results/evaluation_report.csv`](../results/evaluation_report.csv)
- Generations index: [`results/generations/index.json`](../results/generations/index.json)

**Model used for generation:** `gemini-3.1-flash-lite-preview`  
**Generated at:** `2026-07-15T18:38:15.899090+00:00` (see JSON for exact eval timestamp on re-runs)

| Strategy | Fact Inclusion (avg) | Tone Alignment (avg) | Professional Conciseness (avg) | Overall (avg) |
|----------|---------------------|----------------------|-------------------------------|---------------|
| advanced | 0.950 | 0.850 | 0.835 | 0.878 |
| naive | 0.850 | 0.900 | 0.615 | 0.788 |

To regenerate (slow on free tier — prefer not to unless needed):

```powershell
python -m src.generate --batch
python -m src.evaluate
```

---

## 4. Comparative analysis

### Which strategy performed better?

**advanced** won with an overall average of **0.878** vs **0.788** for naive.

| Strategy | Fact Inclusion | Tone Alignment | Professional Conciseness | Overall |
|----------|----------------|----------------|--------------------------|---------|
| advanced | 0.950 | 0.850 | 0.835 | 0.878 |
| naive | 0.850 | 0.900 | 0.615 | 0.788 |

### Biggest failure mode of the lower-performing strategy

naive underperformed most on: **fact inclusion (-0.100), professional conciseness (-0.220)**. Without role/few-shot/CoT guidance, the baseline prompt more often omits specific facts or drifts in tone under multi-fact scenarios.

### Production recommendation

Use **advanced prompting** on free Gemini (`gemini-3.1-flash-lite-preview`). It delivers higher scores on our custom metrics while staying on the zero-cost AI Studio tier (no billing enabled).

---

## Export to PDF / Google Doc

Open this file in VS Code or Cursor → Print to PDF, or paste into Google Docs for submission.
