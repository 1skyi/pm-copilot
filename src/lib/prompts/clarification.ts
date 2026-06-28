import { StreamedSection, Language } from "@/types"
import { getProvider, getConfig } from "@/lib/ai/providers"

const PROMPTS: Record<Language, string> = {
  en: `You are a senior product manager. Clarify the given product idea by asking and answering 3-5 key questions: core problem, target users, primary use cases, success metrics, constraints. Output in Markdown. Start with a brief overview. 200-400 words. Do NOT include a title heading.`,

  zh: `你是一位资深产品经理。请对给定的产品想法进行澄清分析，提出并回答3-5个关键问题：核心问题、目标用户、主要使用场景、成功指标、约束条件。使用Markdown格式输出。以简要概述开头。200-400字。不要包含标题。`,
}

export async function generateClarification(idea: string, language: Language = "en"): Promise<StreamedSection> {
  const provider = getProvider()
  const config = getConfig()

  const userPrompt = language === "zh"
    ? `产品想法：${idea}\n\n请对这个产品想法进行澄清分析。`
    : `Product Idea: ${idea}\n\nPlease clarify this product idea.`

  const content = await provider.generate(PROMPTS[language], userPrompt, config)

  return {
    stepId: "clarification",
    title: language === "zh" ? "## 需求澄清\n\n" : "## Clarification\n\n",
    content: content + "\n\n",
  }
}
