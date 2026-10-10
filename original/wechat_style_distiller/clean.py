"""Stage 2 — clean and structure the messages.

Output two things:
  * turns      — your own utterances (consecutive bubbles merged), for analysis
  * exchanges  — (context -> your reply) pairs, for few-shot / fine-tuning

We drop the noise that would pollute a style model: system notices, pure
links/cards, and media placeholders like "[图片]" / "[表情]".
"""
from __future__ import annotations

import re
from .schema import Message, Turn, Exchange, TEXT_TYPE

# WeChat renders non-text payloads as bracketed placeholders; drop bubbles that
# are *only* such a placeholder. (Kept simple and language-aware.)
_PLACEHOLDER = re.compile(
    r"^\s*\[(图片|表情|动画表情|视频|语音|位置|文件|链接|名片|转账|红包|聊天记录|"
    r"Photo|Sticker|Video|Voice|Location|File|Link|Card)\]\s*$"
)
_URL = re.compile(r"https?://\S+")
# Messages that are basically a shared-card / mini-program dump (XML-ish).
_LOOKS_LIKE_CARD = re.compile(r"^\s*<(\?xml|msg|appmsg)", re.IGNORECASE)
# Gap (seconds) beyond which consecutive same-speaker bubbles are NOT merged.
MERGE_GAP_SECONDS = 180
# How many prior turns to keep as context for an exchange.
CONTEXT_TURNS = 4


def is_meaningful_text(m: Message) -> bool:
    """True if the message carries real typed words worth modelling."""
    if m.msg_type != TEXT_TYPE:
        return False
    c = m.content.strip()
    if not c:
        return False
    if _PLACEHOLDER.match(c) or _LOOKS_LIKE_CARD.match(c):
        return False
    # A bubble that is *only* a URL tells us nothing about voice.
    if _URL.sub("", c).strip() == "":
        return False
    return True


def build_turns(messages: list[Message]) -> list[Turn]:
    """Merge consecutive same-speaker bubbles (within MERGE_GAP) into turns."""
    turns: list[Turn] = []
    msgs = [m for m in messages if is_meaningful_text(m)]
    msgs.sort(key=lambda m: (m.talker, m.timestamp))

    for m in msgs:
        prev = turns[-1] if turns else None
        same_run = (
            prev is not None
            and prev.talker == m.talker
            and prev.is_me == m.is_me
            and prev.sender == m.sender
            and 0 <= m.timestamp - prev.timestamp <= MERGE_GAP_SECONDS
        )
        if same_run:
            prev.text = f"{prev.text}\n{m.content}".strip()
            prev.n_messages += 1
            prev.timestamp = m.timestamp
        else:
            turns.append(
                Turn(
                    talker=m.talker,
                    is_me=m.is_me,
                    sender=m.sender,
                    timestamp=m.timestamp,
                    text=m.content,
                    is_group=m.is_group,
                    n_messages=1,
                )
            )
    return turns


def my_turns(turns: list[Turn]) -> list[Turn]:
    """Just your own utterances — the raw material for the style profile."""
    return [t for t in turns if t.is_me]


def build_exchanges(turns: list[Turn]) -> list[Exchange]:
    """Pair each of your turns with the conversation that led up to it."""
    exchanges: list[Exchange] = []
    # group turns by conversation, preserving time order
    by_talker: dict[str, list[Turn]] = {}
    for t in sorted(turns, key=lambda t: (t.talker, t.timestamp)):
        by_talker.setdefault(t.talker, []).append(t)

    for talker, seq in by_talker.items():
        for i, t in enumerate(seq):
            if not t.is_me:
                continue
            # context = the preceding turns (cap at CONTEXT_TURNS), most recent last
            ctx_turns = seq[max(0, i - CONTEXT_TURNS): i]
            if not ctx_turns:
                continue  # nothing to reply to — skip (e.g. you opened the chat)
            context = [
                {"speaker": "me" if c.is_me else (c.sender or "them"), "text": c.text}
                for c in ctx_turns
            ]
            exchanges.append(
                Exchange(
                    talker=talker,
                    is_group=t.is_group,
                    context=context,
                    reply=t.text,
                    timestamp=t.timestamp,
                )
            )
    return exchanges
