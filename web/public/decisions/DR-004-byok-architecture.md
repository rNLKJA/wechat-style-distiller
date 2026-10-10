# DR-004: Client-Side BYOK Architecture for AI Features

**Date**: 2024-01-15  
**Status**: Active  
**Scope**: AI-powered prompt effectiveness testing and persona tuning

## Decision

All AI features use client-side Bring-Your-Own-Key (BYOK) architecture. API keys are stored in browser storage (sessionStorage by default, localStorage opt-in), API calls are made directly from the browser to provider endpoints (Anthropic Messages API, OpenAI API), and keys never touch our servers.

## Context

The upgrade added AI-powered features for career positioning ("statistical rigour + GenAI governance"):

- Prompt effectiveness validation (generate 10 responses per persona, analyze linguistic consistency)
- Interactive persona tuner (adjust parameters with before/after comparison)
- AI audit logging for transparency

Constraints:

- No budget for server-side AI inference
- Privacy-first mandate: chat data must stay local
- Must showcase LLM evaluation and governance practices

## Options Considered

### Option 1: Server-side proxy with API key management

- User provides key once, server stores it (encrypted)
- Frontend requests routed through our backend
- Backend logs all interactions, manages rate limiting

**Rejected**: Requires server infrastructure cost, key custody responsibility, conflicts with privacy-first mandate (server sees all prompts/responses).

### Option 2: Client-side BYOK with direct browser calls (chosen)

- User provides their own Anthropic/OpenAI key
- Key stored in sessionStorage (default) or localStorage (opt-in)
- Direct browser-to-provider API calls using CORS-enabled endpoints
- All audit logging client-side in IndexedDB

**Chosen**: Zero server cost, no key custody, user controls their data and usage.

### Option 3: Static demo with pre-generated responses

- No live AI, only show example outputs
- Showcase methodology without functional AI

**Rejected**: Career positioning requires working LLM evaluation features to demonstrate GenAI governance.

## Why This Decision

Client-side BYOK:

- Aligns with privacy-first architecture (DR-001: local-first processing)
- Demonstrates transparency best practices (full audit trail, explicit key handling)
- Showcases LLM evaluation without server budget
- User keeps full control: their key, their usage, their data

Trade-offs accepted:

- CORS limitations (only providers with browser support)
- No server-side rate limiting (user manages via their API account)
- Key storage in browser (cleared on logout or browser data wipe)
- Slightly higher friction (user must have/paste their key)

## What Happened

Implemented 2024-01-15:

- `AISettingsDialog` component: provider selection (Anthropic/OpenAI), key input with show/hide, storage mode selection
- Direct API calls in `/lib/ai/client.ts` using `anthropic-dangerous-direct-browser-access: true` header for Anthropic, standard Authorization header for OpenAI
- Full audit log stored in IndexedDB: timestamp, feature, provider, model, input/output text, latency, tokens, human decision
- `/ai-log` page for viewing/exporting audit entries (JSON/CSV)
- Privacy page updated with BYOK threat model (what leaks where, mitigation checklist)

**Metrics** (demonstration only, no live key required):

- Site fully functional without API keys (BYOK features properly gated)
- Prompt effectiveness: 10 responses per persona, 4 quantitative metrics with bootstrap CIs
- Persona tuner: 3-slider parameter control, before/after comparison

**Known limitations**:

- Requires user to have Anthropic/OpenAI account and active API key
- No built-in usage warnings (user must monitor their API account)
- Audit log is per-device (clearing browser data loses history)

## What I'd Change

If building this again with a budget:

- Add optional server-side proxy mode (user choice: BYOK or use our credits with usage limits)
- Server-side audit log backup (opt-in, encrypted, exportable)
- Built-in token usage tracking with monthly spend warnings
- Support more providers (Google Gemini, local models via Ollama)

For the current BYOK setup:

- Add estimated token usage preview before generation (help users budget)
- Export/import audit logs for cross-device continuity
- Add "test key" button to validate before running expensive operations
