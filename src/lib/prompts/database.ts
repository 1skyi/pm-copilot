import { StreamedSection } from "@/types"
import { getProvider, getConfig } from "@/lib/ai/providers"

const SYSTEM_PROMPT = `You are a backend architect. Design the database schema for the given product idea.

Include:
### Core Entities — a Markdown table with columns: Table, Purpose, Key Fields
### Relationships — describe 1→N and N↔M relationships
### Indexes — list recommended indexes

Output: Markdown. Keep it concise (200-400 words). Do NOT include a title heading.`

export async function generateDatabase(idea: string): Promise<StreamedSection> {
  const provider = getProvider()
  const config = getConfig()

  const userPrompt = `Product Idea: ${idea}\n\nPlease design the database schema for this product idea.`

  const content = await provider.generate(SYSTEM_PROMPT, userPrompt, config)

  return {
    stepId: "database",
    title: "## Database Schema\n\n",
    content: content + "\n\n",
  }
}
