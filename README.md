# WeChat Style Distiller

Turn your own WeChat history into:

1. 📄 a **style profile** — how you actually text (length, emoji, catchphrases, code-switching…)
2. 🎭 a **persona prompt** — a system prompt that makes any LLM reply *in your voice*
3. 🤖 a **chatbot** — a CLI that chats like you
4. 🗂️ a **dataset** — `(context → your reply)` pairs for few-shot or fine-tuning

> **Privacy first.** This is local-first. Your chat data is read on your machine,
> written only to git-ignored folders, and **never** committed or uploaded. The
> only thing that can touch the network is the *optional* LLM voice summary /
> chatbot, which sends a sample of your text to the Anthropic API — and only if
> you set an API key.

## How it works

```
extract → clean → analyze → distill → chat
  │         │         │         │        │
chatlog   keep only  pure-Python  profile.md   talk like you
JSON      YOUR msgs  stats        persona_prompt.txt
          + turns    (no API)     dataset.jsonl
          + pairs
```

Decryption itself is delegated to [`chatlog`](https://github.com/sjzar/chatlog)
(MIT) — a maintained tool that reads the local WeChat database on macOS/Windows.
This project is everything *after* that: cleaning, analysis, and turning your
voice into a reusable prompt.

## Quickstart (no WeChat, no API key — runs on fake data)

```bash
git clone https://github.com/rNLKJA/wechat-style-distiller
cd wechat-style-distiller
make demo          # generates synthetic data → runs the whole pipeline
```

Outputs land in [`output/samples/`](output/samples/):
[`profile.md`](output/samples/profile.md) ·
[`persona_prompt.txt`](output/samples/persona_prompt.txt) ·
`stats.json` · `dataset.jsonl` *(dataset git-ignored even for the sample)*.

## On your real chats

```bash
# 1. install the extractor
bash scripts/setup_chatlog.sh        # installs chatlog via Go

# 2. with WeChat desktop running + logged in:
chatlog                              # TUI: walks you through key → decrypt → serve

# 3. run the pipeline against the live chatlog server
python -m wechat_style_distiller.cli run --from-api --out output --name "Your Name"

#    …or against a JSON dump you exported into data/raw/
python -m wechat_style_distiller.cli run --input data/raw/chatlog.json --out output

# 4. chat in your own voice (needs ANTHROPIC_API_KEY)
python -m wechat_style_distiller.cli chat --persona output/persona_prompt.txt
```

Useful flags: `--talker <id>` to focus on one contact/group, `--time 2024-01-01~2025-01-01`
for a date range, `--no-llm` to skip the API entirely.

## Install

```bash
python -m pip install -e ".[full,dev]"   # full = jieba + anthropic; dev = pytest + ruff
```

The core pipeline runs on the **standard library alone**. `jieba` just improves
Chinese phrase mining; `anthropic` enables the voice summary and chatbot.

## What gets measured

Message length & burst patterns (multiple bubbles in a row), emoji / WeChat-face
frequency, laughter tokens (哈哈 / 233 / hhh), Chinese↔English code-switching
ratio, punctuation tics, opener/closer habits, catchphrases, active hours, and
per-contact tone differences.

## Tests

```bash
make test
```

## Layout

```
src/wechat_style_distiller/   extract · clean · analyze · prompts · distill · chatbot · cli
scripts/setup_chatlog.sh      installs the extractor
examples/make_sample.py       synthetic data generator (fictional)
output/samples/               public sample artifacts (from fake data)
data/                         your real exports (git-ignored)
output/                       your real artifacts (git-ignored)
```

## License

MIT — see [LICENSE](LICENSE). Not affiliated with Tencent or WeChat. Use it on
your own data, responsibly.
