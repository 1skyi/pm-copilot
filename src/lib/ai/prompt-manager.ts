import { StreamedSection } from "@/types"
import { WorkflowStepId } from "./workflow-engine"
import { getProvider, getConfig } from "./providers"
import { generateClarification } from "@/lib/prompts/clarification"
import { generateRequirement } from "@/lib/prompts/requirement"
import { generatePRD } from "@/lib/prompts/prd"
import { generateFlow } from "@/lib/prompts/flow"
import { generateDatabase } from "@/lib/prompts/database"
import { generateAPI } from "@/lib/prompts/api"
import { generateReview } from "@/lib/prompts/review"

type PromptGenerator = (idea: string) => Promise<StreamedSection>

const TEST_SYSTEM_PROMPT = `You are a QA engineer. Write a test plan for the given product idea.

Include:
### Test Cases — 4-5 numbered TC items with descriptions
### Testing Levels — Unit, Integration, E2E with tools

Output: Markdown. Keep it concise (200-400 words). Do NOT include a title heading.`

async function generateTest(idea: string): Promise<StreamedSection> {
  const provider = getProvider()
  const config = getConfig()
  const content = await provider.generate(TEST_SYSTEM_PROMPT, idea, config)
  return {
    stepId: "test",
    title: "## Test Plan\n\n",
    content: content + "\n\n",
  }
}

const DEV_SYSTEM_PROMPT = `You are a tech lead. Write a development prompt for the given product idea.

Include:
### Tech Stack — recommended technologies with brief justification
### Getting Started — a bash code block with setup commands
### Key Dependencies — 3-4 npm packages with purpose

Output: Markdown. Keep it concise (200-400 words). Do NOT include a title heading.`

async function generateDevPrompt(idea: string): Promise<StreamedSection> {
  const provider = getProvider()
  const config = getConfig()
  const content = await provider.generate(DEV_SYSTEM_PROMPT, idea, config)
  return {
    stepId: "dev-prompt",
    title: "## Development Prompt\n\n",
    content: content + "\n\n",
  }
}

const GENERATORS: Partial<Record<WorkflowStepId, PromptGenerator>> = {
  clarification: generateClarification,
  requirement: generateRequirement,
  "product-design": generatePRD,
  flow: generateFlow,
  database: generateDatabase,
  api: generateAPI,
  test: generateTest,
  "dev-prompt": generateDevPrompt,
  "ai-review": generateReview,
}

export class PromptManager {
  getGenerator(stepId: WorkflowStepId): PromptGenerator | null {
    return GENERATORS[stepId] ?? null
  }

  async execute(stepId: WorkflowStepId, idea: string): Promise<StreamedSection> {
    const generator = this.getGenerator(stepId)
    if (!generator) {
      return {
        stepId,
        title: `## ${stepId}\n\n`,
        content: `*Generated content for ${stepId}*\n\n`,
      }
    }
    return generator(idea)
  }
}
