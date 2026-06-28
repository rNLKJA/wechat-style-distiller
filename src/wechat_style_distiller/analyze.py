"""Stage 3a — quantitative analysis of *your* voice (no API key needed).

Everything here is pure Python over your own turns. It produces a stats dict
that feeds both the human-readable profile and the persona prompt.

If `jieba` is installed, Chinese phrase mining is word-level; otherwise we fall
back to character bi/tri-grams, which still surface catchphrases.
"""
from __future__ import annotations

import re
import statistics
from collections import Counter
from datetime import datetime, timezone

from .schema import Turn

try:  # optional, better Chinese segmentation
    import jieba  # type: ignore

    _HAS_JIEBA = True
except Exception:  # pragma: no cover - optional dep
    _HAS_JIEBA = False

# Unicode emoji ranges (compact, good enough for frequency counting).
_EMOJI = re.compile(
    "[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF❤⁉‼]"
)
_WECHAT_FACE = re.compile(r"\[[^\[\]]{1,8}\]")        # [呲牙] [Smile] etc.
_CJK = re.compile(r"[一-鿿]")
_LATIN_WORD = re.compile(r"[A-Za-z]+")
_LAUGH = re.compile(r"(哈{2,}|呵{2,}|嘿{2,}|2{3,}|哈哈|lol|lmao|hhh+)", re.IGNORECASE)
# Common Chinese stopwords to exclude from "catchphrase" mining.
_STOP = set(
    "的 了 是 我 你 他 她 它 们 在 这 那 也 都 和 与 就 还 不 没 有 个 啊 吧 吗 呢 嘛 "
    "一 我们 你们 一个 这个 那个 什么 怎么 这样 时候 自己 现在 知道 可以 因为 所以 但是 "
    "to the a of and is in it i you he she we".split()
)


def _percentiles(values: list[int]) -> dict[str, float]:
    if not values:
        return {"p25": 0, "p50": 0, "p75": 0, "p90": 0, "max": 0}
    s = sorted(values)

    def pct(p: float) -> float:
        if len(s) == 1:
            return float(s[0])
        idx = min(len(s) - 1, int(round(p / 100 * (len(s) - 1))))
        return float(s[idx])

    return {"p25": pct(25), "p50": pct(50), "p75": pct(75), "p90": pct(90), "max": float(s[-1])}


def _tokens(text: str) -> list[str]:
    if _HAS_JIEBA:
        return [w.strip() for w in jieba.cut(text) if w.strip()]
    # char-bigram fallback over CJK runs + latin words
    toks: list[str] = []
    toks += _LATIN_WORD.findall(text.lower())
    cjk = "".join(_CJK.findall(text))
    toks += [cjk[i:i + 2] for i in range(len(cjk) - 1)]
    return toks


def analyze(my: list[Turn]) -> dict:
    """Return a stats dict describing how `my` turns are written."""
    n = len(my)
    if n == 0:
        return {"n_turns": 0}

    char_lens = [len(t.text) for t in my]
    bubble_counts = [t.n_messages for t in my]
    all_text = "\n".join(t.text for t in my)

    emoji = Counter(_EMOJI.findall(all_text))
    faces = Counter(f for f in _WECHAT_FACE.findall(all_text))
    laughs = len(_LAUGH.findall(all_text))

    cjk_chars = len(_CJK.findall(all_text))
    latin_words = len(_LATIN_WORD.findall(all_text))
    total_alpha = cjk_chars + sum(len(w) for w in _LATIN_WORD.findall(all_text))

    # phrase mining
    tok_counter: Counter[str] = Counter()
    for t in my:
        for w in _tokens(t.text):
            if len(w) >= 2 and w.lower() not in _STOP and not w.isdigit():
                tok_counter[w] += 1

    # punctuation feel
    punct = {
        "ellipsis": all_text.count("...") + all_text.count("…"),
        "exclaim": all_text.count("!") + all_text.count("！"),
        "question": all_text.count("?") + all_text.count("？"),
        "tilde": all_text.count("~") + all_text.count("～"),
        "no_end_punct_turns": sum(
            1 for t in my if t.text and t.text.strip()[-1] not in "。.!！?？~～…"
        ),
    }

    # openers / closers (first / last token of each turn)
    openers = Counter()
    closers = Counter()
    for t in my:
        toks = _tokens(t.text)
        if toks:
            openers[toks[0]] += 1
            closers[toks[-1]] += 1

    # time-of-day
    hours = Counter()
    for t in my:
        if t.timestamp:
            hours[datetime.fromtimestamp(t.timestamp, tz=timezone.utc).hour] += 1

    # per-contact volume + formality proxy (longer + more end-punctuation = more formal)
    by_contact: dict[str, dict] = {}
    contact_turns: dict[str, list[Turn]] = {}
    for t in my:
        contact_turns.setdefault(t.talker, []).append(t)
    for talker, ts in contact_turns.items():
        lens = [len(x.text) for x in ts]
        by_contact[talker] = {
            "is_group": ts[0].is_group,
            "n_turns": len(ts),
            "avg_chars": round(statistics.mean(lens), 1),
        }

    return {
        "n_turns": n,
        "total_chars": sum(char_lens),
        "length": {
            "mean": round(statistics.mean(char_lens), 1),
            "median": statistics.median(char_lens),
            **_percentiles(char_lens),
        },
        "bubbles_per_turn": {
            "mean": round(statistics.mean(bubble_counts), 2),
            "max": max(bubble_counts),
            "multi_bubble_share": round(sum(1 for b in bubble_counts if b > 1) / n, 3),
        },
        "emoji": {
            "unicode_per_turn": round(sum(emoji.values()) / n, 3),
            "top_unicode": emoji.most_common(10),
            "top_wechat_faces": faces.most_common(10),
        },
        "laughter_per_turn": round(laughs / n, 3),
        "code_switching": {
            "cjk_chars": cjk_chars,
            "latin_words": latin_words,
            "latin_share": round(latin_words / max(1, latin_words + cjk_chars), 3),
        },
        "punctuation": punct,
        "top_phrases": tok_counter.most_common(30),
        "top_openers": openers.most_common(12),
        "top_closers": closers.most_common(12),
        "active_hours_utc": dict(sorted(hours.items())),
        "by_contact": dict(
            sorted(by_contact.items(), key=lambda kv: kv[1]["n_turns"], reverse=True)[:15]
        ),
        "engine": "jieba" if _HAS_JIEBA else "char-ngram",
    }
