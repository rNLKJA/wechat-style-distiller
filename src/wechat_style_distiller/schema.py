"""Shared data model for the pipeline.

A single normalised `Message` is the unit every stage agrees on, so the
extractor can target many WeChat-export shapes while the rest of the pipeline
stays stable.
"""
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any


# Message "types" we keep vs. drop. chatlog uses integer type codes; we map the
# common ones and treat everything else as non-text (dropped from the dataset).
TEXT_TYPE = 1  # plain text message


@dataclass
class Message:
    """One normalised chat message."""

    talker: str          # conversation id (contact or group)
    is_me: bool          # True if *you* sent it
    sender: str          # display name / wxid of the actual sender
    timestamp: int       # unix seconds
    content: str         # text content (already trimmed)
    is_group: bool = False
    msg_type: int = TEXT_TYPE
    extra: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class Turn:
    """A consecutive run of messages from the same speaker in one conversation.

    People rarely say everything in one bubble — they fire several in a row.
    Collapsing them into a turn is closer to how a single "utterance" reads.
    """

    talker: str
    is_me: bool
    sender: str
    timestamp: int
    text: str
    is_group: bool = False
    n_messages: int = 1

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class Exchange:
    """A `prompt -> reply` pair: what someone said, and how *you* replied.

    This is the unit used for few-shot examples and for fine-tuning datasets,
    because it captures your voice *in context*.
    """

    talker: str
    is_group: bool
    context: list[dict[str, str]]   # prior turns: [{"speaker", "text"}, ...]
    reply: str                      # your reply text
    timestamp: int

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
