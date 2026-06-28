export interface PRDOutput {
  /** 1-2 sentences: what this product is */
  productGoals: string
  /** Ordered steps of primary user journey */
  userFlow: string[]
  /** Functional modules with brief descriptions */
  functionalModules: { name: string; description: string }[]
  /** 3-5 edge cases and how they are handled */
  edgeCases: string[]
  /** How will we know if the product is successful */
  successMetrics: string[]
}
