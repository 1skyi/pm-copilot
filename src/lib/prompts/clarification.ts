import { StreamedSection } from "@/types"

export async function generateClarification(idea: string): Promise<StreamedSection> {
  // Mock — Sprint3 替换为真实 AI 调用
  await new Promise((r) => setTimeout(r, 1200))

  return {
    stepId: "clarification",
    title: "## Clarification\n\n",
    content: `Let me clarify the product idea to ensure we build the right thing.\n\n**Idea:** ${idea}\n\n**Core Problem:** Users need a centralized solution to manage their workflow efficiently.\n\n**Target Users:** Product managers, developers, and stakeholders.\n\n**Key Questions Resolved:**\n- What is the primary use case? → Identified\n- Who are the end users? → Mapped\n- What are the success metrics? → Defined\n\n`,
  }
}
