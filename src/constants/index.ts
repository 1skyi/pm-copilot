import { MenuItem, WorkflowStep, StreamedSection } from "@/types"

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
    content: "Let me clarify your product idea to ensure we build the right thing.\n\n**Core Problem:** Users need a centralized platform to manage campus sports events — from registration to live scoring.\n\n**Target Users:** Students, PE teachers, and event organizers.\n\n**Key Questions Resolved:**\n- Who can create events? → Admins & Teachers\n- Can students register themselves? → Yes, with approval\n- Real-time scoring? → Yes, via mobile & web\n\n",
  },
  {
    stepId: "requirement",
    title: "## Requirements\n\n",
    content: "### Functional Requirements\n\n- **FR-1:** User registration & role-based access (Admin, Teacher, Student)\n- **FR-2:** Event creation with date, location, category, and participant limits\n- **FR-3:** Online student registration with approval workflow\n- **FR-4:** Real-time score entry & leaderboard updates\n- **FR-5:** Event scheduling with conflict detection\n- **FR-6:** Notification system (email & in-app)\n\n### Non-Functional Requirements\n\n- Page load < 2 seconds\n- Support 10K concurrent users during peak events\n- 99.9% uptime during sports season\n\n",
  },
  {
    stepId: "product-design",
    title: "## Product Design\n\n",
    content: "### Information Architecture\n\n```\nHome\n├── Dashboard (upcoming events, stats)\n├── Events\n│   ├── Browse\n│   ├── My Registrations\n│   └── Create Event (Admin)\n├── Leaderboard\n└── Settings\n```\n\n### Design System\n\n- **Color Palette:** Sports-themed — vibrant blues & energetic oranges\n- **Typography:** Inter for UI, system sans-serif for data\n- **Components:** Card-based event tiles, real-time score widgets\n\n",
  },
  {
    stepId: "flow",
    title: "## User Flows\n\n",
    content: "### Primary Flow: Student Registration\n\n1. Student browses upcoming events\n2. Clicks event → views details\n3. Hits \"Register\" → fills form\n4. Teacher receives notification\n5. Teacher approves/rejects\n6. Student gets confirmation\n\n### Edge Cases\n\n- Registration full → waitlist option\n- Event cancelled → auto-refund & notification\n- Duplicate registration → blocked with message\n\n",
  },
  {
    stepId: "database",
    title: "## Database Schema\n\n",
    content: "### Core Tables\n\n| Table | Purpose | Key Fields |\n|-------|---------|------------|\n| `users` | Account management | id, email, role, school_id |\n| `events` | Sports events | id, name, date, location, max_participants |\n| `registrations` | Student signups | id, user_id, event_id, status |\n| `scores` | Live scoring | id, event_id, participant, score, timestamp |\n| `notifications` | Alerts | id, user_id, type, read_status |\n\n",
  },
  {
    stepId: "api",
    title: "## API Design\n\n",
    content: "### RESTful Endpoints\n\n```\nGET    /api/events              → List events (paginated)\nPOST   /api/events              → Create event (Admin)\nGET    /api/events/:id          → Event details\nPOST   /api/events/:id/register → Register for event\nPUT    /api/events/:id/score    → Update scores (live)\nGET    /api/leaderboard/:id     → Get leaderboard\n```\n\n### WebSocket Events\n\n- `score:update` — Real-time score push\n- `event:status` — Event status changes\n\n",
  },
  {
    stepId: "test",
    title: "## Test Plan\n\n",
    content: "### Test Cases\n\n- **TC-01:** Admin creates event → verify DB entry\n- **TC-02:** Student registers → verify approval flow\n- **TC-03:** Score update → verify leaderboard refresh\n- **TC-04:** Concurrent 500 users → verify < 2s response\n- **TC-05:** Event at capacity → verify waitlist behavior\n\n### Testing Levels\n\n- Unit tests: Services & utilities (Jest)\n- Integration: API endpoints (Supertest)\n- E2E: Critical flows (Playwright)\n\n",
  },
  {
    stepId: "dev-prompt",
    title: "## Development Prompt\n\n",
    content: "### Tech Stack\n\n- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS\n- **Backend:** Node.js + Express\n- **Database:** PostgreSQL + Prisma ORM\n- **Real-time:** WebSocket (Socket.io)\n- **Auth:** NextAuth.js\n\n### Getting Started\n\n```bash\ngit clone <repo>\nnpm install\ncp .env.example .env\nnpx prisma migrate dev\nnpm run dev\n```\n\n",
  },
  {
    stepId: "ai-review",
    title: "## AI Review\n\n",
    content: "### Quality Assessment ✅\n\n- Architecture follows clean separation of concerns\n- API design is RESTful and intuitive\n- Database schema is normalized and scalable\n- Test coverage plan is comprehensive\n\n### Suggestions\n\n- Consider adding a caching layer (Redis) for leaderboard\n- Add rate limiting on registration endpoint\n- Implement circuit breaker for external services\n\n---\n\n*Generated by PM Copilot v1.0*\n",
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
