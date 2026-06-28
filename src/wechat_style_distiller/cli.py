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

from . import extract, clean, analyze as analyze_mod, distill as distill_mod
from .chatbot import run_chat


def _build(messages, out, name, use_llm):
    turns = clean.build_turns(messages)
    mine = clean.my_turns(turns)
    exchanges = clean.build_exchanges(turns)
    stats = analyze_mod.analyze(mine)
    print(
        f"  {len(messages):,} messages -> {len(turns):,} turns "
        f"({len(mine):,} yours) -> {len(exchanges):,} exchanges",
        file=sys.stderr,
    )
    paths = distill_mod.distill(mine, exchanges, stats, out, name=name, use_llm=use_llm)
    for label, path in paths.items():
        print(f"  wrote {label:14s} {path}", file=sys.stderr)
    return paths


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

    chat = sub.add_parser("chat", help="chat in your voice")
    chat.add_argument("--persona", default="output/persona_prompt.txt")
    chat.add_argument("--model", default="claude-opus-4-8")

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
        _build(messages, args.out, args.name, use_llm=not args.no_llm)
        return 0

    if args.cmd == "chat":
        return run_chat(args.persona, model=args.model)

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
