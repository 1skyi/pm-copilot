import { WorkflowStep, StreamedSection, Language, ReviewJson, CoachOutput, CoachIssueAnalysis, IterationContext, IterationRecord, ConvergenceResult, ConvergenceStatus } from "@/types"
import { WorkflowEngine, WorkflowStepId } from "./workflow-engine"
import { MarkdownBuilder } from "./markdown-builder"
import { ProviderError } from "./provider"
import { getProvider, getConfig } from "./providers"
import { versionManager } from "./version-manager"
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
  private workflow = new WorkflowEngine()
  private builder = new MarkdownBuilder()
  private aborted = false
  private consecutiveLowGain = 0

  /** Execute full 9-step workflow. Creates a Version on completion. */
  async execute(idea: string, language: Language, callbacks: CoordinatorCallbacks): Promise<number | null> {
    this.workflow.reset()
    this.builder.reset()
    this.aborted = false

    const provider = getProvider()
    const config = getConfig()
    const stepIds = [...this.workflow.getStepIds()]
    const parentNumber = versionManager.latestNumber

    for (const stepId of stepIds) {
      if (this.aborted) break
      const step = this.workflow.startCurrentStep()
      if (!step) break
      callbacks.onStepStart(step, this.workflow.getSteps())

      try {
        const sys = SYSTEM_PROMPTS[stepId]?.[language] ?? SYSTEM_PROMPTS[stepId]?.en ?? ""
        const user = language === "zh" ? `产品想法：${idea}` : `Product Idea: ${idea}`
        let content = ""
        await provider.generateStream(sys, user, config, (delta) => {
          content += delta
          callbacks.onStreamChunk(stepId, delta)
        })
        if (this.aborted) break

        const title = SECTION_TITLES[stepId]?.[language] ?? `## ${stepId}\n\n`
        const section: StreamedSection = { stepId, title, content: content + "\n\n" }
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

    if (this.aborted) return null
    callbacks.onComplete(this.builder.getSections())

    // Parse review
    const review = this._parseReview()
    if (!review) { callbacks.onError("ai-review" as WorkflowStepId, new Error("Failed to parse review JSON")); return null }
    callbacks.onReviewReady(review)

    // Coach
    const coach = await this._generateCoach(review, language)
    callbacks.onCoachReady(coach)

    // Create immutable version
    const vn = versionManager.createVersion(idea, this.builder.getSections(), review, coach, parentNumber)

    // Convergence
    callbacks.onConvergence(this._checkConvergence(review))

    return vn
  }

  /** Optimize idea based on review → returns improved idea text. */
  async optimize(originalIdea: string, review: ReviewJson, language: Language): Promise<string> {
    const sys = OPTIMIZER_PROMPT[language] ?? OPTIMIZER_PROMPT.en
    const user = language === "zh"
      ? `原始想法：${originalIdea}\n\n审查结果：${JSON.stringify(review)}`
      : `Original Idea: ${originalIdea}\n\nReview: ${JSON.stringify(review)}`
    const result = await getProvider().generate(sys, user, getConfig())
    return result.trim() || originalIdea
  }

  // ─── Version-aware methods (delegated) ───

  async compareVersions(vA: number, vB: number, language: Language): Promise<string> {
    return (await versionManager.compareVersions(vA, vB, language)).analysis
  }

  async generateEvolutionInsight(language: Language): Promise<string> {
    return versionManager.generateEvolutionInsight(language)
  }

  // ─── Legacy compat (for components that still use these) ───

  getIterationContexts(): IterationContext[] {
    return versionManager.getAll().map((v) => ({
      round: v.versionNumber,
      originalIdea: v.idea,
      optimizedIdea: v.parentVersionNumber ? v.idea : undefined,
      review: v.review,
      coach: v.coach,
      timestamp: v.timestamp,
    }))
  }

  getIterationRecords(): IterationRecord[] {
    return versionManager.getAll().map((v) => ({
      round: v.versionNumber,
      score: v.score,
      maturity: v.maturity,
      p0Count: v.p0Count,
      p1Count: v.p1Count,
      timestamp: new Date(v.timestamp).toLocaleTimeString(),
    }))
  }

  getCurrentReview(): ReviewJson | null {
    return versionManager.viewing?.review ?? null
  }

  resetIterations(): void {
    versionManager.reset()
    this.consecutiveLowGain = 0
  }

  abort(): void { this.aborted = true }

  // ─── Private ───

  private _parseReview(): ReviewJson | null {
    const sec = this.builder.getSections().find((s) => s.stepId === "ai-review")
    if (!sec) return null
    try {
      const cleaned = sec.content.replace(/```json|```/g, "").trim()
      const m = cleaned.match(/\{[\s\S]*\}/)
      return m ? JSON.parse(m[0]) as ReviewJson : null
    } catch { return null }
  }

  private async _generateCoach(review: ReviewJson, language: Language): Promise<CoachOutput> {
    try {
      const sys = COACH_PROMPT[language] ?? COACH_PROMPT.en
      const raw = (await getProvider().generate(sys, JSON.stringify(review), getConfig()))
        .replace(/```json|```/g, "").trim()
      const m = raw.match(/\{[\s\S]*\}/)
      if (!m) throw new Error("no json")
      const p = JSON.parse(m[0])
      return { maturity: review.maturity, score: review.score,
        topIssues: (p.topIssues || []) as CoachIssueAnalysis[], coachAdvice: p.coachAdvice || "" }
    } catch {
      return this._fallbackCoach(review, language)
    }
  }

  private _fallbackCoach(review: ReviewJson, language: Language): CoachOutput {
    return {
      maturity: review.maturity, score: review.score,
      topIssues: review.issues.filter((i) => i.priority === "P0" || i.priority === "P1").slice(0, 3)
        .map((i) => ({
          priority: i.priority, field: i.field, problem: i.problem,
          whyItMatters: language === "zh" ? "关键缺口" : "Critical gap",
          solution: i.recommendation,
          expectedBenefit: language === "zh" ? "显著提升质量" : "Significantly improve quality",
        })),
      coachAdvice: language === "zh" ? `成熟度：${review.maturity}。优先解决 P0。` : `Maturity: ${review.maturity}. Prioritize P0.`,
    }
  }

  private _checkConvergence(review: ReviewJson): ConvergenceResult {
    const p0s = review.issues.filter((i) => i.priority === "P0")
    const versions = versionManager.getAll()
    const prev = versions.length > 1 ? versions[versions.length - 2] : undefined
    const prevP0Ids = prev?.review.issues.filter((i) => i.priority === "P0")
      .map((i) => `${i.field}:${i.problem}`) ?? []

    if (p0s.length === 0) {
      return { status: "converged", reason: "All P0 issues resolved. Ready to build.", consecutiveLowGain: 0, previousP0Ids: [] }
    }

    if (prev) {
      const delta = review.score - prev.score
      this.consecutiveLowGain = delta < 3 ? this.consecutiveLowGain + 1 : 0
      if (this.consecutiveLowGain >= 2) {
        return { status: "stalled",
          reason: `Score improvement < 3 for 2+ rounds. AI recommends redefining product direction.`,
          consecutiveLowGain: this.consecutiveLowGain, previousP0Ids: prevP0Ids }
      }
    }

    const curIds = p0s.map((i) => `${i.field}:${i.problem}`)
    const same = curIds.filter((id) => prevP0Ids.includes(id))
    if (same.length > 0 && prev) {
      this.consecutiveLowGain++
      if (this.consecutiveLowGain >= 2) {
        return { status: "stalled",
          reason: `Same P0 issues persist: ${same.slice(0, 2).join(", ")}`,
          consecutiveLowGain: this.consecutiveLowGain, previousP0Ids: prevP0Ids }
      }
    }

    return { status: "iterating", reason: "", consecutiveLowGain: this.consecutiveLowGain, previousP0Ids: curIds }
  }
}

export const coordinator = new Coordinator()
