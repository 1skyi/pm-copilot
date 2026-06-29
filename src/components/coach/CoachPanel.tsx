"use client"

import { CoachOutput, CoachIssueAnalysis, IterationRecord, Language, ConvergenceResult } from "@/types"
import { Sparkles, TrendingUp, AlertTriangle, Target, RefreshCw, History, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CoachPanelProps {
  coach: CoachOutput
  convergence: ConvergenceResult | null
  iterationRecords: IterationRecord[]
  maxIterations: number
  language: Language
  onOptimize: () => void
  canOptimize: boolean
}

const MATURITY_COLORS: Record<string, string> = {
  "Idea": "border-red-200 bg-red-50 text-red-700",
  "Prototype": "border-orange-200 bg-orange-50 text-orange-700",
  "MVP Ready": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Market Ready": "border-blue-200 bg-blue-50 text-blue-700",
  "Investment Ready": "border-purple-200 bg-purple-50 text-purple-700",
}

const PRIORITY_COLORS: Record<string, string> = {
  P0: "border-red-200 bg-red-50 text-red-600",
  P1: "border-orange-200 bg-orange-50 text-orange-600",
  P2: "border-neutral-200 bg-neutral-50 text-neutral-600",
}

const UI_TEXT: Record<Language, Record<string, string>> = {
  en: {
    maturity: "Product Maturity", score: "Score", issues: "Issues",
    coachAdvice: "Coach Advice", optimize: "Optimize & Regenerate",
    optimizeDesc: "Fix review issues and improve the product idea",
    history: "Iteration History", round: "R", time: "Time",
    stalled: "Iteration Stalled — consider redefining product direction",
    converged: "All P0 issues resolved!",
    p0: "P0", p1: "P1", p2: "P2",
    whyItMatters: "Why It Matters", solution: "Solution", benefit: "Expected Benefit",
  },
  zh: {
    maturity: "产品成熟度", score: "评分", issues: "问题",
    coachAdvice: "教练建议", optimize: "优化并重新生成",
    optimizeDesc: "修复审查问题，改进产品想法",
    history: "迭代历史", round: "轮", time: "时间",
    stalled: "迭代停滞 — 建议重新定义产品方向",
    converged: "全部 P0 问题已解决！",
    p0: "P0", p1: "P1", p2: "P2",
    whyItMatters: "为什么重要", solution: "解决方案", benefit: "预期收益",
  },
}

export function CoachPanel({
  coach, convergence, iterationRecords, maxIterations, language, onOptimize, canOptimize,
}: CoachPanelProps) {
  const t = UI_TEXT[language]
  const currentRound = iterationRecords.length
  const isConverged = convergence?.status === "converged"
  const isStalled = convergence?.status === "stalled"

  return (
    <div className="px-6 py-5 space-y-5 border-t border-neutral-100">
      {/* Maturity + Score Row */}
      <div className="flex items-stretch gap-3">
        <div className={`flex-1 rounded-lg border p-3 ${MATURITY_COLORS[coach.maturity] || "border-neutral-200 bg-neutral-50"}`}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">{t.maturity}</span>
          </div>
          <p className="text-lg font-bold">{coach.maturity}</p>
        </div>
        <div className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{t.score}</span>
          <p className="text-lg font-bold text-neutral-700">{coach.score}</p>
        </div>
        <div className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{t.issues}</span>
          <p className="text-lg font-bold text-neutral-700">
            P0×{iterationRecords[iterationRecords.length - 1]?.p0Count ?? coach.topIssues.filter(i => i.priority === "P0").length}
          </p>
        </div>
      </div>

      {/* Top Issues */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-3.5 w-3.5 text-neutral-500" />
          <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Top Issues</h3>
        </div>
        <div className="space-y-2">
          {coach.topIssues.map((issue, i) => (
            <div key={i} className={`rounded-lg border p-3 ${PRIORITY_COLORS[issue.priority]}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border">{issue.priority}</span>
                <span className="text-[10px] opacity-60">{issue.field}</span>
                <p className="text-xs font-medium flex-1">{issue.problem}</p>
              </div>
              <div className="space-y-1 text-[10px]">
                <div><span className="font-semibold">{t.whyItMatters}:</span> {issue.whyItMatters}</div>
                <div><span className="font-semibold">{t.solution}:</span> {issue.solution}</div>
                <div><span className="font-semibold">{t.benefit}:</span> {issue.expectedBenefit}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coach Advice */}
      <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
        <div className="flex items-center gap-2 mb-1">
          <Target className="h-3.5 w-3.5 text-blue-500" />
          <h3 className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">{t.coachAdvice}</h3>
        </div>
        <p className="text-xs text-blue-700 leading-relaxed">{coach.coachAdvice}</p>
      </div>

      {/* Convergence Status */}
      {isConverged && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-xs text-emerald-700 font-medium">{t.converged}</p>
          {convergence?.reason && <p className="text-[10px] text-emerald-600 mt-0.5">{convergence.reason}</p>}
        </div>
      )}

      {isStalled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
          <XCircle className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          <p className="text-xs text-amber-700 font-medium">{t.stalled}</p>
          {convergence?.reason && <p className="text-[10px] text-amber-600 mt-0.5">{convergence.reason}</p>}
        </div>
      )}

      {/* Optimize Button */}
      {canOptimize && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-[10px] text-neutral-500 mb-2">{t.optimizeDesc}</p>
          <Button onClick={onOptimize} size="sm" className="w-full text-xs gap-1.5">
            <RefreshCw className="h-3 w-3" />{t.optimize}
          </Button>
        </div>
      )}

      {/* Iteration History */}
      {iterationRecords.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <History className="h-3 w-3 text-neutral-400" />
            <h3 className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{t.history}</h3>
            <span className="text-[10px] text-neutral-300">{currentRound}/{maxIterations}</span>
          </div>
          <div className="space-y-1">
            {iterationRecords.map((h) => (
              <div key={h.round} className="flex items-center justify-between text-[10px] text-neutral-500 px-2 py-1 rounded bg-neutral-50">
                <span>{t.round}{h.round}</span>
                <span className="text-neutral-400">{h.maturity}</span>
                <span>{h.score}</span>
                <span className="text-red-400" title="P0 count">P0×{h.p0Count}</span>
                <span className="text-neutral-300">{h.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
