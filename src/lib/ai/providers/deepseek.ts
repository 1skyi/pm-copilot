import { AIProvider, AIProviderConfig, ProviderError } from "../provider"

const DEFAULT_BASE_URL = "https://api.deepseek.com/v1"
const DEFAULT_MODEL = "deepseek-chat"

export class DeepSeekProvider implements AIProvider {
  async generate(
    systemPrompt: string,
    userPrompt: string,
    config: AIProviderConfig
  ): Promise<string> {
    if (!config.apiKey || config.apiKey.trim() === "") {
      throw new ProviderError(
        "DeepSeek API key is missing. Set NEXT_PUBLIC_DEEPSEEK_API_KEY in .env.local",
        "missing_key"
      )
    }

    const baseUrl = config.baseUrl || DEFAULT_BASE_URL
    const model = config.model || DEFAULT_MODEL

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
        signal: AbortSignal.timeout(60000),
      })

      if (response.status === 401 || response.status === 403) {
        throw new ProviderError(
          "DeepSeek API key is invalid or unauthorized",
          "missing_key"
        )
      }

      if (response.status === 429) {
        throw new ProviderError(
          "DeepSeek rate limit exceeded. Please wait and try again.",
          "rate_limited"
        )
      }

      if (!response.ok) {
        const body = await response.text().catch(() => "")
        throw new ProviderError(
          `DeepSeek API error (${response.status}): ${body.slice(0, 200)}`,
          "api_error"
        )
      }

      const data = await response.json()
      const content = data?.choices?.[0]?.message?.content
      if (!content) {
        throw new ProviderError("DeepSeek returned empty response", "api_error")
      }

      return content
    } catch (error) {
      if (error instanceof ProviderError) throw error
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new ProviderError("Network error: unable to reach DeepSeek API", "network_error")
      }
      throw new ProviderError(
        `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
        "network_error"
      )
    }
  }
}

export const deepseekProvider = new DeepSeekProvider()
