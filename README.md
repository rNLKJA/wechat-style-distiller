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

## You don't text everyone the same (registers)

Add `--by-register` to write a separate persona prompt per register, because
your work-group voice isn't your close-friend voice:

```bash
# default: splits group chats vs one-on-one
python -m wechat_style_distiller.cli run --input data/raw/chatlog.json --out output --by-register

# or define your own registers by contact
echo '{"sunny_wxid": "close", "boss_wxid": "work"}' > config/register_map.json
python -m wechat_style_distiller.cli run --from-api --out output \
  --by-register --register-map config/register_map.json
```

You get `persona_prompt.close.txt`, `persona_prompt.work.txt`, etc. Registers
with too few messages to model are skipped.

## Is it actually you? (alignment)

"Aligned with how I talk" is a claim, so the tool measures it instead of
asserting it. The `eval` command fingerprints your style (length, emoji rate,
laughter, code-switching, bubble bursts, punctuation) and scores how close the
persona's replies sit to it, plus how often your reasoning voice (why / evidence)
shows up:

```bash
python -m wechat_style_distiller.cli eval \
  --persona output/persona_prompt.txt --stats output/stats.json \
  --out output/alignment_report.md          # needs ANTHROPIC_API_KEY to generate replies
```

The scorer is validated offline: in tests, real-style replies score ~89/100
against the target while a generic-assistant baseline scores ~28/100. Low-scoring
features tell you exactly where the prompt still drifts, so each tuning pass is
evidence-driven rather than vibes.

### Auto-tune

`tune` closes the loop: it generates replies, scores them, finds the features
that drift most, and appends targeted corrections to the prompt — each one
citing the measured gap (e.g. *"replies running long, median ~55 vs your ~12,
cut them shorter"*) — then repeats until the score plateaus or clears a threshold.

```bash
python -m wechat_style_distiller.cli tune \
  --persona output/persona_prompt.txt --stats output/stats.json \
  --rounds 3 --threshold 85 --out output/persona_prompt.tuned.txt   # needs ANTHROPIC_API_KEY
```

The correction logic is pure and unit-tested; only the generate-and-score step
needs an API key.

## How you reason, not just how you type

Short chat bubbles reveal *how you text* but not *how you think*. So reasoning
style is authored once in `config/thinking_profile.json` (first-principles,
fact-driven, why-seeking, reason-backed, logical) and layered into the persona
prompt as its own sections. Copy
[`config/thinking_profile.example.json`](config/thinking_profile.example.json)
to `config/thinking_profile.json` (git-ignored) and edit. Disable with
`--no-thinking`.

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
