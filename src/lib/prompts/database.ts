import { StreamedSection, Language } from "@/types"
import { getProvider, getConfig } from "@/lib/ai/providers"

const PROMPTS: Record<Language, string> = {
  en: `You are a backend architect. Design database schema. Include: ### Core Entities (table with columns: Table, Purpose, Key Fields), ### Relationships (1 to N and N to M), ### Indexes (recommended). Markdown. 200-400 words. No title heading.`,
  zh: `你是一位后端架构师。设计数据库架构。包含：### 核心实体（表格含列：表名、用途、关键字段），### 实体关系（1对多和多对多），### 索引建议。Markdown格式。200-400字。不要包含标题。`,
}

export async function generateDatabase(idea: string, language: Language = "en"): Promise<StreamedSection> {
  const provider = getProvider()
  const config = getConfig()
  const userPrompt = language === "zh" ? `产品想法：${idea}` : idea
  const content = await provider.generate(PROMPTS[language], userPrompt, config)
  return {
    stepId: "database",
    title: language === "zh" ? "## 数据库设计\n\n" : "## Database Schema\n\n",
    content: content + "\n\n",
  }
}
