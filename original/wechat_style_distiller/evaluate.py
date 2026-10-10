"""Stage 5 — measure whether the persona prompt actually reproduces your voice.

"Aligned with my talking method" is a claim, and claims need evidence. This
module turns it into a number:

  1. fingerprint  — a compact vector of measurable style features
  2. score        — how close a set of candidate replies sits to your target
  3. markers      — whether your reasoning style (why / evidence) shows up

With ANTHROPIC_API_KEY set, `evaluate_prompt` generates replies to probe
messages and scores them. Without a key, the scorer still runs on any texts you
pass (e.g. your own held-out replies vs. a generic-assistant baseline), so the
harness is verifiable offline.
"""
from __future__ import annotations

import os
import re
from pathlib import Path

from .schema import Turn
from .analyze import analyze

# Incoming messages used to probe the persona. Mix of casual and substantive;
# the substantive ones *should* pull out first-principles / why / evidence.
DEFAULT_PROBES = [
    "在吗",
    "晚上一起吃饭吗",
    "我觉得这个 model 不用调了，直接上线吧",
    "听说这个框架更快，我们换掉现在的呗",
    "周末有空吗想约个饭",
    "这个 bug 我感觉是网络问题，重启就好了吧",
    "老板说下周要 demo，你觉得来得及吗",
    "哈哈哈我昨天又熬夜了",
]

_REASONING_MARKERS = re.compile(
    r"(为什么|凭什么|依据|根据|证据|因为|所以|数据|逻辑|前提|假设|"
    r"why|because|evidence|reason|assume|first principle|prove|data)",
    re.IGNORECASE,
)


def _fp_from_stats(stats: dict) -> dict:
    """Pull the comparable feature subset out of a full stats dict."""
    if not stats or stats.get("n_turns", 0) == 0:
        return {}
    return {
        "median_len": float(stats["length"]["median"]),
        "p90_len": float(stats["length"]["p90"]),
        "emoji_per_turn": float(stats["emoji"]["unicode_per_turn"]),
        "laughter_per_turn": float(stats["laughter_per_turn"]),
        "latin_share": float(stats["code_switching"]["latin_share"]),
        "multi_bubble_share": float(stats["bubbles_per_turn"]["multi_bubble_share"]),
        "end_punct_drop_rate": stats["punctuation"]["no_end_punct_turns"] / stats["n_turns"],
    }


def fingerprint(texts: list[str]) -> dict:
    """Build a style fingerprint from raw reply texts (each text = one turn)."""
    turns = [Turn(talker="probe", is_me=True, sender="me", timestamp=0, text=t) for t in texts if t.strip()]
    return _fp_from_stats(analyze(turns))


def target_fingerprint(stats: dict) -> dict:
    return _fp_from_stats(stats)


def alignment_score(candidate: dict, target: dict) -> dict:
    """Return overall 0-100 alignment plus per-feature similarity.

    Each feature similarity = 1 - normalised absolute error, clamped to [0,1].
    Counts/rates are compared on a scale that tolerates small absolute gaps.
    """
    if not candidate or not target:
        return {"overall": 0.0, "by_feature": {}}
    # per-feature denominators so a "0.05 vs 0.06 emoji" gap isn't punished like lengths
    scale = {
        "median_len": 20, "p90_len": 40, "emoji_per_turn": 0.5, "laughter_per_turn": 0.5,
        "latin_share": 0.5, "multi_bubble_share": 0.5, "end_punct_drop_rate": 0.5,
    }
    by_feat: dict[str, float] = {}
    for k, tgt in target.items():
        cand = candidate.get(k, 0.0)
        denom = scale.get(k, max(1.0, abs(tgt)))
        sim = max(0.0, 1.0 - abs(cand - tgt) / denom)
        by_feat[k] = round(sim * 100, 1)
    overall = round(sum(by_feat.values()) / len(by_feat), 1) if by_feat else 0.0
    return {"overall": overall, "by_feature": by_feat}


def reasoning_marker_rate(texts: list[str]) -> float:
    """Share of replies that contain a reasoning/evidence marker."""
    texts = [t for t in texts if t.strip()]
    if not texts:
        return 0.0
    hits = sum(1 for t in texts if _REASONING_MARKERS.search(t))
    return round(hits / len(texts), 3)


def generate_replies(persona_prompt: str, probes: list[str], model: str = "claude-opus-4-8") -> list[str] | None:
    """Generate one reply per probe using the persona prompt. None without a key."""
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return None
    try:
        import anthropic
    except ImportError:
        return None
    client = anthropic.Anthropic()
    out: list[str] = []
    for probe in probes:
        try:
            resp = client.messages.create(
                model=model, max_tokens=200, system=persona_prompt,
                messages=[{"role": "user", "content": probe}],
            )
            out.append("".join(b.text for b in resp.content if b.type == "text").strip())
        except Exception:
            out.append("")
    return out


def alignment_report(target: dict, candidate: dict, score: dict, marker_rate: float,
                     generated: bool, pairs: list[tuple[str, str]] | None = None) -> str:
    lines = [
        "# Persona Alignment Report", "",
        f"**Overall alignment: {score['overall']}/100**"
        + ("" if generated else "  _(scored on supplied texts; no live generation)_"),
        "",
        f"Reasoning-marker rate in replies: {marker_rate*100:.0f}% "
        "(how often the why/evidence voice shows up)", "",
        "## Feature-by-feature", "",
        "| Feature | Target | Candidate | Match |",
        "|---|---|---|---|",
    ]
    for k in target:
        lines.append(
            f"| {k} | {target[k]:.3g} | {candidate.get(k, 0):.3g} | {score['by_feature'].get(k, 0)}% |"
        )
    if pairs:
        lines += ["", "## Sample probe → reply", ""]
        for probe, reply in pairs[:8]:
            lines.append(f"- **{probe}**\n  → {reply or '_(empty)_'}")
    lines += ["", "_Lower-scoring features are where the prompt drifts from you — tune those next._"]
    return "\n".join(lines)


def evaluate_prompt(persona_path: str | Path, stats: dict, probes: list[str] | None = None,
                    model: str = "claude-opus-4-8") -> tuple[str, dict]:
    """Generate (if possible) + score; return (markdown_report, score_dict)."""
    probes = probes or DEFAULT_PROBES
    persona = Path(persona_path).read_text(encoding="utf-8")
    target = target_fingerprint(stats)

    replies = generate_replies(persona, probes, model=model)
    generated = replies is not None
    if not generated:
        replies = []
    candidate = fingerprint(replies) if replies else {}
    score = alignment_score(candidate, target) if candidate else {"overall": 0.0, "by_feature": {}}
    marker = reasoning_marker_rate(replies) if replies else 0.0
    pairs = list(zip(probes, replies)) if replies else None
    report = alignment_report(target, candidate, score, marker, generated, pairs)
    return report, score
