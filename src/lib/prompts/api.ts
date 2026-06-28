import { StreamedSection } from "@/types"

export async function generateAPI(idea: string): Promise<StreamedSection> {
  await new Promise((r) => setTimeout(r, 1500))

  return {
    stepId: "api",
    title: "## API Design\n\n",
    content: `### RESTful Endpoints\n\n\`\`\`\nGET    /api/projects              → List projects (paginated)\nPOST   /api/projects              → Create project\nGET    /api/projects/:id          → Project details\nPUT    /api/projects/:id          → Update project\nDELETE /api/projects/:id          → Archive project\n\nGET    /api/items                 → List items (filtered)\nPOST   /api/items                 → Create item\nPUT    /api/items/:id             → Update item\nDELETE /api/items/:id             → Delete item\n\nGET    /api/tags                  → List tags\nPOST   /api/tags                  → Create tag\n\`\`\`\n\n### Authentication\n\n- Bearer token via \`Authorization\` header\n- JWT with refresh token rotation\n- Rate limit: 100 req/min per user\n\n### Response Format\n\n\`\`\`json\n{\n  "data": { ... },\n  "meta": { "page": 1, "total": 42 },\n  "error": null\n}\n\`\`\`\n\n`,
  }
}
