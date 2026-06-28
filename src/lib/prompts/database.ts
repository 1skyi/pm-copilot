import { StreamedSection } from "@/types"

export async function generateDatabase(idea: string): Promise<StreamedSection> {
  await new Promise((r) => setTimeout(r, 1600))

  return {
    stepId: "database",
    title: "## Database Schema\n\n",
    content: `### Core Entities\n\n| Table | Purpose | Key Fields |\n|-------|---------|------------|\n| \`users\` | Account management | id, email, name, role, created_at |\n| \`projects\` | ${idea} projects | id, user_id, name, status, created_at |\n| \`items\` | Core business data | id, project_id, title, body, status |\n| \`tags\` | Categorization | id, name, color |\n| \`item_tags\` | M2M relationship | item_id, tag_id |\n| \`audit_logs\` | Activity tracking | id, user_id, action, entity, created_at |\n\n### Relationships\n\n- \`users\` 1→N \`projects\`\n- \`projects\` 1→N \`items\`\n- \`items\` N↔M \`tags\` via \`item_tags\`\n\n### Indexes\n\n- \`users.email\` (unique)\n- \`projects.user_id\` (foreign key)\n- \`items.project_id + status\` (compound)\n- \`audit_logs.created_at\` (time-range queries)\n\n`,
  }
}
