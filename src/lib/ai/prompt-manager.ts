import { StreamedSection } from "@/types"
import { WorkflowStepId } from "./workflow-engine"
import { generateClarification } from "@/lib/prompts/clarification"
import { generateRequirement } from "@/lib/prompts/requirement"
import { generatePRD } from "@/lib/prompts/prd"
import { generateFlow } from "@/lib/prompts/flow"
import { generateDatabase } from "@/lib/prompts/database"
import { generateAPI } from "@/lib/prompts/api"
import { generateReview } from "@/lib/prompts/review"

type PromptGenerator = (idea: string) => Promise<StreamedSection>

const GENERATORS: Record<WorkflowStepId, PromptGenerator> = {
  clarification: generateClarification,
  requirement: generateRequirement,
  "product-design": generatePRD,
  flow: generateFlow,
  database: generateDatabase,
  api: generateAPI,
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
