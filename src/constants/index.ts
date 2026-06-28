import { MenuItem, WorkflowStep } from "@/types"

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
  { id: "ai-review", name: "AI Review", runningText: "Reviewing output quality..." },
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
