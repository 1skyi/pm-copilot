import { AIProvider, AIProviderConfig, ProviderError } from "../provider"

const DEFAULT_BASE_URL = "https://api.deepseek.com/v1"
const DEFAULT_MODEL = "deepseek-chat"

export class DeepSeekProvider implements AIProvider {
  async generate(
    systemPrompt: string,
    userPrompt: string,
    config: AIProviderConfig
  ): Promise<string> {
    this.validateConfig(config)

    const { baseUrl, model } = this.resolveConfig(config)

    const response = await this.fetchWithErrorHandling(
      `${baseUrl}/chat/completions`,
      {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        stream: false,
      },
      config
    )

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) {
      throw new ProviderError("DeepSeek returned empty response", "api_error")
    }
    return content
  }

  async generateStream(
    systemPrompt: string,
    userPrompt: string,
    config: AIProviderConfig,
    onChunk: (delta: string) => void
  ): Promise<string> {
    this.validateConfig(config)

    const { baseUrl, model } = this.resolveConfig(config)

    const response = await this.fetchWithErrorHandling(
      `${baseUrl}/chat/completions`,
      {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      },
      config
    )

    const reader = response.body?.getReader()
    if (!reader) {
      throw new ProviderError("Stream response has no body", "api_error")
    }

    const decoder = new TextDecoder()
    let fullContent = ""
    let buffer = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith("data:")) continue

          const data = trimmed.slice(5).trim()
          if (data === "[DONE]") continue

          try {
            const parsed = JSON.parse(data)
            const delta = parsed?.choices?.[0]?.delta?.content
            if (delta) {
              fullContent += delta
              onChunk(delta)
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    return fullContent
  }

  // ─── Private helpers ───

  private validateConfig(config: AIProviderConfig): void {
    if (!config.apiKey || config.apiKey.trim() === "") {
      throw new ProviderError(
        "DeepSeek API key is missing. Set NEXT_PUBLIC_DEEPSEEK_API_KEY in .env.local",
        "missing_key"
      )
    }
  }

  private resolveConfig(config: AIProviderConfig) {
    return {
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      model: config.model || DEFAULT_MODEL,
    }
  }

  private async fetchWithErrorHandling(
    url: string,
    body: Record<string, unknown>,
    config: AIProviderConfig
  ): Promise<Response> {
    let response: Response
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000),
      })
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new ProviderError("Network error: unable to reach DeepSeek API", "network_error")
      }
      throw new ProviderError(
        `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
        "network_error"
      )
    }

    if (response.status === 401 || response.status === 403) {
      throw new ProviderError("DeepSeek API key is invalid or unauthorized", "missing_key")
    }
    if (response.status === 429) {
      throw new ProviderError("DeepSeek rate limit exceeded", "rate_limited")
    }
    if (!response.ok && !body.stream) {
      const text = await response.text().catch(() => "")
      throw new ProviderError(`DeepSeek API error (${response.status}): ${text.slice(0, 200)}`, "api_error")
    }

    return response
  }
}

export const deepseekProvider = new DeepSeekProvider()
