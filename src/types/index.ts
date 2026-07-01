export type WorkflowStepStatus = "PENDING" | "RUNNING" | "COMPLETED" | "ERROR"
export type Language = "en" | "zh"
export type GeneratePhase = "idle" | "generating" | "completed"
export type MaturityLevel = "Idea" | "Prototype" | "MVP Ready" | "Market Ready" | "Investment Ready"
export type PriorityLevel = "P0" | "P1" | "P2"

export interface WorkflowStep {
  id: string
  name: string
  status: WorkflowStepStatus
  runningText?: string
}

export interface MenuItem {
  id: string
  label: string
  icon: string
}

export interface StreamedSection {
  stepId: string
  title: string
  content: string
}

export type StreamChunkCallback = (stepId: string, delta: string, accumulatedContent: string) => void

// ─── Sprint 5: Structured Review Output ───

export interface ReviewIssue {
  priority: PriorityLevel
  field: string        // e.g. "Target User", "MVP Scope", "Business Model"
  problem: string
  reason: string
  recommendation: string
}

export interface ReviewJson {
  score: number        // 0-100
  maturity: MaturityLevel
  issues: ReviewIssue[]
}

// ─── Sprint 5: Coach Output (reads Review JSON) ───

export interface CoachIssueAnalysis {
  priority: PriorityLevel
  field: string
  problem: string
  whyItMatters: string      // 为什么这是问题
  solution: string           // 解决方法
  expectedBenefit: string    // 预期收益
}

export interface CoachOutput {
  maturity: MaturityLevel
  score: number
  topIssues: CoachIssueAnalysis[]
  coachAdvice: string
}

// ─── Sprint 5: Iteration Context ───

export interface IterationContext {
  round: number
  originalIdea: string
  optimizedIdea?: string
  review: ReviewJson
  coach: CoachOutput | null
  timestamp: string
}

export interface IterationRecord {
  round: number
  score: number
  maturity: MaturityLevel
  p0Count: number
  p1Count: number
  timestamp: string
}

// ─── Sprint 5: Convergence ───

export type ConvergenceStatus = "iterating" | "converged" | "stalled" | "limit_reached"

export interface ConvergenceResult {
  status: ConvergenceStatus
  reason: string
  consecutiveLowGain: number   // 连续低提升轮数
  previousP0Ids: string[]      // 上一轮 P0 问题标识（用于去重）
}

// ─── Sprint 5 Final: Version-Driven Architecture ───

/** A single field-level change derived from Review feedback. */
export interface FieldDelta {
  field: string            // e.g. "Target User", "MVP Scope"
  action: "refined" | "narrowed" | "clarified" | "removed"
  reason: string           // Which P0 issue this addresses
  summary: string          // 1-sentence: what changed
}

/** Tracking status for issues across versions. */
export type IssueStatus = "resolved" | "persisting" | "regressed" | "new"

export interface TrackedIssue extends ReviewIssue {
  status: IssueStatus
  firstSeenInVersion: number
  lastSeenInVersion: number
}

/** Version Transition: what changed from v(n) to v(n+1). */
export interface VersionDelta {
  sourceVersion: number
  targetVersion: number
  appliedDeltas: FieldDelta[]
  unresolvedP0Ids: string[]  // e.g. "Target User:User segments too broad"
  resolvedP0Ids: string[]
  newP0Ids: string[]
  scoreDelta: number         // v(n+1).score - v(n).score
  p0Delta: number            // v(n+1).p0Count - v(n).p0Count (negative = improvement)
}

/** Debug state exposed for internal logging / transparency. */
export interface DebugState {
  currentVersion: number
  totalVersions: number
  appliedDeltaCount: number
  unresolvedP0s: string[]
  reasonForScoreChange: string
  shouldStop: boolean
  stopReason: string
}

/** Immutable snapshot of one complete AI generation run. Never mutated after creation. */
export interface VersionV1 {
  versionNumber: number
  idea: string
  sections: StreamedSection[]
  review: ReviewJson
  coach: CoachOutput | null
  score: number
  maturity: MaturityLevel
  p0Count: number
  p1Count: number
  timestamp: string              // ISO 8601
  parentVersionNumber: number | null
  delta?: VersionDelta           // Transition from parent (null for v1)
  trackedIssues?: TrackedIssue[] // Stateful issue tracking (null for v1)
}

/** Quality gate verdict after comparing a new version against the current best. */
export interface QualityGateResult {
  passed: boolean
  bestVersionNumber: number
  bestScore: number
  newScore: number
  message: string
}

/** Lightweight snapshot for charting / timeline display. */
export interface EvolutionSnapshot {
  versionNumber: number
  score: number
  maturity: MaturityLevel
  p0Count: number
  p1Count: number
  timestamp: string
}

export interface CompareResult {
  versionA: number
  versionB: number
  analysis: string
}

export interface EvolutionInsight {
  summary: string
  highlights: string[]
}
// ─── Optimizer PATCH ENGINE ───

export interface FieldPatch {
  from: string
  to: string
}

export type OptimizerPatch = Record<string, FieldPatch>
