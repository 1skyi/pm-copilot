import { StreamedSection } from "@/types"

export async function generateRequirement(idea: string): Promise<StreamedSection> {
  await new Promise((r) => setTimeout(r, 1500))

  return {
    stepId: "requirement",
    title: "## Requirements\n\n",
    content: `### Functional Requirements\n\nBased on "${idea}":\n\n- **FR-1:** User authentication & role-based access control\n- **FR-2:** Core business entity CRUD operations\n- **FR-3:** Search & filter with pagination\n- **FR-4:** Real-time notifications & alerts\n- **FR-5:** Data export (CSV, PDF)\n- **FR-6:** Activity audit log\n\n### Non-Functional Requirements\n\n- Page load < 2 seconds\n- Support 1K+ concurrent users\n- 99.9% uptime SLA\n- Mobile-responsive design\n\n`,
  }
}
