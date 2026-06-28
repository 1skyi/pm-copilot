import { StreamedSection } from "@/types"
import { getProvider, getConfig } from "@/lib/ai/providers"

const SYSTEM_PROMPT = `You are a senior product manager writing a requirements document. Generate functional and non-functional requirements for the given product idea.

Output format: Use Markdown. Include:
### Functional Requirements — 4-6 numbered FR items
### Non-Functional Requirements — 3-4 items covering performance, security, usability

Keep it concise (200-400 words). Do NOT include a title heading.`

export async function generateRequirement(idea: string): Promise<StreamedSection> {
  const provider = getProvider()
  const config = getConfig()

  const userPrompt = `Product Idea: ${idea}\n\nPlease generate a complete requirements document for this product idea.`

  const content = await provider.generate(SYSTEM_PROMPT, userPrompt, config)

  return {
    stepId: "requirement",
    title: "## Requirements\n\n",
    content: content + "\n\n",
  }
}
