import { StreamedSection } from "@/types"
import { getProvider, getConfig } from "@/lib/ai/providers"

const SYSTEM_PROMPT = `You are a senior product manager at a top tech company. Your task is to clarify a product idea.

Given a product idea, ask and answer 3-5 key clarifying questions:
- What is the core problem being solved?
- Who are the target users?
- What are the primary use cases?
- What are the success metrics?
- What are the key constraints or risks?

Output format: Use Markdown. Start with a brief overview paragraph, then list the resolved questions as bullet points. Keep it concise (200-400 words). Do NOT include a title heading — that will be added separately.`

export async function generateClarification(idea: string): Promise<StreamedSection> {
  const provider = getProvider()
  const config = getConfig()

  const userPrompt = `Product Idea: ${idea}\n\nPlease clarify this product idea by asking and answering key questions.`

  const content = await provider.generate(SYSTEM_PROMPT, userPrompt, config)

  return {
    stepId: "clarification",
    title: "## Clarification\n\n",
    content: content + "\n\n",
  }
}
