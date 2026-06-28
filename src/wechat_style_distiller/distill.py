"""Stage 3b — produce the artifacts.

  * profile.md        — human-readable style report
  * persona_prompt.txt — paste-into-any-LLM system prompt
  * dataset.jsonl      — exchanges for few-shot / fine-tuning (stays local)

The optional `voice_summary` is the one place an LLM helps: it reads a sample of
your turns and writes 3-4 sentences on tone/humour. Without an API key the
artifacts still generate — they just skip that paragraph.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

from .schema import Turn, Exchange
from .prompts import build_style_profile_md, build_persona_prompt


def llm_voice_summary(my_turns: list[Turn], model: str = "claude-opus-4-8") -> str | None:
    """Ask Claude for a short qualitative read on the user's voice.

    Requires ANTHROPIC_API_KEY and the `anthropic` package. Returns None on any
    failure so the pipeline never hard-depends on it.
    """
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return None
    try:
        import anthropic  # type: ignore
    except Exception:
        return None

    sample = [t.text for t in my_turns[:400]]
    if not sample:
        return None
    joined = "\n".join(f"- {s}" for s in sample)
    try:
        client = anthropic.Anthropic()
        msg = client.messages.create(
            model=model,
            max_tokens=400,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "These are real chat messages a person sent. In 3-4 sentences, "
                        "describe their texting voice: tone, humour, warmth, formality, "
                        "any verbal tics. Write in second person ('You ...'). Be specific, "
                        "no fluff.\n\n" + joined
                    ),
                }
            ],
        )
        return "".join(block.text for block in msg.content if block.type == "text").strip()
    except Exception:
        return None


def distill(
    my_turns: list[Turn],
    exchanges: list[Exchange],
    stats: dict,
    out_dir: str | Path,
    name: str = "the user",
    use_llm: bool = True,
    thinking_profile: dict | None = None,
) -> dict[str, Path]:
    """Write all artifacts to `out_dir`; return a map of name -> path."""
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)

    voice = llm_voice_summary(my_turns) if use_llm else None

    profile_md = build_style_profile_md(stats, voice_summary=voice)
    persona = build_persona_prompt(
        stats, exchanges, voice_summary=voice, name=name, thinking_profile=thinking_profile
    )

    paths = {
        "profile": out / "profile.md",
        "persona_prompt": out / "persona_prompt.txt",
        "stats": out / "stats.json",
        "dataset": out / "dataset.jsonl",
    }
    paths["profile"].write_text(profile_md, encoding="utf-8")
    paths["persona_prompt"].write_text(persona, encoding="utf-8")
    paths["stats"].write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")
    with paths["dataset"].open("w", encoding="utf-8") as f:
        for ex in exchanges:
            f.write(json.dumps(ex.to_dict(), ensure_ascii=False) + "\n")
    return paths
