# PM Copilot

AI Product Manager Copilot — transform product ideas into structured documents through an AI-driven workflow.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up API key

Copy `.env.example` to `.env.local` and add your DeepSeek API key:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```
NEXT_PUBLIC_DEEPSEEK_API_KEY=sk-your-actual-key
```

Get your key from: [DeepSeek Platform](https://platform.deepseek.com/api_keys)

### 3. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
Idea Input → Coordinator → Workflow Engine (9 stages) → Prompt Manager → DeepSeek API → Markdown Builder → Result
```

- **Coordinator** — single entry point, model-agnostic
- **Workflow Engine** — state machine (Pending → Running → Completed)
- **Prompt Manager** — loads stage-specific prompts
- **Provider Layer** — swap models without touching UI or workflow

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- DeepSeek API
