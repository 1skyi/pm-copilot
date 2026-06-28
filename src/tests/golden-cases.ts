import { Language } from "@/types"

export interface GoldenCase {
  id: string
  name: string
  idea: Record<Language, string>
  category: string
}

/**
 * Golden Cases — fixed test set for prompt quality regression testing.
 * After every prompt change, run these 5 cases and verify:
 * 1. Same idea → consistent output structure
 * 2. Different ideas → meaningfully different content
 * 3. Output has professional PM quality (not generic)
 */
export const GOLDEN_CASES: GoldenCase[] = [
  {
    id: "case-1",
    name: "Virtual Study Room",
    category: "Education",
    idea: {
      en: "A virtual study room where students can join focus sessions, track study hours, and compete on leaderboards with friends.",
      zh: "一个虚拟自习室，学生可以加入专注学习时段，追踪学习时长，并与好友在排行榜上竞争。",
    },
  },
  {
    id: "case-2",
    name: "Campus Sports Management",
    category: "Education",
    idea: {
      en: "A campus sports event management system where organizers can create events, students can register, and scores are updated in real-time.",
      zh: "一个校园运动会管理系统，组织者可以创建赛事，学生可以报名参加，比分实时更新。",
    },
  },
  {
    id: "case-3",
    name: "AI Recruitment Platform",
    category: "HR Tech",
    idea: {
      en: "An AI-powered recruitment platform that automatically screens resumes, matches candidates to job descriptions, and schedules interviews.",
      zh: "一个 AI 驱动的招聘平台，自动筛选简历，将候选人与职位描述匹配，并安排面试。",
    },
  },
  {
    id: "case-4",
    name: "Pet Healthcare Platform",
    category: "Healthcare",
    idea: {
      en: "A pet healthcare platform where pet owners can book vet appointments, track vaccination records, and access telemedicine consultations.",
      zh: "一个宠物医疗平台，宠物主人可以预约兽医、追踪疫苗接种记录，并使用远程问诊服务。",
    },
  },
  {
    id: "case-5",
    name: "Campus Second-hand Trading",
    category: "Marketplace",
    idea: {
      en: "A campus second-hand trading platform where students can buy and sell used textbooks, electronics, and dorm supplies within their university.",
      zh: "一个校园二手交易平台，学生可以在校内买卖二手教材、电子产品和宿舍用品。",
    },
  },
]

/**
 * Run a golden case test manually:
 * 1. Input the idea into PM Copilot
 * 2. Let the full workflow complete
 * 3. Check that:
 *    - Clarification covers core problem + users + metrics
 *    - Requirements has numbered FR items with acceptance criteria  
 *    - Product Design includes user flow + modules + edge cases
 *    - Database has 5-7 entities with relationships
 *    - API has 8-12 endpoints with auth
 *    - AI Review identifies risks + missing features + P0/P1/P2 priorities
 *    - AI Review verdict is honest (not generic praise)
 */
export function validateOutputQuality(output: string, caseId: string): {
  passed: boolean
  issues: string[]
} {
  const issues: string[] = []

  // Structure checks
  if (!output.includes("## ")) {
    issues.push("Missing section headers")
  }
  if (output.length < 500) {
    issues.push("Output too short — likely incomplete")
  }
  if (output.includes("I think") || output.includes("maybe") || output.includes("也许") || output.includes("我认为")) {
    issues.push("Contains subjective qualifiers — should be definitive")
  }

  // Review-specific checks
  if (output.includes("AI Review") || output.includes("AI审查")) {
    if (!output.includes("P0") && !output.includes("P1")) {
      issues.push("AI Review missing priority levels (P0/P1/P2)")
    }
    if (!output.includes("风险") && !output.includes("Risk") && !output.includes("risk")) {
      issues.push("AI Review missing risk analysis")
    }
  }

  // Requirement-specific checks
  if (output.includes("FR-")) {
    if (!output.includes("验收标准") && !output.includes("Acceptance Criteria")) {
      issues.push("Requirements missing acceptance criteria")
    }
  }

  return {
    passed: issues.length === 0,
    issues,
  }
}
