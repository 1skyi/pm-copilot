export interface DatabaseOutput {
  /** Core entities */
  entities: { table: string; purpose: string; keyFields: string }[]
  /** Entity relationships */
  relationships: string[]
  /** Recommended indexes */
  indexes: string[]
}
