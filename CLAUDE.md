# PM Copilot — CLAUDE.md

## Product Identity
**PM Copilot —— Version-Driven AI Product Coach**

让 AI 陪你把一个想法迭代成真正的产品。

核心理念：产品设计过程应该像 Git 管理代码一样被版本化。每一次 AI 优化都会形成一个可回溯、可比较、可恢复的产品版本。

## Development Philosophy
- "产品越来越聚焦" 而不是 "功能越来越多"
- 每一次迭代都必须比上一轮更具体、更接近 MVP
- 对所有的代码改动负责，保证代码在严格的标准下通过审查

## Multi-Agent Collaboration Rules

### Rule 1: File Ownership（谁改什么）
```
Claude Code (CC) owns:
  src/app/page.tsx              — State management & data flow
  src/lib/ai/coordinator.ts     — Execution engine
  src/lib/ai/version-manager.ts — Version data layer
  src/types/index.ts            — Type definitions

Codex owns:
  src/prompts/*.ts              — All AI prompts
  src/components/coach/*.tsx    — Coach panel
  src/components/markdown/*.tsx — UI display components
  src/components/workspace/*.tsx — Workspace & timeline UI
```

### Rule 2: Git Sync（同步铁律）
```
Before ANY change:
  git pull

After ANY change:
  git add -A
  git commit -m "descriptive message"
  git push
```

### Rule 3: CC is Gatekeeper（CC 最终审核）
```
Workflow:
  1. Codex generates code
  2. CC reviews against acceptance criteria
  3. CC fixes bugs / data flow issues
  4. CC commits & pushes

Codex NEVER commits directly to main.
CC is the final gatekeeper for ALL commits.
```

### Rule 4: No Concurrent Edits（不并行修改）
```
Only ONE agent modifies code at a time.
If Codex is running, wait for it to finish before CC starts.
If CC is fixing, Codex should read the latest code before starting.
```

## Architecture Reference
```
UI (Workspace + MarkdownViewer)
  ↕ Props & Callbacks
Page (State Management)
  ↕ CoordinatorCallbacks
Coordinator (Execution Engine)
  ↕ VersionManager
VersionManager (Data Layer + Versions)

Data flow: Idea → Generate → 9-step Workflow → Review JSON → Coach → Version(n)
           → Optimize (delta) → Version(n+1)
```

## Key Constraints
- No login / auth / Dashboard / MCP / RAG / multi-model
- No new UI pages
- Focus: Version-driven AI Product Coach
- Best Version logic: P0 count > Maturity > Score > Latest
- Stop condition: 3 iterations without P0 decrease
