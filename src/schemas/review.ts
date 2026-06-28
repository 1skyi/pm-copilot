export type PriorityLevel = "P0" | "P1" | "P2"

export interface ReviewOutput {
  /** Product-level risks */
  productRisks: string[]
  /** Missing features that should be added */
  missingFeatures: string[]
  /** UX/design improvement suggestions */
  uxSuggestions: string[]
  /** Technical risks (architecture, performance, security) */
  technicalRisks: string[]
  /** Prioritized action items */
  priorities: { level: PriorityLevel; action: string }[]
  /** Overall quality verdict */
  verdict: string
}
