export type WorkflowStepStatus = "WAITING" | "RUNNING" | "COMPLETED" | "ERROR"

export interface WorkflowStep {
  id: string
  name: string
  status: WorkflowStepStatus
}

export interface MenuItem {
  id: string
  label: string
  icon: string
}
