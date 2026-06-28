import { WorkflowStep, StreamedSection, Language, CoachOutput } from "@/types"
import { WorkflowEngine, WorkflowStepId } from "./workflow-engine"
import { MarkdownBuilder } from "./markdown-builder"
import { ProviderError } from "./provider"
import { getProvider, getConfig } from "./providers"
import {
  CLARIFICATION_PROMPT, REQUIREMENT_PROMPT, PRD_PROMPT,
  FLOW_PROMPT, DATABASE_PROMPT, API_PROMPT,
  TEST_PROMPT, DEV_PROMPT_PROMPT, REVIEW_PROMPT, COACH_PROMPT,
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

const SYSTEM_PROMPTS: Record<WorkflowStepId, Record<Language, string>> = {
  clarification: CLARIFICATION_PROMPT, requirement: REQUIREMENT_PROMPT,
  "product-design": PRD_PROMPT, flow: FLOW_PROMPT,
  database: DATABASE_PROMPT, api: API_PROMPT,
  test: TEST_PROMPT, "dev-prompt": DEV_PROMPT_PROMPT,
  "ai-review": REVIEW_PROMPT,
}

export interface CoordinatorCallbacks {
  onStepStart: (step: WorkflowStep, steps: WorkflowStep[]) => void
  onStepComplete: (step: WorkflowStep, section: StreamedSection, allSections: StreamedSection[], allSteps: WorkflowStep[]) => void
  onStreamChunk: (stepId: WorkflowStepId, delta: string) => void
  onComplete: (allSections: StreamedSection[]) => void
  onCoachReady: (coach: CoachOutput) => void
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
        const userPrompt = language === "zh" ? `产品想法：${idea}` : `Product Idea: ${idea}`

        let streamedContent = ""
        await provider.generateStream(systemPrompt, userPrompt, config, (delta) => {
          streamedContent += delta
          callbacks.onStreamChunk(stepId, delta)
        })
        if (this.aborted) break

        const title = SECTION_TITLES[stepId]?.[language] ?? `## ${stepId}\n\n`
        const section: StreamedSection = { stepId, title, content: streamedContent + "\n\n" }
        this.builder.append(section)
        this.workflow.completeCurrentStep()
        callbacks.onStepComplete(step, section, this.builder.getSections(), this.workflow.getSteps())
      } catch (error) {
        this.workflow.markError(stepId)
        callbacks.onError(stepId, error instanceof Error ? error : new Error(String(error)))
        if (error instanceof ProviderError && error.code === "missing_key") { this.aborted = true; break }
        this.workflow.skipCurrentStep()
      }
    }

    if (!this.aborted) {
      callbacks.onComplete(this.builder.getSections())
      // Generate coach report
      await this.generateCoach(language, callbacks)
    }
  }

  /** Generate coach report from full spec + review */
  private async generateCoach(language: Language, callbacks: CoordinatorCallbacks): Promise<void> {
    const provider = getProvider()
    const config = getConfig()
    const allContent = this.builder.getFullContent()

    try {
      const systemPrompt = COACH_PROMPT[language] ?? COACH_PROMPT.en
      const userPrompt = language === "zh"
        ? `以下是完整的产品规格文档和AI审查，请生成教练报告：\n\n${allContent}`
        : `Below is the complete product spec and AI review. Generate a coach report:\n\n${allContent}`

      const rawJson = await provider.generate(systemPrompt, userPrompt, config)
      const cleaned = rawJson.replace(/```json|```/g, "").trim()
      const coach: CoachOutput = JSON.parse(cleaned)
      callbacks.onCoachReady(coach)
    } catch {
      // Coach is non-critical — provide fallback with actionable fields
      callbacks.onCoachReady({
        maturity: { level: "L1", score: 20, nextStage: language === "zh" ? "完善产品规格并重新审查" : "Refine the product spec and re-review" },
        topIssues: [
          {
            priority: "P0",
            title: language === "zh" ? "产品规格待细化" : "Product spec needs refinement",
            cause: language === "zh" ? "当前规格缺少足够的细节和深度" : "Current spec lacks sufficient detail and depth",
            solution: language === "zh" ? "为每个模块添加更具体的需求和验收标准" : "Add more specific requirements and acceptance criteria for each module",
            expectedBenefit: language === "zh" ? "提升规格可执行性，工程师可直接开发" : "Improved spec executability — engineers can build directly",
          },
          {
            priority: "P0",
            title: language === "zh" ? "技术设计需要验证" : "Technical design needs validation",
            cause: language === "zh" ? "API 设计和数据库架构可能未覆盖所有边界情况" : "API design and DB schema may not cover all edge cases",
            solution: language === "zh" ? "在高负载和异常场景下验证 API 和数据库设计" : "Validate API and DB design under high-load and failure scenarios",
            expectedBenefit: language === "zh" ? "减少生产环境故障风险" : "Reduce production failure risk",
          },
          {
            priority: "P1",
            title: language === "zh" ? "用户体验流程需要测试" : "UX flow needs testing",
            cause: language === "zh" ? "用户流程未经真实用户验证" : "User flows haven't been tested with real users",
            solution: language === "zh" ? "进行快速可用性测试（5 名用户即可）" : "Run a quick usability test with 5 users",
            expectedBenefit: language === "zh" ? "发现并修复关键 UX 问题" : "Identify and fix critical UX issues",
          },
        ],
        coachAdvice: language === "zh"
          ? "继续迭代改进产品规格，重点关注需求的具体性和技术设计的完整性。"
          : "Continue iterating to improve the spec, focusing on requirement specificity and technical design completeness.",
      })
    }
  }

  /** Generate an improved idea based on original idea + coach feedback + history (for convergence) */
  async generateImprovedIdea(
    originalIdea: string,
    coachOutput: CoachOutput,
    language: Language,
    previousIssues?: string[]
  ): Promise<string> {
    const provider = getProvider()
    const config = getConfig()

    const currentIssues = coachOutput.topIssues
      .map((i) => `- [${i.priority}] ${i.title}: ${i.solution}`)
      .join("\n")

    // Include history so the LLM converges instead of repeating
    const historyBlock = previousIssues?.length
      ? (language === "zh"
          ? `\n\n前几轮已识别的历史问题（请勿重复）：\n${previousIssues.join("\n")}`
          : `\n\nPreviously identified issues from earlier rounds (do NOT repeat):\n${previousIssues.join("\n")}`)
      : ""

    const systemPrompt = language === "zh"
      ? `你是一位产品经理。基于原始产品想法和最新AI审查反馈，生成一个改进后的产品想法描述。保留原始想法的核心，根据反馈建议优化。避免重复历史问题。输出1-3句话的改进后产品想法。仅输出想法文本，不要Markdown标记。`
      : `You are a product manager. Based on the original product idea and the latest AI review feedback, generate an improved product idea description. Keep the core of the original idea, optimize based on feedback. Avoid repeating historically identified issues. Output 1-3 sentences of the improved idea. Only output the idea text, no markdown.`

    const userPrompt = language === "zh"
      ? `原始想法：${originalIdea}\n\n最新审查反馈：\n${currentIssues}${historyBlock}\n\n请输出改进后的产品想法。`
      : `Original Idea: ${originalIdea}\n\nLatest Review Feedback:\n${currentIssues}${historyBlock}\n\nOutput the improved product idea.`

    const improved = await provider.generate(systemPrompt, userPrompt, config)
    return improved.trim()
  }

  abort(): void { this.aborted = true }
}

export const coordinator = new Coordinator()
