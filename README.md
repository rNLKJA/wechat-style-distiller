# WeChat Style Distiller — Methodology Showcase

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://wechat-style-distiller-demo.vercel.app)
[![GitHub](https://img.shields.io/badge/github-rNLKJA%2Fwechat--style--distiller-blue)](https://github.com/rNLKJA/wechat-style-distiller)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Turn your WeChat chat history into a linguistic style profile and a persona prompt that makes any LLM reply in your voice. **Privacy-first**: all analysis runs locally, your chat data never leaves your machine.

🔗 **[Live Demo](https://wechat-style-distiller-demo.vercel.app)** — Explore the methodology with synthetic personas | 📖 **[Original Tool Documentation](original/README.md)**

---

## What This Project Is

### The Original Tool (in `original/`)

A **local-first Python NLP pipeline** that:

1. **Extracts** your WeChat messages (via the [chatlog](https://github.com/qiqq/chatlog) tool)
2. **Analyzes** 12+ linguistic features (message length, emoji usage, code-switching EN/ZH, catchphrases, punctuation habits)
3. **Generates** a style profile (`profile.md`) and a persona prompt (`persona_prompt.txt`) that encodes your texting voice
4. **Optionally** runs a chatbot (BYOK, Anthropic API) that replies like you

**Privacy guarantee**: Everything runs on your machine. No network calls except the optional chatbot (which uses your own API key).

### This Demo Site (in `web/`)

A **Next.js methodology showcase** that demonstrates how the tool works using **synthetic personas only**. It does not access real user data. Features:

- **Pipeline visualizer**: Step-by-step breakdown of Extract → Clean → Analyze → Distill
- **Synthetic persona gallery**: 6 pre-generated personas with varied linguistic patterns
- **Feature explainer**: Interactive breakdown of the 12+ features with examples
- **Prompt engineering**: How linguistic features map to LLM instructions
- **Privacy-first design**: Explains local-first processing and data flow
- **Feature validation**: Statistical analysis with confidence intervals, inter-persona variance
- **Persona similarity**: Pairwise comparisons in 6D feature space (cosine similarity)
- **Matching quiz**: "Which persona are you?" — 5-question matcher
- **Prompt effectiveness testing**: Generate 10 responses per persona and analyze linguistic consistency (BYOK)
- **Persona tuner**: Interactive parameter adjustment (formality, emoji, verbosity) with before/after comparison (BYOK)
- **AI audit log**: Transparency log for all BYOK features with JSON/CSV export (stored client-side)
- **Privacy threat model**: Detailed analysis of what could leak and mitigation checklist
- **Methods & decision records**: Methodology, assumptions, limitations, and architectural decisions
- **Decision records**: DR-001 (local-first), DR-002 (synthetic data), DR-003 (feature selection)

---

## Repository Structure

```
wechat-style-distiller/
├── README.md                    # This file
├── LICENSE                      # MIT License
├── .gitignore                   # Ignores data/, .env*, node_modules, etc.
├── .github/workflows/ci.yml     # CI: lint, typecheck, test, build
├── original/                    # The original Python tool (moved with git mv)
│   ├── README.md                # Tool documentation, installation, privacy
│   ├── pyproject.toml           # Python project config
│   ├── Makefile                 # make demo, make test
│   ├── wechat_style_distiller/  # Python package
│   │   ├── extract.py           # Stage 1: Read WeChat DB
│   │   ├── clean.py             # Stage 2: Structure turns
│   │   ├── analyze.py           # Stage 3: Linguistic features
│   │   ├── distill.py           # Stage 4: Generate profile + prompt
│   │   └── chatbot.py           # Optional: chat in your voice
│   ├── tests/                   # Python tests
│   └── output/                  # Generated profiles (git-ignored)
├── scripts/                     # Data generation scripts
│   └── generate_synthetic_personas.py  # Creates demo personas
└── web/                         # Next.js showcase app (Vercel root)
    ├── package.json             # Node project config
    ├── next.config.ts           # Next.js config (static export)
    ├── tsconfig.json            # TypeScript strict mode
    ├── vitest.config.ts         # Vitest test config
    ├── public/data/personas/    # Generated persona data (committed)
    └── src/
        ├── app/                 # Next.js App Router
        │   ├── layout.tsx       # Root layout, fonts, theme
        │   ├── page.tsx         # Landing page
        │   ├── pipeline/        # Pipeline explainer
        │   ├── personas/        # Persona gallery + detail pages
        │   ├── features/        # Feature breakdown
        │   ├── privacy/         # Privacy guarantees
        │   └── install/         # Installation guide
        ├── components/          # React components
        │   └── layout/          # Header, footer
        └── lib/                 # TypeScript utilities
            ├── types.ts         # Persona types
            ├── personas.ts      # Data loading
            └── utils.ts         # Shared utils
```

---

## Tech Stack

### Original Tool
- **Language**: Python 3.12+
- **Dependencies**: Standard library (analysis), `jieba` (optional, better Chinese segmentation), `anthropic` (optional, chatbot)
- **Runs**: macOS, Linux

### Demo Website
- **Framework**: [Next.js 16](https://nextjs.org) (App Router, static export)
- **Language**: TypeScript (strict mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **Icons**: [Lucide React](https://lucide.dev)
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes) (light/dark mode)
- **Testing**: [Vitest](https://vitest.dev)
- **Statistics**: Bootstrap CIs, Wilson score intervals, cosine similarity
- **AI Integration**: Optional BYOK (Anthropic/OpenAI), client-side only
- **Deployment**: [Vercel](https://vercel.com) (free tier, static hosting)

---

## Local Development

### Run the Original Tool

```bash
cd original

# Demo mode (no WeChat, no API key)
make demo

# Real usage (requires WeChat desktop + chatlog tool)
bash scripts/setup_chatlog.sh
chatlog  # Extract your chats
python -m wechat_style_distiller.cli run --from-api --out output --name "Your Name"
```

See [original/README.md](original/README.md) for full documentation.

### Run the Demo Website

```bash
cd web

# Install dependencies
pnpm install --frozen-lockfile

# Start dev server
pnpm dev
# → http://localhost:3000

# Type-check
pnpm typecheck

# Lint
pnpm lint

# Test
pnpm test

# Build (static export)
pnpm build
```

---

## How Data Is Generated

The demo website uses **synthetic personas** created by [`scripts/generate_synthetic_personas.py`](scripts/generate_synthetic_personas.py):

1. Script generates 150+ synthetic messages per persona with varied linguistic patterns
2. Runs the original pipeline (`wechat_style_distiller.analyze`, `wechat_style_distiller.distill`)
3. Outputs `metadata.json`, `stats.json`, `profile.md`, `persona_prompt.txt` to `web/public/data/personas/{id}/`
4. These files are committed so the demo works without re-running the pipeline

To regenerate:

```bash
# Requires Python 3.12+ and uv (or python3)
uv run scripts/generate_synthetic_personas.py
# or
python3 scripts/generate_synthetic_personas.py
```

---

## Privacy & Ethics

### Original Tool
- **Local-first**: All analysis runs on your machine
- **No telemetry**: Zero tracking, no metrics collection
- **Git-ignored data**: Chat data written to folders that are never committed
- **Optional API calls**: Chatbot requires BYOK (your own Anthropic API key), entirely opt-in
- **Open source**: MIT licensed, auditable

### Demo Site
- **No real data**: Uses synthetic personas only
- **No upload**: Does not ask for or accept user chat data
- **No tracking**: No analytics, no cookies (beyond Vercel defaults)

See the [Privacy page](https://wechat-style-distiller-demo.vercel.app/privacy) for full details.

---

## Key Features Analyzed

The tool extracts 12+ linguistic features:

1. **Message length** (mean, median, percentiles)
2. **Bubble bursts** (multiple messages in a row)
3. **Emoji frequency** (Unicode + WeChat faces)
4. **Laughter tokens** (哈哈, 233, lol, hhh)
5. **Code-switching** (EN/ZH ratio)
6. **Punctuation habits** (ellipsis, exclamation, tilde, skipped punctuation)
7. **Catchphrases** (most-used n-grams)
8. **Openers & closers** (conversation patterns)
9. **Active hours** (time-of-day distribution)
10. **Per-contact tone** (formal vs casual by recipient)

These map to LLM instructions in the persona prompt, e.g.:

- `Median 18 chars, p90 36 chars` → *"Keep replies short: median ~18 characters, rarely over 36"*
- `40% code-switching` → *"About 40% of words are English; drop English words in naturally"*

---

## About

**Personal NLP project** by [Sunchuangyu Huang](https://github.com/rNLKJA), 2026.

- **Not affiliated with WeChat/Tencent**. This is an independent analysis tool.
- **Original coursework**: N/A (personal project, not university coursework)
- **Collaborators**: Solo project
- **License**: MIT (see [LICENSE](LICENSE))

---

## Credits

- **WeChat extraction**: Powered by [chatlog](https://github.com/qiqq/chatlog) (MIT licensed)
- **Chinese segmentation**: Optional [jieba](https://github.com/fxsjy/jieba) for better phrase mining
- **Chatbot**: Anthropic Claude API (BYOK, opt-in)

---

## Career Positioning

This project showcases **statistical rigour + GenAI governance**, aligning with target roles: Statistician / ML Engineer / Algorithm Engineer. Key demonstrations:

- **Statistical depth**: Bootstrap CIs, Wilson score intervals, inter-persona variance, correlation matrices
- **GenAI fluency with governance**: BYOK architecture, audit logs, transparency statements, privacy-first design
- **Evaluation rigor**: Feature validation, persona distinctiveness metrics, pairwise similarity analysis
- **Documentation**: Decision records (DR-001/002/003), methods page, AI use statement

All confidence intervals computed with fixed seeds for reproducibility. No vanity metrics, no unsubstantiated claims.

## Links

- 🌐 **Live Demo**: [wechat-style-distiller-demo.vercel.app](https://wechat-style-distiller-demo.vercel.app)
- 📦 **GitHub**: [rNLKJA/wechat-style-distiller](https://github.com/rNLKJA/wechat-style-distiller)
- 📖 **Tool Docs**: [original/README.md](original/README.md)
- 🔒 **Privacy**: [Privacy page](https://wechat-style-distiller-demo.vercel.app/privacy)
- 📊 **Validation**: [Feature Validation](https://wechat-style-distiller-demo.vercel.app/validation)
- 📋 **Methods**: [Methodology & Decision Records](https://wechat-style-distiller-demo.vercel.app/methods)

---

**Built with Next.js, TypeScript, and Tailwind CSS. Deployed on Vercel.**
