import { StreamedSection } from "@/types"
import { getProvider, getConfig } from "@/lib/ai/providers"

const SYSTEM_PROMPT = `You are a UX designer. Map out the key user flows for the given product idea.

Include:
### Primary Flow — a numbered list of steps for the main user journey
### Secondary Flows — 2-3 shorter flows (e.g. edit, delete, search)
### Edge Cases — 2-3 edge cases and how to handle them

Output: Markdown. Keep it concise (200-400 words). Do NOT include a title heading.`

export async function generateFlow(idea: string): Promise<StreamedSection> {
  const provider = getProvider()
  const config = getConfig()

  const userPrompt = `Product Idea: ${idea}\n\nPlease map out the key user flows for this product idea.`

  const content = await provider.generate(SYSTEM_PROMPT, userPrompt, config)

  return {
    stepId: "flow",
    title: "## User Flows\n\n",
    content: content + "\n\n",
  }
}
