"""End-to-end smoke tests over the synthetic sample (no network, no API key)."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
sys.path.insert(0, str(SRC))

from wechat_style_distiller import extract, clean, analyze, prompts  # noqa: E402


def _sample_messages():
    sample = ROOT / "examples" / "sample_chatlog.json"
    if not sample.exists():
        subprocess.run([sys.executable, str(ROOT / "examples" / "make_sample.py")], check=True)
    return extract.load_json_file(sample)


def test_extract_and_normalise():
    msgs = _sample_messages()
    assert len(msgs) > 50
    assert all(isinstance(m.is_me, bool) for m in msgs)
    assert any(m.is_me for m in msgs) and any(not m.is_me for m in msgs)


def test_cleaning_drops_media_and_keeps_text():
    msgs = _sample_messages()
    turns = clean.build_turns(msgs)
    # the "[图片]" placeholders must not survive into turns
    assert all("[图片]" not in t.text for t in turns)
    mine = clean.my_turns(turns)
    assert mine and all(t.is_me for t in mine)


def test_exchanges_have_context_and_reply():
    msgs = _sample_messages()
    turns = clean.build_turns(msgs)
    ex = clean.build_exchanges(turns)
    assert ex
    e = ex[0]
    assert e.reply and e.context and "text" in e.context[0]


def test_analyze_produces_stats():
    msgs = _sample_messages()
    mine = clean.my_turns(clean.build_turns(msgs))
    stats = analyze.analyze(mine)
    assert stats["n_turns"] > 0
    assert stats["length"]["median"] >= 1
    assert "top_phrases" in stats


def test_persona_prompt_is_built():
    msgs = _sample_messages()
    turns = clean.build_turns(msgs)
    mine = clean.my_turns(turns)
    stats = analyze.analyze(mine)
    ex = clean.build_exchanges(turns)
    prompt = prompts.build_persona_prompt(stats, ex, name="Sample User")
    assert "Sample User" in prompt
    assert "<example>" in prompt
    assert len(prompt) > 200
