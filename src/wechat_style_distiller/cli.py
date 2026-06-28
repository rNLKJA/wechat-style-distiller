"""Command-line entrypoint tying the pipeline together.

    # full pipeline from a chatlog JSON dump
    python -m wechat_style_distiller.cli run --input data/raw/chatlog.json --out output

    # or pull live from a running `chatlog server`
    python -m wechat_style_distiller.cli run --from-api --out output

    # chat in your voice
    python -m wechat_style_distiller.cli chat --persona output/persona_prompt.txt
"""
from __future__ import annotations

import argparse
import sys

from . import extract, clean, analyze as analyze_mod, distill as distill_mod, registers as reg_mod
from .chatbot import run_chat
from .config import load_thinking_profile
from .prompts import build_persona_prompt, build_style_profile_md


def _build(messages, out, name, use_llm, thinking_profile=None):
    turns = clean.build_turns(messages)
    mine = clean.my_turns(turns)
    exchanges = clean.build_exchanges(turns)
    stats = analyze_mod.analyze(mine)
    print(
        f"  {len(messages):,} messages -> {len(turns):,} turns "
        f"({len(mine):,} yours) -> {len(exchanges):,} exchanges",
        file=sys.stderr,
    )
    if thinking_profile:
        print("  + thinking profile layered into persona prompt", file=sys.stderr)
    paths = distill_mod.distill(
        mine, exchanges, stats, out, name=name, use_llm=use_llm,
        thinking_profile=thinking_profile,
    )
    for label, path in paths.items():
        print(f"  wrote {label:14s} {path}", file=sys.stderr)
    return turns, exchanges, paths


def _build_registers(turns, exchanges, out, name, thinking_profile, mapping):
    """Write one persona prompt + profile per usable register."""
    from pathlib import Path

    out = Path(out)
    buckets = reg_mod.usable_registers(reg_mod.classify_turns(turns, mapping))
    if not buckets:
        print("  (no register has enough turns to model)", file=sys.stderr)
        return
    for rname, rturns in buckets.items():
        rstats = analyze_mod.analyze(rturns)
        rex = [
            e for e in exchanges
            if reg_mod.register_of(e.talker, e.is_group, mapping) == rname
        ]
        desc = reg_mod.REGISTER_DESCRIPTIONS.get(rname, rname)
        persona = build_persona_prompt(
            rstats, rex, name=name, thinking_profile=thinking_profile
        )
        header = f"# Register: {rname} — {desc}\n\n"
        (out / f"persona_prompt.{rname}.txt").write_text(persona, encoding="utf-8")
        (out / f"profile.{rname}.md").write_text(
            header + build_style_profile_md(rstats), encoding="utf-8"
        )
        print(f"  wrote register '{rname}' ({len(rturns)} turns)", file=sys.stderr)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="wechat-style-distiller")
    sub = parser.add_subparsers(dest="cmd", required=True)

    run = sub.add_parser("run", help="run the full extract->distill pipeline")
    src = run.add_mutually_exclusive_group(required=True)
    src.add_argument("--input", help="path to a chatlog JSON dump")
    src.add_argument("--from-api", action="store_true", help="pull from running chatlog server")
    run.add_argument("--api-url", default="http://127.0.0.1:5030")
    run.add_argument("--talker", default=None, help="limit to one contact/group id")
    run.add_argument("--time", default=None, help="time range, e.g. 2024-01-01~2025-01-01")
    run.add_argument("--out", default="output")
    run.add_argument("--name", default="the user", help="name to use in the persona prompt")
    run.add_argument("--no-llm", action="store_true", help="skip the LLM voice summary")
    run.add_argument(
        "--thinking-profile", default=None,
        help="path to a thinking-profile JSON (defaults to config/thinking_profile.json "
             "then .example.json). Use --no-thinking to disable.",
    )
    run.add_argument("--no-thinking", action="store_true", help="don't layer in a thinking profile")
    run.add_argument(
        "--by-register", action="store_true",
        help="also write a separate persona prompt per register (groups vs one-on-one, "
             "or per --register-map)",
    )
    run.add_argument(
        "--register-map", default=None,
        help="JSON file mapping talker ids to register names, e.g. "
             '{"sunny_wxid": "close", "boss_wxid": "work"}',
    )

    chat = sub.add_parser("chat", help="chat in your voice")
    chat.add_argument("--persona", default="output/persona_prompt.txt")
    chat.add_argument("--model", default="claude-opus-4-8")

    ev = sub.add_parser("eval", help="measure how well the persona prompt reproduces your voice")
    ev.add_argument("--persona", default="output/persona_prompt.txt")
    ev.add_argument("--stats", default="output/stats.json", help="target stats.json from a run")
    ev.add_argument("--out", default=None, help="write the report here (else stdout)")
    ev.add_argument("--model", default="claude-opus-4-8")

    tn = sub.add_parser("tune", help="auto-tune the persona prompt against the alignment score")
    tn.add_argument("--persona", default="output/persona_prompt.txt")
    tn.add_argument("--stats", default="output/stats.json")
    tn.add_argument("--out", default="output/persona_prompt.tuned.txt")
    tn.add_argument("--rounds", type=int, default=3)
    tn.add_argument("--threshold", type=float, default=85.0)
    tn.add_argument("--model", default="claude-opus-4-8")

    args = parser.parse_args(argv)

    if args.cmd == "run":
        if args.from_api:
            print("Loading from chatlog API...", file=sys.stderr)
            messages = extract.load_from_chatlog_api(
                args.api_url, talker=args.talker, time_range=args.time
            )
        else:
            print(f"Loading {args.input}...", file=sys.stderr)
            messages = extract.load_json_file(args.input)
        profile = None if args.no_thinking else load_thinking_profile(args.thinking_profile)
        turns, exchanges, _ = _build(
            messages, args.out, args.name, use_llm=not args.no_llm, thinking_profile=profile
        )
        if args.by_register:
            import json as _json

            mapping = None
            if args.register_map:
                mapping = _json.loads(open(args.register_map, encoding="utf-8").read())
            _build_registers(turns, exchanges, args.out, args.name, profile, mapping)
        return 0

    if args.cmd == "chat":
        return run_chat(args.persona, model=args.model)

    if args.cmd == "eval":
        import json
        from .evaluate import evaluate_prompt

        stats = json.loads(open(args.stats, encoding="utf-8").read())
        report, score = evaluate_prompt(args.persona, stats, model=args.model)
        print(f"Overall alignment: {score['overall']}/100", file=sys.stderr)
        if args.out:
            from pathlib import Path

            Path(args.out).write_text(report, encoding="utf-8")
            print(f"wrote {args.out}", file=sys.stderr)
        else:
            print(report)
        return 0

    if args.cmd == "tune":
        import json
        from pathlib import Path
        from .refine import auto_tune

        stats = json.loads(open(args.stats, encoding="utf-8").read())
        final, history = auto_tune(
            args.persona, stats, rounds=args.rounds,
            threshold=args.threshold, model=args.model,
        )
        if final is None:
            print("Tuning needs ANTHROPIC_API_KEY (to generate + score replies).", file=sys.stderr)
            return 1
        Path(args.out).write_text(final, encoding="utf-8")
        trail = " -> ".join(f"{h:.1f}" for h in history)
        print(f"alignment over rounds: {trail}", file=sys.stderr)
        print(f"wrote {args.out}", file=sys.stderr)
        return 0

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
