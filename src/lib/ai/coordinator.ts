import { WorkflowStep, StreamedSection, Language } from "@/types"
import { WorkflowEngine, WorkflowStepId } from "./workflow-engine"
import { MarkdownBuilder } from "./markdown-builder"
import { ProviderError } from "./provider"
import { getProvider, getConfig } from "./providers"
import {
  CLARIFICATION_PROMPT,
  REQUIREMENT_PROMPT,
  PRD_PROMPT,
  FLOW_PROMPT,
  DATABASE_PROMPT,
  API_PROMPT,
  TEST_PROMPT,
  DEV_PROMPT_PROMPT,
  REVIEW_PROMPT,
} from "@/prompts"

const SECTION_TITLES: Record<WorkflowStepId, Record<Language, string>> = {
  clarification: { en: "## Clarification\n\n", zh: "## 需求澄清\n\n" },
  requirement: { en: "## Requirements\n\n", zh: "## 需求文档\n\n" },
  "product-design": { en: "## Product Design\n\n", zh: "## 产品设计\n\n" },
  flow: { en: "## User Flows\n\n", zh: "## 用户流程\n\n" },
  database: { en: "## Database Schema\n\n", zh: "## 数据库设计\n\n" },
  api: { en: "## API Design\n\n", zh: "## API设计\n\n" },
  test: { en: "## Test Plan\n\n", zh: "## 测试计划\n\n" },
  "dev-prompt": { en: "## Development Prompt\n\n", zh: "## 开发指南\n\n" },
  "ai-review": { en: "## AI Review\n\n", zh: "## AI审查\n\n" },
}

/** External prompt library — single source of truth for all module prompts */
const SYSTEM_PROMPTS: Record<WorkflowStepId, Record<Language, string>> = {
  clarification: CLARIFICATION_PROMPT,
  requirement: REQUIREMENT_PROMPT,
  "product-design": PRD_PROMPT,
  flow: FLOW_PROMPT,
  database: DATABASE_PROMPT,
  api: API_PROMPT,
  test: TEST_PROMPT,
  "dev-prompt": DEV_PROMPT_PROMPT,
  "ai-review": REVIEW_PROMPT,
}

export interface CoordinatorCallbacks {
  onStepStart: (step: WorkflowStep, steps: WorkflowStep[]) => void
  onStepComplete: (step: WorkflowStep, section: StreamedSection, allSections: StreamedSection[], allSteps: WorkflowStep[]) => void
  onStreamChunk: (stepId: WorkflowStepId, delta: string) => void
  onComplete: (allSections: StreamedSection[]) => void
  onError: (stepId: WorkflowStepId, error: Error) => void
}

export class Coordinator {
  private workflow: WorkflowEngine
  private builder: MarkdownBuilder
  private aborted = false

  constructor() {
    this.workflow = new WorkflowEngine()
    this.builder = new MarkdownBuilder()
  }

  async execute(idea: string, language: Language, callbacks: CoordinatorCallbacks): Promise<void> {
    this.workflow.reset()
    this.builder.reset()
    this.aborted = false

    const provider = getProvider()
    const config = getConfig()
    const stepIds = [...this.workflow.getStepIds()]

    for (const stepId of stepIds) {
      if (this.aborted) break

      const step = this.workflow.startCurrentStep()
      if (!step) break

      callbacks.onStepStart(step, this.workflow.getSteps())

      try {
        const systemPrompt = SYSTEM_PROMPTS[stepId]?.[language] ?? SYSTEM_PROMPTS[stepId]?.en ?? ""
        const userPrompt = language === "zh"
          ? `产品想法：${idea}`
          : `Product Idea: ${idea}`

        let streamedContent = ""
        await provider.generateStream(systemPrompt, userPrompt, config, (delta) => {
          streamedContent += delta
          callbacks.onStreamChunk(stepId, delta)
        })

        if (this.aborted) break

        const title = SECTION_TITLES[stepId]?.[language] ?? `## ${stepId}\n\n`
        const section: StreamedSection = {
          stepId,
          title,
          content: streamedContent + "\n\n",
        }

        this.builder.append(section)
        this.workflow.completeCurrentStep()
        callbacks.onStepComplete(step, section, this.builder.getSections(), this.workflow.getSteps())
      } catch (error) {
        this.workflow.markError(stepId)
        callbacks.onError(stepId, error instanceof Error ? error : new Error(String(error)))

        if (error instanceof ProviderError && error.code === "missing_key") {
          this.aborted = true
          break
        }
        this.workflow.skipCurrentStep()
      }
    }

    if (!this.aborted) {
      callbacks.onComplete(this.builder.getSections())
    }
  }

  abort(): void {
    this.aborted = true
  }
}

export const coordinator = new Coordinator()
