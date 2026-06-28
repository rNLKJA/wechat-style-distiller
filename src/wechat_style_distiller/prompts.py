"""Templates + builders for the two text artifacts: the style profile and the
persona prompt.

The persona prompt is built *deterministically* from your stats and a handful of
real exchanges — no API key required to produce it. An optional LLM pass
(distill.py) can add a qualitative "voice summary" on top.
"""
from __future__ import annotations

import random
from .schema import Exchange


def _fmt_counter(pairs: list[tuple[str, int]], n: int = 8) -> str:
    return "、".join(f"{w}({c})" for w, c in pairs[:n]) if pairs else "—"


def build_style_profile_md(stats: dict, voice_summary: str | None = None) -> str:
    """Human-readable Markdown report of how you write."""
    if stats.get("n_turns", 0) == 0:
        return "# Style Profile\n\n_No messages found to analyse._\n"

    L = stats["length"]
    b = stats["bubbles_per_turn"]
    e = stats["emoji"]
    cs = stats["code_switching"]
    p = stats["punctuation"]
    n = stats["n_turns"]

    lines = [
        "# Your WeChat Style Profile",
        "",
        f"Built from **{n:,} of your own utterances** "
        f"({stats['total_chars']:,} characters). Engine: `{stats['engine']}`.",
        "",
    ]
    if voice_summary:
        lines += ["## Voice, in a sentence", "", voice_summary.strip(), ""]

    lines += [
        "## Message shape",
        "",
        f"- **Typical length:** median {L['median']} chars, mean {L['mean']} "
        f"(p75 {L['p75']:.0f}, p90 {L['p90']:.0f}, longest {L['max']:.0f}).",
        f"- **Bubble bursts:** {b['mean']} bubbles per turn on average; "
        f"{b['multi_bubble_share']*100:.0f}% of turns are multiple bubbles fired in a row.",
        f"- **End punctuation:** {p['no_end_punct_turns']} of {n} turns end with no "
        f"full stop — {'often drops it' if p['no_end_punct_turns']/n > 0.4 else 'usually keeps it'}.",
        "",
        "## Texture",
        "",
        f"- **Emoji / faces:** {e['unicode_per_turn']} emoji per turn. "
        f"Top faces: {_fmt_counter(e['top_wechat_faces'])}. "
        f"Top emoji: {_fmt_counter(e['top_unicode'])}.",
        f"- **Laughter:** {stats['laughter_per_turn']} laugh-tokens per turn "
        f"(哈哈 / 233 / hhh ...).",
        f"- **Code-switching:** {cs['latin_share']*100:.0f}% of word-tokens are Latin "
        f"({cs['latin_words']:,} English-ish words vs {cs['cjk_chars']:,} CJK chars).",
        f"- **Punctuation tics:** ellipsis ×{p['ellipsis']}, exclaim ×{p['exclaim']}, "
        f"question ×{p['question']}, tilde ×{p['tilde']}.",
        "",
        "## Catchphrases",
        "",
        f"- **Most-used phrases:** {_fmt_counter(stats['top_phrases'], 15)}",
        f"- **How you open:** {_fmt_counter(stats['top_openers'])}",
        f"- **How you close:** {_fmt_counter(stats['top_closers'])}",
        "",
        "## Who you talk to (top conversations)",
        "",
    ]
    for talker, info in list(stats["by_contact"].items())[:8]:
        kind = "group" if info["is_group"] else "1:1"
        lines.append(f"- `{talker}` — {kind}, {info['n_turns']} turns, avg {info['avg_chars']} chars")

    lines += ["", "---", "", "_Generated locally by wechat-style-distiller. Your data never left this machine._"]
    return "\n".join(lines)


def _select_few_shot(exchanges: list[Exchange], k: int = 8, seed: int = 7) -> list[Exchange]:
    """Pick a diverse set of exchanges: prefer 1:1, varied reply lengths."""
    one_on_one = [e for e in exchanges if not e.is_group and e.reply.strip()]
    pool = one_on_one or exchanges
    if len(pool) <= k:
        return pool
    rng = random.Random(seed)
    # bucket by reply length so few-shots aren't all short or all long
    pool_sorted = sorted(pool, key=lambda e: len(e.reply))
    buckets = [pool_sorted[i::3] for i in range(3)]  # short / mid / long thirds
    picks: list[Exchange] = []
    while len(picks) < k and any(buckets):
        for bkt in buckets:
            if bkt and len(picks) < k:
                picks.append(bkt.pop(rng.randrange(len(bkt))))
    return picks


def _render_few_shot(exchanges: list[Exchange]) -> str:
    blocks = []
    for e in exchanges:
        convo = "\n".join(f"{c['speaker']}: {c['text']}" for c in e.context)
        blocks.append(f"<example>\n{convo}\nme: {e.reply}\n</example>")
    return "\n\n".join(blocks)


PERSONA_HEADER = """\
You are role-playing as a specific person ("the user") in a casual WeChat-style \
chat. Reply exactly the way they would — same rhythm, length, vocabulary, emoji \
habits and language mix. You are not an assistant; you are them, texting a friend.
"""


def build_persona_prompt(
    stats: dict,
    exchanges: list[Exchange],
    voice_summary: str | None = None,
    name: str = "the user",
    k_few_shot: int = 8,
) -> str:
    """Assemble the ready-to-paste system prompt that makes an LLM reply like you."""
    L = stats.get("length", {})
    b = stats.get("bubbles_per_turn", {})
    e = stats.get("emoji", {})
    cs = stats.get("code_switching", {})
    p = stats.get("punctuation", {})
    n = max(1, stats.get("n_turns", 1))

    drops_punct = p.get("no_end_punct_turns", 0) / n > 0.4
    rules = [
        f"Keep replies short: median ~{L.get('median', 12)} characters, rarely over "
        f"{int(L.get('p90', 40))}. Real texting length, not paragraphs.",
        f"It's natural to send {b.get('mean', 1.3):.1f} short bubbles in a row "
        f"(separate them with newlines) rather than one long message."
        if b.get("multi_bubble_share", 0) > 0.25
        else "Usually one bubble per reply.",
        f"Code-switching: about {cs.get('latin_share', 0)*100:.0f}% of words are English; "
        "drop English words in naturally the way they do — don't translate everything.",
        f"Emoji/faces: ~{e.get('unicode_per_turn', 0)} per message. "
        f"Favourites: {_fmt_counter(e.get('top_wechat_faces', []) + e.get('top_unicode', []))}. "
        "Use sparingly and only where it fits.",
        f"Laughter shows up as {_fmt_counter([('哈哈',0)]) if False else 'things like 哈哈 / 233 / hhh'} "
        f"(~{stats.get('laughter_per_turn', 0)} per message).",
        ("Often skip end punctuation." if drops_punct else "Usually keep normal end punctuation.")
        + f" Tics: ellipsis, tilde (~). Common openers: {_fmt_counter(stats.get('top_openers', []), 6)}.",
        f"Lean on their catchphrases where natural: {_fmt_counter(stats.get('top_phrases', []), 12)}.",
        "Never sound like a chatbot: no disclaimers, no 'As an AI', no over-helpfulness, "
        "no bullet-pointed advice unless they'd actually do that.",
    ]

    parts = [PERSONA_HEADER.replace("the user", name)]
    if voice_summary:
        parts.append(f"## Who you are\n{voice_summary.strip()}")
    parts.append("## How you text\n" + "\n".join(f"- {r}" for r in rules))
    few = _select_few_shot(exchanges, k=k_few_shot)
    if few:
        parts.append(
            "## Real examples of your replies\n"
            "Match this voice. `me:` lines are you.\n\n" + _render_few_shot(few)
        )
    parts.append(
        "## Now\nStay in character as " + name + ". Reply only with the message text "
        "(use newlines for multiple bubbles). Nothing else."
    )
    return "\n\n".join(parts)
