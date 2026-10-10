# DR-003: Feature Selection

**Date**: 2026-10-15  
**Status**: Active

## Decision

Extract 12+ linguistic features grouped into 5 categories: message shape, expressiveness, language, punctuation, and temporal/contextual patterns. Features are quantitative (counts, ratios, distributions) rather than subjective.

## Context

The goal is to distill a person's texting voice into a compact feature set that can be translated into LLM instructions. Key constraints:

1. **Computable from chat logs**: Features must be extractable from text + metadata (timestamps, sender, recipient) without external data.
2. **Replicable by LLMs**: Features should map to actionable instructions (e.g., "use X emoji per message") rather than abstract style labels (e.g., "friendly tone").
3. **Privacy-aware**: Avoid features that directly leak identity (full message text, contact names, location).
4. **Cross-cultural**: Support EN/ZH code-switching, CJK-specific patterns (WeChat faces, Chinese punctuation).

## Options Considered

### Option A: Semantic embeddings only (rejected)

- Embed each message with a sentence transformer
- Cluster embeddings to find "style archetypes"
- Generate persona prompt from cluster centroids
- **Rejected**: Not interpretable. Hard to translate embeddings into LLM instructions. Requires ML models (breaks stdlib-only constraint).

### Option B: Stylometric features from authorship attribution (rejected)

- Function word frequencies (the, and, of, etc.)
- Lexical diversity (type-token ratio)
- Syntactic complexity (parse tree depth)
- **Rejected**: Requires NLP parsing. Overkill for chat messages (short, informal). Designed for long-form text (essays, novels).

### Option C: Chat-specific linguistic features (chosen)

Extract features that directly correspond to how people text:

**Message Shape**:

- Length distribution (mean, median, p25, p75, p90)
- Bubble bursts (multiple messages in a row)
- Turn-taking speed (time between messages)

**Expressiveness**:

- Emoji frequency + top emoji
- Laughter tokens (哈哈, lol, 233, hhh)

**Language**:

- Code-switching ratio (EN/ZH)
- Catchphrases (top n-grams)
- Openers & closers (conversation patterns)

**Punctuation**:

- Ellipsis, exclamation, question marks, tildes
- No-punctuation rate

**Contextual**:

- Active hours (time-of-day distribution)
- Per-contact tone (avg length by recipient)

## Why

**Interpretability**: Every feature maps to an instruction. "Median 18 chars" → "Keep replies short: median ~18 characters."

**Replicability**: LLMs can follow quantitative targets. "Use 0.3 emoji per message" is actionable; "be friendly" is vague.

**Coverage**: Features span multiple dimensions of texting style (length, expressiveness, language, punctuation, context).

**Lightweight**: All features computed with regex and simple statistics. No ML models, no external APIs.

**Cultural relevance**: Code-switching and CJK-specific patterns (WeChat faces, Chinese laughter tokens) are first-class.

## What Happened

The 12-feature set successfully distinguishes synthetic personas (validated on `/validation` page). Pairwise cosine similarities range from 0.8 to 0.99, indicating personas are similar but distinguishable. Distinctiveness scores range from 0.01 to 0.15.

**Sample feature → instruction mappings** (from persona prompts):

| Feature                       | Instruction                                                         |
| ----------------------------- | ------------------------------------------------------------------- |
| Median 18 chars, p90 36 chars | Keep replies short: median ~18 characters, rarely over 36           |
| 0.3 emoji/turn, top: 🤔👌💻   | ~0.3 emoji per message. Favourites: 🤔👌💻. Use sparingly.          |
| 40% code-switching, 21% Latin | About 21% of words are English; drop English words in naturally     |
| 1.5 bubbles/turn, 40% multi   | Natural to send 1.5 short bubbles in a row (separate with newlines) |
| 70% no end punctuation        | Often skip end punctuation                                          |

**Limitations**:

- No semantic content: Features capture _how_ you text, not _what_ you say (topics, opinions, knowledge). By design (privacy).
- No multi-turn structure: Features are turn-level aggregates. No conversational flow modeling (e.g., response latency, topic shifts).
- No voice/tone inference: Subjective qualities (formality, warmth, sarcasm) are not directly measured.

## What I'd Change

For a research-grade system:

1. **Syntax features**: Dependency parse patterns (requires spaCy). E.g., do you use short imperative sentences vs. long conditional clauses?

2. **Response-latency modeling**: Time to reply as a function of message complexity. Requires timestamp pairing (tricky with WeChat's multi-bubble turns).

3. **Topic-conditioned features**: E.g., "uses more emoji when discussing personal topics vs. work topics". Requires topic classification (ML model).

4. **Validation with real users**: Ask 10 people to rate LLM outputs ("does this sound like me?"). Compare feature-based prompts vs. few-shot example prompts.

For this demo, the lightweight feature set was sufficient to demonstrate the concept.
