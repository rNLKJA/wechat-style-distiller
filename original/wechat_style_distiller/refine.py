"""Stage 6 — self-critique: auto-tune the persona prompt against the score.

Closed feedback loop: generate replies → score them → find the features that
drift most from you → append targeted, *evidence-cited* corrections to the
prompt → repeat until the score plateaus or clears the threshold.

Every correction names the measured gap (target vs. observed), so the tuning is
transparent and falsifiable rather than vibes — you can see exactly why each
rule was added.

The generation step needs ANTHROPIC_API_KEY; the correction logic is pure and
unit-tested offline.
"""
from __future__ import annotations

import re
from pathlib import Path

from .evaluate import (
    DEFAULT_PROBES, target_fingerprint, fingerprint, alignment_score, generate_replies,
)

_CALIB_HEADER = "## Calibration (auto-tuned from measured gaps)"


def _pct(x: float) -> str:
    return f"{x*100:.0f}%"


def corrective_rules(target: dict, candidate: dict, threshold_pct: float = 85.0) -> list[str]:
    """One corrective, gap-citing instruction per feature scoring below threshold."""
    score = alignment_score(candidate, target)["by_feature"]
    out: list[str] = []
    for feat, sim in score.items():
        if sim >= threshold_pct:
            continue
        tgt, cand = target.get(feat, 0.0), candidate.get(feat, 0.0)
        too_high = cand > tgt
        if feat == "median_len":
            out.append(
                f"Replies are running {'long' if too_high else 'too terse'} "
                f"(median ~{cand:.0f} chars vs your ~{tgt:.0f}). "
                f"{'Cut them shorter.' if too_high else 'Let them run a little longer.'}"
            )
        elif feat == "p90_len":
            out.append(
                f"Your longest replies are {'overshooting' if too_high else 'too clipped'} "
                f"(p90 ~{cand:.0f} vs ~{tgt:.0f}). "
                f"{'Cap the long ones.' if too_high else 'Allow the odd longer one.'}"
            )
        elif feat == "emoji_per_turn":
            out.append(
                f"{'Ease off' if too_high else 'Use a few more'} emoji/faces "
                f"(~{cand:.2f}/msg vs your ~{tgt:.2f})."
            )
        elif feat == "laughter_per_turn":
            out.append(
                f"{'Less' if too_high else 'More'} laughter (哈哈 / 233 / hhh) "
                f"(~{cand:.2f}/msg vs ~{tgt:.2f})."
            )
        elif feat == "latin_share":
            out.append(
                f"{'Lean less on English; more Chinese' if too_high else 'Mix in more English/tech terms'} "
                f"({_pct(cand)} of words vs your {_pct(tgt)})."
            )
        elif feat == "multi_bubble_share":
            out.append(
                f"{'Consolidate into fewer bubbles' if too_high else 'Break into multiple short bubbles more often'} "
                f"({_pct(cand)} multi-bubble vs your {_pct(tgt)})."
            )
        elif feat == "end_punct_drop_rate":
            out.append(
                f"{'Use end punctuation a bit more' if too_high else 'Drop end punctuation more often'} "
                f"(you skip it {_pct(tgt)} of the time; replies are at {_pct(cand)})."
            )
    return out


def apply_corrections(prompt: str, corrections: list[str]) -> str:
    """Insert/replace the calibration section. Idempotent (one section, latest wins)."""
    # strip any existing calibration block (header up to the next "## " or EOF)
    prompt = re.sub(
        re.escape(_CALIB_HEADER) + r".*?(?=\n## |\Z)", "", prompt, flags=re.DOTALL
    ).rstrip()
    if not corrections:
        return prompt
    block = _CALIB_HEADER + "\n" + "\n".join(f"- {c}" for c in corrections)
    # place it just before the final "## Now" if present, else append
    marker = "\n## Now"
    if marker in prompt:
        head, _, tail = prompt.partition(marker)
        return f"{head.rstrip()}\n\n{block}\n{marker}{tail}"
    return f"{prompt}\n\n{block}\n"


def auto_tune(
    persona_path: str | Path, stats: dict, probes: list[str] | None = None,
    rounds: int = 3, threshold: float = 85.0, model: str = "claude-opus-4-8",
) -> tuple[str | None, list[float]]:
    """Iteratively tune the prompt. Returns (final_prompt, score_history).

    Returns (None, []) if generation isn't available (no API key / package).
    """
    probes = probes or DEFAULT_PROBES
    target = target_fingerprint(stats)
    prompt = Path(persona_path).read_text(encoding="utf-8")
    history: list[float] = []

    for _ in range(max(1, rounds)):
        replies = generate_replies(prompt, probes, model=model)
        if replies is None:
            return None, history
        cand = fingerprint(replies)
        score = alignment_score(cand, target)["overall"]
        history.append(score)
        if score >= threshold:
            break
        corrections = corrective_rules(target, cand, threshold)
        if not corrections:
            break
        prompt = apply_corrections(prompt, corrections)
    return prompt, history
