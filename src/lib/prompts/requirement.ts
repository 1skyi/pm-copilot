import { StreamedSection, Language } from "@/types"
import { getProvider, getConfig } from "@/lib/ai/providers"

const PROMPTS: Record<Language, string> = {
  en: `You are a senior product manager. Generate functional and non-functional requirements for the given product idea. Include: ### Functional Requirements (4-6 numbered FR items), ### Non-Functional Requirements (3-4 items on performance, security, usability). Markdown. 200-400 words. No title heading.`,
  zh: `你是一位资深产品经理。为给定的产品想法生成功能和非功能需求。包含：### 功能需求（4-6条FR编号项），### 非功能需求（3-4条关于性能、安全、可用性）。Markdown格式。200-400字。不要包含标题。`,
}

export async function generateRequirement(idea: string, language: Language = "en"): Promise<StreamedSection> {
  const provider = getProvider()
  const config = getConfig()
  const userPrompt = language === "zh" ? `产品想法：${idea}` : idea
  const content = await provider.generate(PROMPTS[language], userPrompt, config)
  return {
    stepId: "requirement",
    title: language === "zh" ? "## 需求文档\n\n" : "## Requirements\n\n",
    content: content + "\n\n",
  }
}
