import { StreamedSection, Language } from "@/types"
import { WorkflowStepId } from "./workflow-engine"
import { getProvider, getConfig } from "./providers"
import { generateClarification } from "@/lib/prompts/clarification"
import { generateRequirement } from "@/lib/prompts/requirement"
import { generatePRD } from "@/lib/prompts/prd"
import { generateFlow } from "@/lib/prompts/flow"
import { generateDatabase } from "@/lib/prompts/database"
import { generateAPI } from "@/lib/prompts/api"
import { generateReview } from "@/lib/prompts/review"

type PromptGenerator = (idea: string, language: Language) => Promise<StreamedSection>

const TEST_PROMPTS: Record<Language, string> = {
  en: `You are a QA engineer. Write a test plan. Include: ### Test Cases (4-5 numbered TC items), ### Testing Levels (Unit, Integration, E2E with tools). Markdown. 200-400 words. No title heading.`,
  zh: `你是一位QA工程师。编写测试计划。包含：### 测试用例（4-5条TC编号项），### 测试层级（单元测试、集成测试、E2E及工具）。Markdown格式。200-400字。不要包含标题。`,
}

async function generateTest(idea: string, language: Language = "en"): Promise<StreamedSection> {
  const provider = getProvider()
  const config = getConfig()
  const userPrompt = language === "zh" ? `产品想法：${idea}` : idea
  const content = await provider.generate(TEST_PROMPTS[language], userPrompt, config)
  return {
    stepId: "test",
    title: language === "zh" ? "## 测试计划\n\n" : "## Test Plan\n\n",
    content: content + "\n\n",
  }
}

const DEV_PROMPTS: Record<Language, string> = {
  en: `You are a tech lead. Write a development prompt. Include: ### Tech Stack (with justification), ### Getting Started (bash code block), ### Key Dependencies (3-4 npm packages). Markdown. 200-400 words. No title heading.`,
  zh: `你是一位技术负责人。编写开发指南。包含：### 技术栈（含理由），### 快速开始（bash代码块），### 关键依赖（3-4个npm包）。Markdown格式。200-400字。不要包含标题。`,
}

async function generateDevPrompt(idea: string, language: Language = "en"): Promise<StreamedSection> {
  const provider = getProvider()
  const config = getConfig()
  const userPrompt = language === "zh" ? `产品想法：${idea}` : idea
  const content = await provider.generate(DEV_PROMPTS[language], userPrompt, config)
  return {
    stepId: "dev-prompt",
    title: language === "zh" ? "## 开发指南\n\n" : "## Development Prompt\n\n",
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

  async execute(stepId: WorkflowStepId, idea: string, language: Language = "en"): Promise<StreamedSection> {
    const generator = this.getGenerator(stepId)
    if (!generator) {
      return {
        stepId,
        title: `## ${stepId}\n\n`,
        content: `*Generated content for ${stepId}*\n\n`,
      }
    }
    return generator(idea, language)
  }
}
