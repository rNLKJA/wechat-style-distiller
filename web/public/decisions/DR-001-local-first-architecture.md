# DR-001: Local-First Architecture

**Date**: 2026-10-15  
**Status**: Active

## Decision

All chat data analysis runs locally on the user's machine. No cloud backend, no data upload, no server-side processing.

## Context

WeChat chat history contains highly personal data: conversations with friends, family, colleagues, romantic partners. Message content reveals:

- Social relationships and network structure
- Communication patterns and emotional tone
- Code-switching behavior (language identity)
- Timestamps (daily routines, sleep patterns)
- Contact names and organizational affiliations

Sending this data to a cloud service would require:

1. User trust that we handle data responsibly
2. Infrastructure to secure data in transit and at rest
3. Compliance with data protection regulations (GDPR, CCPA, Australian Privacy Principles)
4. Ongoing operational costs and maintenance
5. Clear data retention and deletion policies

## Options Considered

### Option A: Cloud-based SaaS (rejected)

- User uploads WeChat database to our server
- Analysis runs server-side (faster, scalable)
- Results stored in user account
- **Rejected**: Privacy risk too high, operational complexity, user trust barrier

### Option B: Local-first with optional cloud sync (rejected)

- Analysis runs locally by default
- Optional cloud backup of generated profiles (not raw chat data)
- **Rejected**: Still requires backend infrastructure, sync complexity, partial privacy guarantee

### Option C: Pure local-first (chosen)

- Python CLI tool runs entirely on user's machine
- No network calls except optional BYOK chatbot (user's own API key)
- Chat data written to git-ignored folders, never committed
- Demo site uses synthetic personas only, no data collection

## Why

**Privacy**: User retains full control. Data never leaves their machine. No trust required.

**Simplicity**: No backend to build, secure, or pay for. No auth, no database, no ops.

**Transparency**: Open-source Python pipeline. Users can audit every line.

**Cost**: Free to run indefinitely. No usage limits, no subscription.

**Compliance**: No data processing = no regulatory burden.

## What Happened

The local-first architecture worked. The Python tool successfully analyzes WeChat databases on macOS with zero network dependencies (except optional chatbot). Users who tried it appreciated the privacy guarantee.

**Trade-offs accepted**:

- Installation friction (requires Python 3.12+, chatlog tool, WeChat desktop)
- No cross-device sync
- No hosted service for non-technical users
- Limited to desktop platforms (macOS, Linux)

**Metrics** (as of 2026-10-15, based on test runs with synthetic data):

- Analysis speed: ~150 messages/second on M2 MacBook Air
- Memory footprint: <100 MB for 10k messages
- Dependencies: stdlib only (optional: jieba for Chinese, anthropic for chatbot)

## What I'd Change

If building this as a commercial product for non-technical users, I'd consider:

1. **Browser-based tool**: WASM-compiled Python or pure JS implementation that runs in the browser. Still local-first, but zero installation.

2. **Mobile support**: iOS/Android apps with local processing. Harder to extract WeChat data on mobile (app sandboxing), but possible with export features.

3. **Differential privacy**: If any aggregate statistics were shared (e.g., "average message length across 1000 users"), add noise via differential privacy to prevent re-identification.

For this personal project, pure local CLI + demo site was the right trade-off.
