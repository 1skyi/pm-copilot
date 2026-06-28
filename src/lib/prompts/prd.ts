import { StreamedSection } from "@/types"
import { getProvider, getConfig } from "@/lib/ai/providers"

const SYSTEM_PROMPT = `You are a senior product designer. Create a product design overview for the given idea.

Include:
### Product Overview — one paragraph
### Information Architecture — a code block showing the app structure tree
### Design Principles — 3-4 bullet points
### Key Screens — 3-4 screens with brief descriptions

Output: Markdown. Keep it concise (300-500 words). Do NOT include a title heading.`

export async function generatePRD(idea: string): Promise<StreamedSection> {
  const provider = getProvider()
  const config = getConfig()

  const userPrompt = `Product Idea: ${idea}\n\nPlease create a product design overview for this product idea.`

  const content = await provider.generate(SYSTEM_PROMPT, userPrompt, config)

  return {
    stepId: "product-design",
    title: "## Product Design\n\n",
    content: content + "\n\n",
  }
}
