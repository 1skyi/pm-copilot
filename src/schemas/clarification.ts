/** Output schema for Clarification module */
export interface ClarificationOutput {
  /** User's original idea restated clearly */
  coreProblem: string
  /** 3-5 identified target user groups with roles */
  targetUsers: string[]
  /** Primary use scenarios ranked by frequency */
  useCases: string[]
  /** Measurable success criteria */
  successMetrics: string[]
  /** Key constraints: budget, timeline, technical, legal */
  constraints: string[]
}
