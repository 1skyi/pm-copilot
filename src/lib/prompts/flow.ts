import { StreamedSection } from "@/types"

export async function generateFlow(idea: string): Promise<StreamedSection> {
  await new Promise((r) => setTimeout(r, 1400))

  return {
    stepId: "flow",
    title: "## User Flows\n\n",
    content: `### Primary Flow\n\n1. User lands on dashboard\n2. User creates new ${idea.toLowerCase()} entry\n3. System validates input\n4. System processes & saves\n5. User receives confirmation\n6. User views results\n\n### Secondary Flows\n\n- **Edit Flow:** View → Edit → Validate → Save\n- **Delete Flow:** Select → Confirm → Archive\n- **Search Flow:** Input → Filter → Results → Action\n\n### Edge Cases\n\n- Invalid input → inline validation message\n- Network error → retry with exponential backoff\n- Concurrent edits → optimistic lock + conflict resolution\n\n`,
  }
}
