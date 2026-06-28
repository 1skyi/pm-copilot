export interface AIProviderConfig {
  apiKey: string
  model?: string
  baseUrl?: string
}

export interface AIProvider {
  /** Generate a completion from system + user prompts */
  generate(systemPrompt: string, userPrompt: string, config: AIProviderConfig): Promise<string>
}

/** Standard error types that all providers should throw */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly code: "missing_key" | "network_error" | "api_error" | "rate_limited"
  ) {
    super(message)
    this.name = "ProviderError"
  }
}
