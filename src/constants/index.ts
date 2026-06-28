import { MenuItem, WorkflowStep, StreamedSection, Language } from "@/types"

export const MENU_ITEMS: MenuItem[] = [
  { id: "projects", label: "Projects", icon: "FolderKanban" },
  { id: "history", label: "History", icon: "History" },
  { id: "templates", label: "Templates", icon: "FileText" },
  { id: "settings", label: "Settings", icon: "Settings" },
]

export const WORKFLOW_STEPS: Omit<WorkflowStep, "status">[] = [
  { id: "clarification", name: "Clarification", runningText: "Analyzing product idea..." },
  { id: "requirement", name: "Requirement", runningText: "Generating requirements document..." },
  { id: "product-design", name: "Product Design", runningText: "Designing product architecture..." },
  { id: "flow", name: "Flow", runningText: "Mapping user flows..." },
  { id: "database", name: "Database", runningText: "Designing database schema..." },
  { id: "api", name: "API", runningText: "Defining API endpoints..." },
  { id: "test", name: "Test", runningText: "Generating test cases..." },
  { id: "dev-prompt", name: "Development Prompt", runningText: "Compiling development prompt..." },
  { id: "ai-review", name: "AI Review", runningText: "Reviewing output quality..." },
]

export const WORKFLOW_STEPS_ZH: Omit<WorkflowStep, "status">[] = [
  { id: "clarification", name: "需求澄清", runningText: "正在分析产品想法..." },
  { id: "requirement", name: "需求文档", runningText: "正在生成需求文档..." },
  { id: "product-design", name: "产品设计", runningText: "正在设计产品架构..." },
  { id: "flow", name: "用户流程", runningText: "正在绘制用户流程..." },
  { id: "database", name: "数据库", runningText: "正在设计数据库架构..." },
  { id: "api", name: "API设计", runningText: "正在定义API接口..." },
  { id: "test", name: "测试计划", runningText: "正在生成测试用例..." },
  { id: "dev-prompt", name: "开发指南", runningText: "正在编写开发指南..." },
  { id: "ai-review", name: "AI审查", runningText: "正在审查输出质量..." },
]

export const MOCK_WORKFLOW_DATA: WorkflowStep[] = [
  { id: "clarification", name: "Clarification", status: "COMPLETED", runningText: "Analyzing product idea..." },
  { id: "requirement", name: "Requirement", status: "COMPLETED", runningText: "Generating requirements document..." },
  { id: "product-design", name: "Product Design", status: "RUNNING", runningText: "Designing product architecture..." },
  { id: "flow", name: "Flow", status: "PENDING", runningText: "Mapping user flows..." },
  { id: "database", name: "Database", status: "PENDING", runningText: "Designing database schema..." },
  { id: "api", name: "API", status: "PENDING", runningText: "Defining API endpoints..." },
  { id: "test", name: "Test", status: "PENDING", runningText: "Generating test cases..." },
  { id: "dev-prompt", name: "Development Prompt", status: "PENDING", runningText: "Compiling development prompt..." },
  { id: "ai-review", name: "AI Review", status: "ERROR", runningText: "Reviewing output quality..." },
]

export const STREAMED_SECTIONS: StreamedSection[] = [
  {
    stepId: "clarification",
    title: "## Clarification\n\n",
    content: "Let me clarify your product idea to ensure we build the right thing.\n\n**Core Problem:** Users need a centralized platform to manage campus sports events.\n\n",
  },
]

export const SAMPLE_PLACEHOLDERS = [
  "e.g. AI Recruitment Assistant — smart hiring platform",
  "e.g. AI Learning Assistant — personalized tutoring",
  "e.g. Campus Sports Management — event & scoring",
  "e.g. Pet Healthcare Platform — appointments & records",
]

export const RECENT_IDEAS = [
  { name: "Campus Sports Management", date: "2 hours ago" },
  { name: "AI Learning Assistant", date: "1 day ago" },
  { name: "Pet Healthcare Platform", date: "2 days ago" },
]

export const EMPTY_STATE_FEATURES = [
  { icon: "FileText", label: "Requirement", desc: "Structured product requirements" },
  { icon: "Layers", label: "PRD", desc: "Complete product design document" },
  { icon: "Database", label: "Technical Design", desc: "Database & API architecture" },
  { icon: "CheckCircle", label: "Review", desc: "AI-powered quality assessment" },
]
