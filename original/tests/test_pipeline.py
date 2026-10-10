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
    # without a thinking profile, the reasoning section must not appear
    assert "How you think" not in prompt


def test_thinking_profile_is_layered_in():
    from wechat_style_distiller import config

    msgs = _sample_messages()
    turns = clean.build_turns(msgs)
    mine = clean.my_turns(turns)
    stats = analyze.analyze(mine)
    ex = clean.build_exchanges(turns)

    profile = config.load_thinking_profile(
        ROOT / "config" / "thinking_profile.example.json"
    )
    assert profile and "reasoning_style" in profile

    prompt = prompts.build_persona_prompt(
        stats, ex, name="Sample User", thinking_profile=profile
    )
    assert "How you think" in prompt
    assert "first principles" in prompt
    assert "What you care about" in prompt


def test_alignment_scorer_discriminates():
    from wechat_style_distiller import evaluate

    msgs = _sample_messages()
    mine = clean.my_turns(clean.build_turns(msgs))
    stats = analyze.analyze(mine)
    target = evaluate.target_fingerprint(stats)

    # your own replies should resemble your target far more than an assistant's
    own = [t.text for t in mine]
    assistant = [
        "Certainly! I'd be happy to help you with that. Here are several options to consider.",
        "Great question. Let me walk you through the key considerations step by step.",
        "Of course. Below is a comprehensive overview of everything you need to know.",
    ] * 10

    own_score = evaluate.alignment_score(evaluate.fingerprint(own), target)["overall"]
    bot_score = evaluate.alignment_score(evaluate.fingerprint(assistant), target)["overall"]
    assert own_score > bot_score
    assert own_score > 70  # own replies are essentially the target distribution


def test_reasoning_markers_detected():
    from wechat_style_distiller import evaluate

    assert evaluate.reasoning_marker_rate(["为什么这么做", "有什么依据吗"]) == 1.0
    assert evaluate.reasoning_marker_rate(["好的", "哈哈哈"]) == 0.0


def test_register_split_separates_groups_and_one_on_one():
    from wechat_style_distiller import registers

    msgs = _sample_messages()
    turns = clean.build_turns(msgs)
    buckets = registers.classify_turns(turns)
    assert set(buckets) == {"groups", "one_on_one"}
    assert all(t.is_group for t in buckets["groups"])
    assert all(not t.is_group for t in buckets["one_on_one"])

    usable = registers.usable_registers(buckets)
    assert usable  # the sample is large enough for both
    # explicit mapping path
    mapped = registers.classify_turns(turns, {"Leo_wxid": "close"})
    assert "close" in mapped and "other" in mapped


def test_refine_corrections_are_directional_and_cited():
    from wechat_style_distiller import refine

    target = {
        "median_len": 12, "p90_len": 25, "emoji_per_turn": 0.3, "laughter_per_turn": 0.2,
        "latin_share": 0.1, "multi_bubble_share": 0.4, "end_punct_drop_rate": 0.6,
    }
    # candidate that's too long, too few emoji, too much English
    candidate = dict(target, median_len=60, p90_len=120, emoji_per_turn=0.0, latin_share=0.9)
    rules = refine.corrective_rules(target, candidate, threshold_pct=85)
    blob = " ".join(rules)
    assert "running long" in blob          # length correction, right direction
    assert "more" in blob.lower() and "emoji" in blob.lower()
    assert "vs your" in blob or "vs ~" in blob  # every rule cites the measured gap


def test_refine_apply_is_idempotent():
    from wechat_style_distiller import refine

    base = "## How you text\n- be short\n\n## Now\nStay in character."
    once = refine.apply_corrections(base, ["Cut them shorter."])
    twice = refine.apply_corrections(once, ["Use more emoji."])
    assert twice.count(refine._CALIB_HEADER) == 1   # only one calibration block
    assert "Use more emoji." in twice and "Cut them shorter." not in twice
    assert twice.rstrip().endswith("Stay in character.")  # ## Now stays last
