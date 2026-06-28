import { StreamedSection, Language } from "@/types"
import { getProvider, getConfig } from "@/lib/ai/providers"

const PROMPTS: Record<Language, string> = {
  en: `You are a senior product designer. Create a product design overview. Include: ### Product Overview (one paragraph), ### Information Architecture (code block tree), ### Design Principles (3-4 bullets), ### Key Screens (3-4 screens). Markdown. 300-500 words. No title heading.`,
  zh: `你是一位资深产品设计师。创建产品设计概述。包含：### 产品概述（一段），### 信息架构（代码块树形结构），### 设计原则（3-4条），### 关键页面（3-4个页面）。Markdown格式。300-500字。不要包含标题。`,
}

export async function generatePRD(idea: string, language: Language = "en"): Promise<StreamedSection> {
  const provider = getProvider()
  const config = getConfig()
  const userPrompt = language === "zh" ? `产品想法：${idea}` : idea
  const content = await provider.generate(PROMPTS[language], userPrompt, config)
  return {
    stepId: "product-design",
    title: language === "zh" ? "## 产品设计\n\n" : "## Product Design\n\n",
    content: content + "\n\n",
  }
}
