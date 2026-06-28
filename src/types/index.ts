export type WorkflowStepStatus = "PENDING" | "RUNNING" | "COMPLETED" | "ERROR"

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

export type GeneratePhase = "idle" | "generating" | "completed"

export interface StreamedSection {
  stepId: string
  title: string
  content: string
}
