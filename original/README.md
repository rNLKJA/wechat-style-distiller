# WeChat Style Distiller — Original Pipeline

This directory contains the original Python pipeline that extracts linguistic style profiles from WeChat chat histories.

## What it does

Turn your own WeChat history into:

1. **Style profile** (`profile.md`) — how you actually text (length, emoji, catchphrases, code-switching)
2. **Persona prompt** (`persona_prompt.txt`) — a system prompt that makes any LLM reply in your voice
3. **Chat dataset** (`dataset.jsonl`) — context → reply pairs for few-shot or fine-tuning
4. **Statistics** (`stats.json`) — quantitative linguistic features

## Privacy guarantees

**Local-first and privacy-preserving:**
- Chat data is read on your machine only
- All outputs written to git-ignored folders
- Nothing is committed or uploaded
- Network calls only for optional LLM chatbot (requires your own Anthropic API key)

## How to run locally

### Demo mode (no WeChat, no API key)

```bash
cd original
make demo
```

Generates synthetic data and runs the full pipeline. Outputs land in `output/samples/`.

### On your real chats

```bash
# 1. Install the extractor
bash scripts/setup_chatlog.sh

# 2. With WeChat desktop running + logged in:
chatlog    # TUI: walks you through decryption

# 3. Run the pipeline
python -m wechat_style_distiller.cli run --from-api --out output --name "Your Name"

# 4. Chat in your own voice (needs ANTHROPIC_API_KEY)
python -m wechat_style_distiller.cli chat --persona output/persona_prompt.txt
```

### Install dependencies

```bash
cd original
python -m pip install -e ".[full,dev]"
```

Core pipeline runs on standard library alone. `jieba` improves Chinese phrase mining; `anthropic` enables voice summary and chatbot.

## What gets measured

- Message length & burst patterns (multiple bubbles in a row)
- Emoji / WeChat-face frequency
- Laughter tokens (哈哈 / 233 / hhh)
- Chinese↔English code-switching ratio
- Punctuation tics
- Opener/closer habits
- Catchphrases
- Active hours
- Per-contact tone differences

## Features

- **Register-aware personas** (`--by-register`): separate prompts for different contexts (work vs friends)
- **Alignment evaluation** (`eval`): measures how close generated replies match your style
- **Auto-tune** (`tune`): iteratively improves persona prompt based on measured gaps
- **Thinking profile**: layer reasoning style on top of messaging style

See [TOOL-README.md](TOOL-README.md) for full documentation.
