export interface APIOutput {
  /** RESTful endpoints with method, path, description */
  endpoints: { method: string; path: string; description: string }[]
  /** Authentication strategy */
  authentication: string
  /** Standard response format example */
  responseFormat: string
}
