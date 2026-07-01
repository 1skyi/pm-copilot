import { WorkflowStep, StreamedSection, Language, ReviewJson, CoachOutput, CoachIssueAnalysis, IterationContext, IterationRecord, ConvergenceResult, ConvergenceStatus, FieldDelta, TrackedIssue, VersionDelta, IssueStatus, OptimizerPatch } from "@/types"
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
  private consecutiveP0NoDecrease = 0

  /** Execute full 9-step workflow. Creates a Version on completion with delta tracking. */
  async execute(idea: string, language: Language, callbacks: CoordinatorCallbacks): Promise<number | null> {
    this.workflow.reset()
    this.builder.reset()
    this.aborted = false

    const provider = getProvider()
    const config = getConfig()
    const stepIds = [...this.workflow.getStepIds()]
    const parentNumber = versionManager.latestNumber
    const prevVersion = parentNumber ? versionManager.get(parentNumber) : undefined

    // ─── Run 9-step workflow ───
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

    // ─── Parse review ───
    const review = this._parseReview()
    if (!review) { callbacks.onError("ai-review" as WorkflowStepId, new Error("Failed to parse review JSON")); return null }
    callbacks.onReviewReady(review)

    // ─── Stateful issue tracking: compare to previous version ───
    const trackedIssues: TrackedIssue[] = this._trackIssues(review, prevVersion)

    // ─── Compute delta from parent ───
    const delta = prevVersion ? this._computeDelta(prevVersion, review, trackedIssues) : undefined

    // ─── Coach ───
    const coach = await this._generateCoach(review, language)
    callbacks.onCoachReady(coach)

    // ─── Create immutable version with delta + tracked issues ───
    const vn = versionManager.createVersion(idea, this.builder.getSections(), review, coach, parentNumber, delta, trackedIssues)

    // ─── Convergence: P0-based + 3-iteration stop ───
    callbacks.onConvergence(this._checkConvergence(review))

    return vn
  }

  /** Stateful issue tracking: resolve / persist / regress / new. */
  private _trackIssues(review: ReviewJson, prevVersion?: import("@/types").VersionV1): TrackedIssue[] {
    const vn = versionManager.latestNumber ?? 1
    const prevIssues = prevVersion?.review.issues ?? []

    const issueKey = (i: { field: string; problem: string }) => `${i.field}:${i.problem}`

    const prevMap = new Map<string, (typeof prevIssues)[number]>()
    prevIssues.forEach((i) => prevMap.set(issueKey(i), i))

    return review.issues.map((cur): TrackedIssue => {
      const key = issueKey(cur)
      const prev = prevMap.get(key)
      let status: IssueStatus = "new"
      if (prev) {
        if (cur.priority === prev.priority) status = "persisting"
        else if (cur.priority === "P1" && prev.priority === "P0") status = "regressed"
        else if (cur.priority === "P2" && (prev.priority === "P0" || prev.priority === "P1")) status = "regressed"
        else status = "resolved" // Priority downgraded OR issue fixed
      }
      return { ...cur, status, firstSeenInVersion: prev ? prevVersion!.versionNumber : vn, lastSeenInVersion: vn }
    })
  }

  /** Compute VersionDelta: what changed from parent to this version. */
  private _computeDelta(prevVersion: import("@/types").VersionV1, review: ReviewJson, tracked: TrackedIssue[]): VersionDelta {
    const resolved = tracked.filter((t) => t.status === "resolved").map((t) => `${t.field}:${t.problem}`)
    const persisting = tracked.filter((t) => t.status === "persisting").map((t) => `${t.field}:${t.problem}`)
    const newP0s = tracked.filter((t) => t.status === "new" && t.priority === "P0").map((t) => `${t.field}:${t.problem}`)

    const appliedDeltas: FieldDelta[] = resolved.map((id) => {
      const parts = id.split(":")
      return { field: parts[0] || id, action: "refined" as const, reason: id, summary: `Resolved: ${id}` }
    })

    return {
      sourceVersion: prevVersion.versionNumber,
      targetVersion: prevVersion.versionNumber + 1,
      appliedDeltas,
      unresolvedP0Ids: [...persisting, ...newP0s],
      resolvedP0Ids: resolved,
      newP0Ids: newP0s,
      scoreDelta: review.score - prevVersion.score,
      p0Delta: review.issues.filter((i) => i.priority === "P0").length - prevVersion.p0Count,
    }
  }

  /** P0-based convergence + 3-iteration stop rule. */
  private _checkConvergence(review: ReviewJson): ConvergenceResult {
    const p0s = review.issues.filter((i) => i.priority === "P0")
    const versions = versionManager.getAll()
    const prev = versions.length > 1 ? versions[versions.length - 2] : undefined
    const prevP0Ids = prev?.review.issues.filter((i) => i.priority === "P0")
      .map((i) => `${i.field}:${i.problem}`) ?? []

    if (p0s.length === 0) {
      this.consecutiveP0NoDecrease = 0
      return { status: "converged", reason: "All P0 issues resolved. Ready to build.", consecutiveLowGain: 0, previousP0Ids: [] }
    }

    // Track P0 decrease
    if (prev) {
      const p0Delta = p0s.length - prev.p0Count
      if (p0Delta >= 0) {
        this.consecutiveP0NoDecrease++
      } else {
        this.consecutiveP0NoDecrease = 0
      }

      // Stop after 3 iterations without P0 decrease
      if (this.consecutiveP0NoDecrease >= 3) {
        return {
          status: "stalled",
          reason: `P0 issues not decreasing for 3 iterations. Recommend redefining product direction, not continuing optimization.`,
          consecutiveLowGain: this.consecutiveP0NoDecrease,
          previousP0Ids: prevP0Ids,
        }
      }

      // Score fluctuation ±3 without improvement
      const scoreDelta = review.score - prev.score
      if (Math.abs(scoreDelta) <= 3 && p0Delta >= 0) {
        this.consecutiveP0NoDecrease++
      }
    }

    // Check same P0s persisting
    const curIds = p0s.map((i) => `${i.field}:${i.problem}`)
    const same = curIds.filter((id) => prevP0Ids.includes(id))
    if (same.length > 0 && same.length === p0s.length && prev) {
      this.consecutiveP0NoDecrease++
    }

    return {
      status: this.consecutiveP0NoDecrease >= 3 ? "stalled" : "iterating",
      reason: this.consecutiveP0NoDecrease >= 3
        ? "No P0 improvement for 3 iterations. Recommend redefining product direction."
        : "",
      consecutiveLowGain: this.consecutiveP0NoDecrease,
      previousP0Ids: curIds,
    }
  }

  /**
   * PATCH ENGINE: generates field-level delta patches from review feedback.
   * Returns the structured patch + a synthesized improved idea for execution.
   */
  async optimize(originalIdea: string, review: ReviewJson, language: Language): Promise<{ patch: OptimizerPatch; improvedIdea: string }> {
    const sys = OPTIMIZER_PROMPT[language] ?? OPTIMIZER_PROMPT.en
    const issuesSummary = review.issues
      .filter((i) => i.priority === "P0" || i.priority === "P1")
      .map((i) => `[${i.priority}] ${i.field}: ${i.problem} → ${i.recommendation}`)
      .join("\n")

    const user = language === "zh"
      ? `原始想法：${originalIdea}\n\n需修复的问题：\n${issuesSummary}`
      : `Original Idea: ${originalIdea}\n\nIssues to fix:\n${issuesSummary}`

    const result = await getProvider().generate(sys, user, getConfig())

    // Parse PATCH JSON from LLM output
    let patch: OptimizerPatch = {}
    try {
      const cleaned = result.replace(/```json|```/g, "").trim()
      const m = cleaned.match(/\{[\s\S]*\}/)
      if (m) patch = JSON.parse(m[0]) as OptimizerPatch
    } catch { /* fall through to fallback */ }

    const improvedIdea = this._synthesizeIdea(originalIdea, patch, language) || result.trim() || originalIdea
    return { patch, improvedIdea }
  }

  /** Convert field patches back into a readable idea string. */
  private _synthesizeIdea(original: string, patch: OptimizerPatch, language: Language): string {
    const entries = Object.entries(patch).filter(([, v]) => v.to)
    if (!entries.length) return original
    let result = original
    for (const [, v] of entries) {
      if (v.from && result.toLowerCase().includes(v.from.toLowerCase())) {
        result = result.split(v.from).join(v.to)
      }
    }
    const additions = entries.filter(([, v]) => !v.from)
    if (additions.length) {
      const suffix = additions.map(([, v]) => v.to).join(". ")
      result = result ? result + ". " + suffix + "." : suffix
    }
    return result || original
  }

  /** Debug state: exposes internal state for transparency. */
  getDebugState(): import("@/types").DebugState {
    const versions = versionManager.getAll()
    const last = versions[versions.length - 1]
    const deltas = versions.filter((v) => v.delta).length
    const unresolved = last?.delta?.unresolvedP0Ids ?? []

    return {
      currentVersion: last?.versionNumber ?? 0,
      totalVersions: versions.length,
      appliedDeltaCount: deltas,
      unresolvedP0s: unresolved,
      reasonForScoreChange: last?.delta
        ? `Score changed by ${last.delta.scoreDelta}, P0s changed by ${last.delta.p0Delta}`
        : "Initial version",
      shouldStop: this.consecutiveP0NoDecrease >= 3,
      stopReason: this.consecutiveP0NoDecrease >= 3
        ? "P0 issues not decreasing for 3 iterations"
        : "",
    }
  }

  // ─── Version-aware methods (delegated) ───

  async compareVersions(vA: number, vB: number, language: Language): Promise<string> {
    return (await versionManager.compareVersions(vA, vB, language)).analysis
  }

  async generateEvolutionInsight(language: Language): Promise<string> {
    return versionManager.generateEvolutionInsight(language)
  }

  // ─── Legacy compat ───

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
    this.consecutiveP0NoDecrease = 0
  }

  abort(): void { this.aborted = true }

  // ─── Private helpers ───

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
}

export const coordinator = new Coordinator()
