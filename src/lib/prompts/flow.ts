import { StreamedSection, Language } from "@/types"
import { getProvider, getConfig } from "@/lib/ai/providers"

const PROMPTS: Record<Language, string> = {
  en: `You are a UX designer. Map out key user flows. Include: ### Primary Flow (numbered steps), ### Secondary Flows (2-3 shorter flows), ### Edge Cases (2-3 cases). Markdown. 200-400 words. No title heading.`,
  zh: `你是一位UX设计师。绘制关键用户流程。包含：### 主要流程（编号步骤），### 次要流程（2-3个短流程），### 边界情况（2-3个）。Markdown格式。200-400字。不要包含标题。`,
}

export async function generateFlow(idea: string, language: Language = "en"): Promise<StreamedSection> {
  const provider = getProvider()
  const config = getConfig()
  const userPrompt = language === "zh" ? `产品想法：${idea}` : idea
  const content = await provider.generate(PROMPTS[language], userPrompt, config)
  return {
    stepId: "flow",
    title: language === "zh" ? "## 用户流程\n\n" : "## User Flows\n\n",
    content: content + "\n\n",
  }
}
