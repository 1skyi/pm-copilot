export interface RequirementOutput {
  /** 1-2 paragraphs of project context */
  background: string
  /** 3-5 target user personas */
  targetUsers: string[]
  /** Core pain points being solved */
  painPoints: string[]
  /** 5-8 numbered functional requirements */
  coreFeatures: string[]
  /** Minimum viable scope for first release */
  mvpScope: string[]
  /** Identified risks and mitigation strategies */
  risks: string[]
}
