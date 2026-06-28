import { StreamedSection } from "@/types"

export async function generatePRD(idea: string): Promise<StreamedSection> {
  await new Promise((r) => setTimeout(r, 1800))

  return {
    stepId: "product-design",
    title: "## Product Design\n\n",
    content: `### Product Overview\n\n**${idea}** — A comprehensive solution designed for modern teams.\n\n### Information Architecture\n\n\`\`\`\nHome\n├── Dashboard (KPIs & metrics)\n├── Workspace (main workflow)\n│   ├── Create\n│   ├── Manage\n│   └── Analyze\n├── Reports\n└── Settings\n\`\`\`\n\n### Design Principles\n\n- **Minimalist** — Less UI, more focus\n- **Responsive** — Works on all devices\n- **Accessible** — WCAG 2.1 compliant\n\n### Key Screens\n\n1. **Dashboard** — Overview with charts & quick actions\n2. **Workspace** — Primary interaction surface\n3. **Reports** — Data visualization & export\n\n`,
  }
}
