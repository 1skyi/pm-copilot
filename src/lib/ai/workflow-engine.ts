import { WorkflowStep, WorkflowStepStatus } from "@/types"

export const WORKFLOW_STEP_IDS = [
  "clarification",
  "requirement",
  "product-design",
  "flow",
  "database",
  "api",
  "test",
  "dev-prompt",
  "ai-review",
] as const

export type WorkflowStepId = (typeof WORKFLOW_STEP_IDS)[number]

const STEP_NAMES: Record<WorkflowStepId, string> = {
  clarification: "Clarification",
  requirement: "Requirement",
  "product-design": "Product Design",
  flow: "Flow",
  database: "Database",
  api: "API",
  test: "Test",
  "dev-prompt": "Development Prompt",
  "ai-review": "AI Review",
}

const RUNNING_TEXTS: Record<WorkflowStepId, string> = {
  clarification: "Analyzing product idea...",
  requirement: "Generating requirements document...",
  "product-design": "Designing product architecture...",
  flow: "Mapping user flows...",
  database: "Designing database schema...",
  api: "Defining API endpoints...",
  test: "Generating test cases...",
  "dev-prompt": "Compiling development prompt...",
  "ai-review": "Reviewing output quality...",
}

export class WorkflowEngine {
  private steps: WorkflowStep[] = []
  private currentIndex = 0

  constructor() {
    this.reset()
  }

  reset(): void {
    this.currentIndex = 0
    this.steps = WORKFLOW_STEP_IDS.map((id) => ({
      id,
      name: STEP_NAMES[id],
      status: "PENDING" as WorkflowStepStatus,
      runningText: RUNNING_TEXTS[id],
    }))
  }

  getSteps(): WorkflowStep[] {
    return [...this.steps]
  }

  getCurrentStepId(): WorkflowStepId | null {
    if (this.currentIndex >= WORKFLOW_STEP_IDS.length) return null
    return WORKFLOW_STEP_IDS[this.currentIndex]
  }

  getCurrentIndex(): number {
    return this.currentIndex
  }

  isComplete(): boolean {
    return this.currentIndex >= WORKFLOW_STEP_IDS.length
  }

  /** Mark the current step as RUNNING, return it */
  startCurrentStep(): WorkflowStep | null {
    const id = this.getCurrentStepId()
    if (!id) return null

    this.steps = this.steps.map((s) =>
      s.id === id ? { ...s, status: "RUNNING" } : s
    )
    return this.steps.find((s) => s.id === id) ?? null
  }

  /** Mark the current step as COMPLETED and advance */
  completeCurrentStep(): void {
    const id = this.getCurrentStepId()
    if (!id) return

    this.steps = this.steps.map((s) =>
      s.id === id ? { ...s, status: "COMPLETED" } : s
    )
    this.currentIndex++
  }

  /** Mark a specific step as ERROR */
  markError(stepId: WorkflowStepId): void {
    this.steps = this.steps.map((s) =>
      s.id === stepId ? { ...s, status: "ERROR" } : s
    )
  }

  /** Advance to next step without changing current step status (for non-fatal errors) */
  skipCurrentStep(): void {
    if (this.getCurrentStepId()) {
      this.currentIndex++
    }
  }

  getStepIds(): readonly WorkflowStepId[] {
    return WORKFLOW_STEP_IDS
  }
}
