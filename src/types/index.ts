export type WorkflowStepStatus = "PENDING" | "RUNNING" | "COMPLETED" | "ERROR"
export type Language = "en" | "zh"
export type GeneratePhase = "idle" | "generating" | "completed"
export type MaturityLevel = "L1" | "L2" | "L3" | "L4" | "L5"

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

/** Parsed issue from AI Review */
export interface CoachIssue {
  priority: "P0" | "P1" | "P2"
  title: string
  cause: string
  solution: string
  expectedBenefit: string
}

/** Structured coach output after AI Review */
export interface CoachOutput {
  maturity: {
    level: MaturityLevel
    score: number // 0-100
    nextStage: string
  }
  topIssues: CoachIssue[] // Top 3, sorted P0 > P1 > P2
  coachAdvice: string
}

/** One iteration round */
export interface IterationRecord {
  round: number
  score: number
  level: MaturityLevel
  timestamp: string
}
