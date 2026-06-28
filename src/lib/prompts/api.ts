import { StreamedSection } from "@/types"
import { getProvider, getConfig } from "@/lib/ai/providers"

const SYSTEM_PROMPT = `You are an API architect. Design the REST API for the given product idea.

Include:
### RESTful Endpoints — a code block listing endpoints with method, path, and brief description
### Authentication — specify auth method (JWT, OAuth, etc.)
### Response Format — show a JSON example of the standard response envelope

Output: Markdown. Keep it concise (200-400 words). Do NOT include a title heading.`

export async function generateAPI(idea: string): Promise<StreamedSection> {
  const provider = getProvider()
  const config = getConfig()

  const content = await provider.generate(SYSTEM_PROMPT, idea, config)

  return {
    stepId: "api",
    title: "## API Design\n\n",
    content: content + "\n\n",
  }
}
