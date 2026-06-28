export interface FlowOutput {
  /** Primary user journey steps */
  primaryFlow: string[]
  /** 2-3 secondary flows */
  secondaryFlows: { name: string; steps: string[] }[]
  /** Edge cases with handling strategy */
  edgeCases: { scenario: string; handling: string }[]
}
