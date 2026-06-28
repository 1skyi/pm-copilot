import { StreamedSection, Language } from "@/types"
import { getProvider, getConfig } from "@/lib/ai/providers"

const PROMPTS: Record<Language, string> = {
  en: `You are an API architect. Design REST API. Include: ### RESTful Endpoints (code block: method, path, description), ### Authentication (JWT/OAuth), ### Response Format (JSON example). Markdown. 200-400 words. No title heading.`,
  zh: `你是一位API架构师。设计REST API。包含：### RESTful接口（代码块：方法、路径、描述），### 认证方式（JWT/OAuth），### 响应格式（JSON示例）。Markdown格式。200-400字。不要包含标题。`,
}

export async function generateAPI(idea: string, language: Language = "en"): Promise<StreamedSection> {
  const provider = getProvider()
  const config = getConfig()
  const userPrompt = language === "zh" ? `产品想法：${idea}` : idea
  const content = await provider.generate(PROMPTS[language], userPrompt, config)
  return {
    stepId: "api",
    title: language === "zh" ? "## API设计\n\n" : "## API Design\n\n",
    content: content + "\n\n",
  }
}
