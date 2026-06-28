import { StreamChunkCallback } from "@/types"

export interface AIProviderConfig {
  apiKey: string
  model?: string
  baseUrl?: string
}

export interface AIProvider {
  /** Generate a full completion */
  generate(systemPrompt: string, userPrompt: string, config: AIProviderConfig): Promise<string>

  /** Generate with streaming — calls onChunk for each text delta */
  generateStream(
    systemPrompt: string,
    userPrompt: string,
    config: AIProviderConfig,
    onChunk: (delta: string) => void
  ): Promise<string>
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly code: "missing_key" | "network_error" | "api_error" | "rate_limited"
  ) {
    super(message)
    this.name = "ProviderError"
  }
}
