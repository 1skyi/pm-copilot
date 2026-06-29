import { WorkflowStep, StreamedSection, Language, ReviewJson, CoachOutput, CoachIssueAnalysis, IterationContext, IterationRecord, ConvergenceResult, ConvergenceStatus } from "@/types"
import { WorkflowEngine, WorkflowStepId } from "./workflow-engine"
import { MarkdownBuilder } from "./markdown-builder"
import { ProviderError } from "./provider"
import { getProvider, getConfig } from "./providers"
import {
  CLARIFICATION_PROMPT, REQUIREMENT_PROMPT, PRD_PROMPT,
  FLOW_PROMPT, DATABASE_PROMPT, API_PROMPT,
  TEST_PROMPT, DEV_PROMPT_PROMPT, REVIEW_PROMPT, COACH_PROMPT, OPTIMIZER_PROMPT,
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
  onReviewReady: (review: ReviewJson) => void
  onCoachReady: (coach: CoachOutput) => void
  onConvergence: (result: ConvergenceResult) => void
  onError: (stepId: WorkflowStepId, error: Error) => void
}

export class Coordinator {
  private workflow: WorkflowEngine
  private builder: MarkdownBuilder
  private aborted = false
  private iterationContexts: IterationContext[] = []
  private consecutiveLowGain = 0

  constructor() {
    this.workflow = new WorkflowEngine()
    this.builder = new MarkdownBuilder()
  }

  /** Execute full workflow for one iteration round */
  async execute(idea: string, language: Language, callbacks: CoordinatorCallbacks): Promise<void> {
    this.workflow.reset()
    this.builder.reset()
    this.aborted = false

    const provider = getProvider()
    const config = getConfig()
    const stepIds = [...this.workflow.getStepIds()]
    const round = this.iterationContexts.length + 1

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

    if (this.aborted) return
    callbacks.onComplete(this.builder.getSections())

    // Parse review JSON from the last section
    const review = this.parseReviewFromSections()
    if (!review) {
      callbacks.onError("ai-review" as WorkflowStepId, new Error("Failed to parse review JSON"))
      return
    }
    callbacks.onReviewReady(review)

    // Generate coach from review JSON
    const coach = await this.generateCoach(review, language)
    callbacks.onCoachReady(coach)

    // Check convergence
    const convergence = this.checkConvergence(review, round)
    callbacks.onConvergence(convergence)

    // Save iteration context
    const prev = this.iterationContexts[this.iterationContexts.length - 1]
    this.iterationContexts.push({
      round,
      originalIdea: prev?.optimizedIdea || idea,
      optimizedIdea: undefined,
      review,
      coach,
      timestamp: new Date().toISOString(),
    })
  }

  /** Optimize: generate improved idea from original + review */
  async optimize(originalIdea: string, review: ReviewJson, language: Language): Promise<string> {
    const provider = getProvider()
    const config = getConfig()

    const systemPrompt = OPTIMIZER_PROMPT[language] ?? OPTIMIZER_PROMPT.en

    // Filter to P0 + P1 issues only
    const relevantIssues = review.issues
      .filter((i) => i.priority === "P0" || i.priority === "P1")
      .map((i) => `[${i.priority}] ${i.field}: ${i.problem} → ${i.recommendation}`)
      .join("\n")

    // Include history to avoid repeating
    const prevP0s = this.getPreviousP0Fields()
    const historyBlock = prevP0s.length > 0
      ? (language === "zh"
          ? `\n\n前几轮已修复的问题领域（请勿重复）：${prevP0s.join("、")}`
          : `\n\nPreviously addressed areas (do NOT reintroduce): ${prevP0s.join(", ")}`)
      : ""

    const userPrompt = language === "zh"
      ? `原始想法：${originalIdea}\n\n审查发现的问题：\n${relevantIssues}${historyBlock}\n\n请输出改进后的产品想法。`
      : `Original Idea: ${originalIdea}\n\nReview Issues:\n${relevantIssues}${historyBlock}\n\nOutput the improved product idea.`

    const improved = await provider.generate(systemPrompt, userPrompt, config)
    return improved.trim()
  }

  /** Get iteration records for display */
  getIterationRecords(): IterationRecord[] {
    return this.iterationContexts.map((ctx) => ({
      round: ctx.round,
      score: ctx.review.score,
      maturity: ctx.review.maturity,
      p0Count: ctx.review.issues.filter((i) => i.priority === "P0").length,
      p1Count: ctx.review.issues.filter((i) => i.priority === "P1").length,
      timestamp: new Date(ctx.timestamp).toLocaleTimeString(),
    }))
  }

  getCurrentReview(): ReviewJson | null {
    const last = this.iterationContexts[this.iterationContexts.length - 1]
    return last?.review ?? null
  }

  resetIterations(): void {
    this.iterationContexts = []
    this.consecutiveLowGain = 0
  }

  // ─── Private ───

  private parseReviewFromSections(): ReviewJson | null {
    const sections = this.builder.getSections()
    const reviewSection = sections.find((s) => s.stepId === "ai-review")
    if (!reviewSection) return null

    try {
      const cleaned = reviewSection.content
        .replace(/```json|```/g, "")
        .replace(/^\s*\{/, "{")
        .trim()
      // Find the JSON object in the content
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (!match) return null
      return JSON.parse(match[0]) as ReviewJson
    } catch {
      return null
    }
  }

  private async generateCoach(review: ReviewJson, language: Language): Promise<CoachOutput> {
    const provider = getProvider()
    const config = getConfig()

    try {
      const systemPrompt = COACH_PROMPT[language] ?? COACH_PROMPT.en
      const userPrompt = JSON.stringify(review)

      const rawJson = await provider.generate(systemPrompt, userPrompt, config)
      const cleaned = rawJson.replace(/```json|```/g, "").trim()
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (!match) throw new Error("No JSON found")
      const parsed = JSON.parse(match[0])

      return {
        maturity: review.maturity,
        score: review.score,
        topIssues: (parsed.topIssues || []) as CoachIssueAnalysis[],
        coachAdvice: parsed.coachAdvice || "",
      }
    } catch {
      return this.fallbackCoach(review, language)
    }
  }

  private fallbackCoach(review: ReviewJson, language: Language): CoachOutput {
    return {
      maturity: review.maturity,
      score: review.score,
      topIssues: review.issues
        .filter((i) => i.priority === "P0" || i.priority === "P1")
        .slice(0, 3)
        .map((i) => ({
          priority: i.priority,
          field: i.field,
          problem: i.problem,
          whyItMatters: language === "zh" ? "这是当前规格的一个关键问题" : "This is a critical gap in the current spec",
          solution: i.recommendation,
          expectedBenefit: language === "zh" ? "修复后将显著提升产品规格质量" : "Fixing this will significantly improve spec quality",
        })),
      coachAdvice: language === "zh"
        ? `当前成熟度：${review.maturity}。重点解决 P0 问题。`
        : `Current maturity: ${review.maturity}. Focus on resolving P0 issues.`,
    }
  }

  private checkConvergence(review: ReviewJson, round: number): ConvergenceResult {
    const p0Issues = review.issues.filter((i) => i.priority === "P0")
    const prev = this.iterationContexts[this.iterationContexts.length - 1]
    const prevP0Ids = prev?.review.issues
      .filter((i) => i.priority === "P0")
      .map((i) => `${i.field}:${i.problem}`) ?? []

    // No P0 issues → converged
    if (p0Issues.length === 0) {
      return { status: "converged", reason: "All P0 issues resolved", consecutiveLowGain: 0, previousP0Ids: [] }
    }

    // Check score improvement
    if (prev) {
      const scoreDelta = review.score - prev.review.score
      if (scoreDelta < 3) {
        this.consecutiveLowGain++
      } else {
        this.consecutiveLowGain = 0
      }

      if (this.consecutiveLowGain >= 2) {
        return {
          status: "stalled",
          reason: `Score improvement < 3 for ${this.consecutiveLowGain} consecutive rounds. Consider redefining the product direction.`,
          consecutiveLowGain: this.consecutiveLowGain,
          previousP0Ids: prevP0Ids,
        }
      }
    }

    // Check for same P0 issues persisting
    const currentP0Ids = p0Issues.map((i) => `${i.field}:${i.problem}`)
    const sameP0s = currentP0Ids.filter((id) => prevP0Ids.includes(id))
    if (sameP0s.length > 0 && prev) {
      this.consecutiveLowGain++
      if (this.consecutiveLowGain >= 2) {
        return {
          status: "stalled",
          reason: `Same P0 issues persist across rounds: ${sameP0s.slice(0, 2).join(", ")}`,
          consecutiveLowGain: this.consecutiveLowGain,
          previousP0Ids: prevP0Ids,
        }
      }
    }

    return { status: "iterating", reason: "", consecutiveLowGain: this.consecutiveLowGain, previousP0Ids: currentP0Ids }
  }

  private getPreviousP0Fields(): string[] {
    const fields = new Set<string>()
    for (const ctx of this.iterationContexts) {
      for (const issue of ctx.review.issues) {
        if (issue.priority === "P0") fields.add(issue.field)
      }
    }
    return Array.from(fields)
  }

  abort(): void { this.aborted = true }
}

export const coordinator = new Coordinator()
