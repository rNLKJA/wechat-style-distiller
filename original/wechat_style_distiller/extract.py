"""Stage 1 — get messages out of WeChat and into a normalised list.

We don't reimplement WeChat decryption. We lean on `chatlog`
(https://github.com/sjzar/chatlog), a maintained tool that decrypts the local
macOS/Windows WeChat database and can dump messages as JSON. This module loads
that JSON (from a file, or live from chatlog's HTTP API) and normalises every
record into a `Message`.

Field names differ slightly across chatlog / WeChatExporter / manual dumps, so
the normaliser is deliberately tolerant: it tries a list of candidate keys.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urlencode
from urllib.request import urlopen

from .schema import Message


def _first(d: dict[str, Any], *keys: str, default: Any = None) -> Any:
    """Return the first present, non-None value among `keys`."""
    for k in keys:
        if k in d and d[k] is not None:
            return d[k]
    return default


def _as_unix(value: Any) -> int:
    """Best-effort convert a timestamp (unix int, or ISO string) to unix secs."""
    if value is None:
        return 0
    if isinstance(value, (int, float)):
        v = int(value)
        # chatlog sometimes emits milliseconds
        return v // 1000 if v > 10_000_000_000 else v
    if isinstance(value, str):
        s = value.strip()
        if s.isdigit():
            return _as_unix(int(s))
        try:
            from datetime import datetime

            return int(datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp())
        except ValueError:
            return 0
    return 0


def normalise_record(rec: dict[str, Any]) -> Message | None:
    """Map one raw export record to a `Message`, or None if unmappable."""
    content = _first(rec, "content", "Content", "msg", "message", "StrContent", default="")
    if not isinstance(content, str):
        content = str(content)

    talker = _first(rec, "talker", "talkerName", "Talker", "roomName", "chatId", default="")
    is_group = bool(
        _first(rec, "isChatRoom", "isGroup", "is_group", default="@chatroom" in str(talker))
    )

    # "Did I send this?" — chatlog uses isSelf / isSender; some dumps use a flag.
    is_me = _first(rec, "isSelf", "is_me", "isSender", "IsSender", default=None)
    if is_me is None:
        # fall back to comparing sender id with a known self id if present
        is_me = bool(_first(rec, "fromMe", default=False))
    is_me = bool(int(is_me)) if isinstance(is_me, str) and is_me.isdigit() else bool(is_me)

    sender = _first(rec, "senderName", "sender", "Sender", "from", default="me" if is_me else talker)
    timestamp = _as_unix(_first(rec, "time", "timestamp", "createTime", "CreateTime", "seq"))
    msg_type = int(_first(rec, "type", "Type", "msgType", default=1) or 1)

    return Message(
        talker=str(talker),
        is_me=is_me,
        sender=str(sender),
        timestamp=timestamp,
        content=content.strip(),
        is_group=is_group,
        msg_type=msg_type,
        extra={},
    )


def load_json_file(path: str | Path) -> list[Message]:
    """Load a chatlog JSON dump (a list of records, or {"messages": [...]})."""
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    records: Iterable[dict[str, Any]]
    if isinstance(data, dict):
        records = data.get("messages") or data.get("data") or data.get("rows") or []
    else:
        records = data
    out = [normalise_record(r) for r in records if isinstance(r, dict)]
    return [m for m in out if m is not None]


def load_from_chatlog_api(
    base_url: str = "http://127.0.0.1:5030",
    talker: str | None = None,
    time_range: str | None = None,
    limit: int = 0,
) -> list[Message]:
    """Pull messages live from a running `chatlog server`.

    Start it first:  `chatlog server`  (defaults to 127.0.0.1:5030)
    `time_range` example: "2024-01-01~2025-01-01".
    """
    params: dict[str, Any] = {"format": "json"}
    if talker:
        params["talker"] = talker
    if time_range:
        params["time"] = time_range
    if limit:
        params["limit"] = limit
    url = f"{base_url}/api/v1/chatlog?{urlencode(params)}"
    with urlopen(url, timeout=30) as resp:  # noqa: S310 (localhost only)
        data = json.loads(resp.read().decode("utf-8"))
    records = data if isinstance(data, list) else data.get("messages", data.get("data", []))
    out = [normalise_record(r) for r in records if isinstance(r, dict)]
    return [m for m in out if m is not None]
