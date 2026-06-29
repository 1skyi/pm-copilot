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
