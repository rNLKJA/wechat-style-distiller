"""Register-aware splitting.

You don't text one way. Work groups, close friends and one-on-one chats each
pull a different register out of you — longer and more punctuated at work,
clipped and emoji-heavy with friends. Averaging them into one persona blurs the
edges, so this splits your turns into registers and the pipeline can build one
persona prompt per register.

Two ways to define registers:
  * default heuristic — group chats vs one-on-one
  * explicit mapping  — {talker_id: register_name} in config (the real-data path,
    e.g. map your partner + close friends to "close", your boss to "work")
"""
from __future__ import annotations

from .schema import Turn

# name -> human description, used in the per-register prompt header
REGISTER_DESCRIPTIONS = {
    "one_on_one": "private one-on-one chats — usually your most relaxed, clipped voice",
    "groups": "group chats — often a touch more performative or measured",
    "work": "work / professional contacts — more complete, more punctuation, work vocab",
    "close": "close people (partner, close friends) — warmest, shortest, most playful",
    "other": "everyone else",
}

MIN_TURNS_PER_REGISTER = 15  # below this a register's stats are too noisy to model


def classify_turns(
    turns: list[Turn], mapping: dict[str, str] | None = None
) -> dict[str, list[Turn]]:
    """Bucket *your* turns by register.

    If `mapping` (talker_id -> register_name) is given, use it; turns whose
    talker isn't mapped fall into "other". Otherwise fall back to the
    group-vs-one-on-one heuristic.
    """
    mine = [t for t in turns if t.is_me]
    buckets: dict[str, list[Turn]] = {}
    for t in mine:
        if mapping:
            name = mapping.get(t.talker, "other")
        else:
            name = "groups" if t.is_group else "one_on_one"
        buckets.setdefault(name, []).append(t)
    return buckets


def register_of(talker: str, is_group: bool, mapping: dict[str, str] | None = None) -> str:
    """Register name for a single conversation (used to bucket exchanges too)."""
    if mapping:
        return mapping.get(talker, "other")
    return "groups" if is_group else "one_on_one"


def usable_registers(buckets: dict[str, list[Turn]]) -> dict[str, list[Turn]]:
    """Drop registers with too few turns to model reliably."""
    return {k: v for k, v in buckets.items() if len(v) >= MIN_TURNS_PER_REGISTER}
