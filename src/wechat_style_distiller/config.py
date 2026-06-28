"""Loading the thinking profile.

The *texting* style is learned from data. The *thinking* style can't be — short
WeChat bubbles don't reveal how you reason. So it's authored once in a small
JSON file and layered into the persona prompt.

Search order (first hit wins):
  1. an explicit --thinking-profile path
  2. config/thinking_profile.json   (your real one — git-ignored)
  3. config/thinking_profile.example.json  (generic template — public)
  4. None (prompt falls back to texting-style only)
"""
from __future__ import annotations

import json
from pathlib import Path

# repo root = three levels up from this file (src/wechat_style_distiller/config.py)
_ROOT = Path(__file__).resolve().parents[2]
_CANDIDATES = [
    _ROOT / "config" / "thinking_profile.json",
    _ROOT / "config" / "thinking_profile.example.json",
]


def load_thinking_profile(explicit: str | Path | None = None) -> dict | None:
    """Return the thinking profile dict, or None if none is found/usable."""
    paths = [Path(explicit)] if explicit else _CANDIDATES
    for p in paths:
        if p and p.exists():
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                continue
            # strip JSON-comment-ish helper keys (anything starting with "_")
            return {k: v for k, v in data.items() if not k.startswith("_")}
    return None
