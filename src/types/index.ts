export type WorkflowStepStatus = "PENDING" | "RUNNING" | "COMPLETED" | "ERROR"
export type Language = "en" | "zh"
export type GeneratePhase = "idle" | "generating" | "completed"

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

/** Called each time a new text chunk arrives from the LLM */
export type StreamChunkCallback = (stepId: string, delta: string, accumulatedContent: string) => void
