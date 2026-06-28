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

// Steps without dedicated prompt files get inline mock
async function generateTest(idea: string): Promise<StreamedSection> {
  await new Promise((r) => setTimeout(r, 1400))
  return {
    stepId: "test",
    title: "## Test Plan\n\n",
    content: `### Test Cases\n\nBased on "${idea}":\n\n- **TC-01:** User registration flow → verify email + profile creation\n- **TC-02:** Core CRUD operations → verify create, read, update, delete\n- **TC-03:** Search functionality → verify results accuracy & pagination\n- **TC-04:** Concurrent 500 users → verify < 2s response time\n- **TC-05:** Invalid input handling → verify proper error messages\n\n### Testing Levels\n\n- **Unit:** Services & utilities (Jest)\n- **Integration:** API endpoints (Supertest)\n- **E2E:** Critical user flows (Playwright)\n\n`,
  }
}

async function generateDevPrompt(idea: string): Promise<StreamedSection> {
  await new Promise((r) => setTimeout(r, 1200))
  return {
    stepId: "dev-prompt",
    title: "## Development Prompt\n\n",
    content: `### Tech Stack Recommendation\n\nFor **${idea}**:\n\n- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS\n- **Backend:** Node.js + Express / Fastify\n- **Database:** PostgreSQL + Prisma ORM\n- **Cache:** Redis\n- **Auth:** NextAuth.js / Clerk\n\n### Getting Started\n\n\`\`\`bash\ngit clone <repo>\nnpm install\ncp .env.example .env\nnpx prisma migrate dev\nnpm run dev\n\`\`\`\n\n### Key Dependencies\n\n- \`zod\` — Schema validation\n- \`react-query\` — Server state management\n- \`dnd-kit\` — Drag and drop\n\n`,
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
  /**
   * Get the prompt generator for a given workflow step.
   * Returns null if no generator is registered.
   */
  getGenerator(stepId: WorkflowStepId): PromptGenerator | null {
    return GENERATORS[stepId] ?? null
  }

  /**
   * Execute a step's prompt generation.
   * Returns the StreamedSection result.
   */
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
