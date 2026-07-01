# AI Product Evolution Engine

**Version-based State Machine for AI Product Iteration**

> We transform LLM from a generator into a **state transition executor**. AI does not generate — it evolves.

---

## Problem

Traditional AI product tools have a fundamental flaw:

| Problem | Consequence |
|---|---|
| **Regenerates PRDs from scratch** | No version continuity — each run is a fresh start |
| **No convergence mechanism** | Quality oscillates: 72 → 80 → 74 → 76 |
| **AI treated as a generator** | Output drifts; product direction changes uncontrollably |
| **No issue lifecycle tracking** | Same problems flagged repeatedly across iterations |

The result: you don't get a product that improves — you get a product that changes.

---

## Core Innovation

### 1. Version as Single Source of Truth

Every AI step reads from `Version(n)`, never from the raw Idea. Versions are immutable and permanently preserved.

```
V1 → V2 → V3 → V4 → V5
      ↓    ↓
    Best   Latest
```

**Latest ≠ Best.** The system independently tracks both.

### 2. AI as State Modifier, Not Generator

AI does not "generate a PRD." It **modifies product state**:

```
Version(n) → [AI modifies state] → Version(n+1)
```

Every output must be derivable from the previous version. No free-form generation.

### 3. Patch-Based Optimizer

The Optimizer outputs **field-level diffs only** — never full regeneration:

```json
{
  "target_user": { "from": "...", "to": "..." },
  "core_value":  { "from": "...", "to": "..." },
  "scope":       { "from": "...", "to": "..." }
}
```

No new features. No scope creep. Only targeted fixes for Review-identified issues.

### 4. Product Scope Lock (V2+)

After Version 1, product direction is **locked**:

- ❌ No new user segments
- ❌ No new product categories  
- ❌ No new business models
- ✅ Refine existing scope only
- ✅ Fix issues from Review
- ✅ Clarify value proposition

The system enforces **convergence**, not divergence.

---

## System Architecture

```
Idea
  ↓
Version(n) ──────────────────────────────────────────────┐
  ↓                                                       │
Workflow Engine (9-step)                                  │
  Clarification → Requirement → Product Design            │
  → Flow → Database → API → Test → Dev Prompt → Review    │
  ↓                                                       │
Review Engine (state-aware, issue lifecycle tracking)     │
  ↓                                                       │
Coach Agent                                               │
  ↓                                                       │
Optimizer (patch-only, field-level delta)                 │
  ↓                                                       │
Version(n+1) ─────────────────────────────────────────────┘
```

### Convergence: P0-Driven

The system converges when **P0 issues stop decreasing** for 3 consecutive iterations — not when a score target is hit. Quality is measured by problems eliminated, not points gained.

```
Round 1: P0 × 3, P1 × 4
Round 2: P0 × 1, P1 × 3
Round 3: P0 × 0, P1 × 2
Round 4: MVP Ready ✓
```

---

## Core Modules

| Module | Role |
|---|---|
| **Version State Manager** | Immutable version store; Best/Latest/Current tracking |
| **9-Step Workflow Engine** | Pending → Running → Completed state machine |
| **AI Review Engine** | State-aware: tracks resolved/persisting/regressed/new issues |
| **Patch Optimizer** | Field-level delta engine; never regenerates |
| **Markdown Builder** | Incremental streaming output |
| **Provider Layer** | Model-agnostic (DeepSeek, GPT, Claude, Gemini) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| AI Provider | DeepSeek API (swappable) |
| UI | Streaming real-time output |

---

## Quick Start

```bash
# Install
npm install

# Configure API key
cp .env.example .env.local
# Edit .env.local: NEXT_PUBLIC_DEEPSEEK_API_KEY=sk-...

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Summary

This is **not** an AI PRD generator. It is an **AI state machine** that enforces structured product evolution:

- ✅ All versions permanently preserved
- ✅ AI modifies state, never regenerates
- ✅ Optimizer is patch-only — no scope creep
- ✅ Product direction locked after V1
- ✅ P0-driven convergence, not score-chasing
- ✅ Model-agnostic provider layer

**PM Copilot: let AI evolve your product idea into an investable specification — one controlled state transition at a time.**

---

MIT License