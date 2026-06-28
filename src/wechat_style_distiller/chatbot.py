"""Stage 4 — a CLI chatbot that talks like you.

Loads the generated persona prompt as the system prompt and chats over the
Anthropic API. The few-shot examples are already baked into the prompt by
distill.py, so this stays thin.

    export ANTHROPIC_API_KEY=...
    python -m wechat_style_distiller.cli chat --persona output/persona_prompt.txt
"""
from __future__ import annotations

import os
import sys
from pathlib import Path


def run_chat(persona_path: str | Path, model: str = "claude-opus-4-8") -> int:
    persona = Path(persona_path)
    if not persona.exists():
        print(f"persona prompt not found: {persona}", file=sys.stderr)
        return 1
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("Set ANTHROPIC_API_KEY to chat.", file=sys.stderr)
        return 1
    try:
        import anthropic
    except ImportError:
        print("pip install anthropic", file=sys.stderr)
        return 1

    system = persona.read_text(encoding="utf-8")
    client = anthropic.Anthropic()
    history: list[dict] = []

    print("Chatting in your voice. Type your friend's message (Ctrl-C to quit).\n")
    try:
        while True:
            user = input("them: ").strip()
            if not user:
                continue
            history.append({"role": "user", "content": user})
            resp = client.messages.create(
                model=model, max_tokens=300, system=system, messages=history
            )
            reply = "".join(b.text for b in resp.content if b.type == "text").strip()
            history.append({"role": "assistant", "content": reply})
            print(f"me: {reply}\n")
    except (KeyboardInterrupt, EOFError):
        print("\nbye")
        return 0
