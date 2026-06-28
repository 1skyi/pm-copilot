"use client"

import { CoachOutput, CoachIssue, IterationRecord, Language, MaturityLevel } from "@/types"
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight, Target, RefreshCw, History } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CoachPanelProps {
  coach: CoachOutput
  iteration: number
  maxIterations: number
  history: IterationRecord[]
  language: Language
  onOptimize: () => void
  canOptimize: boolean
}

const LEVEL_COLORS: Record<MaturityLevel, string> = {
  L1: "text-red-500 bg-red-50 border-red-200",
  L2: "text-orange-500 bg-orange-50 border-orange-200",
  L3: "text-yellow-500 bg-yellow-50 border-yellow-200",
  L4: "text-blue-500 bg-blue-50 border-blue-200",
  L5: "text-emerald-500 bg-emerald-50 border-emerald-200",
}

const PRIORITY_COLORS: Record<string, string> = {
  P0: "text-red-600 bg-red-50 border-red-200",
  P1: "text-orange-600 bg-orange-50 border-orange-200",
  P2: "text-neutral-600 bg-neutral-50 border-neutral-200",
}

const UI_TEXT: Record<Language, Record<string, string>> = {
  en: {
    maturity: "Product Maturity",
    level: "Level",
    score: "Score",
    nextStage: "Next Stage",
    topIssues: "Top 3 Issues",
    cause: "Cause",
    solution: "Solution",
    benefit: "Expected Benefit",
    coachAdvice: "Coach Advice",
    optimize: "Optimize Idea",
    optimizeDesc: "Use review feedback to generate an improved product idea",
    history: "Iteration History",
    round: "Round",
    time: "Time",
    limitReached: "Iteration limit reached. Consider redefining your product idea.",
    noHistory: "No previous iterations",
  },
  zh: {
    maturity: "产品成熟度",
    level: "等级",
    score: "评分",
    nextStage: "下一阶段",
    topIssues: "Top 3 问题",
    cause: "原因",
    solution: "解决方案",
    benefit: "预期收益",
    coachAdvice: "教练建议",
    optimize: "优化想法",
    optimizeDesc: "利用审查反馈生成改进后的产品想法",
    history: "迭代历史",
    round: "轮次",
    time: "时间",
    limitReached: "已达迭代上限，建议重新定义产品想法。",
    noHistory: "暂无迭代记录",
  },
}

export function CoachPanel({
  coach,
  iteration,
  maxIterations,
  history,
  language,
  onOptimize,
  canOptimize,
}: CoachPanelProps) {
  const t = UI_TEXT[language]

  return (
    <div className="px-6 py-5 space-y-5 border-t border-neutral-100">
      {/* Maturity Card */}
      <div className={`rounded-lg border p-4 ${LEVEL_COLORS[coach.maturity.level]}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">{t.maturity}</h3>
          </div>
          <span className="text-[10px] opacity-60">Round {iteration}/{maxIterations}</span>
        </div>
        <div className="flex items-end gap-6">
          <div>
            <p className="text-[10px] opacity-60 uppercase">{t.level}</p>
            <p className="text-2xl font-bold">{coach.maturity.level}</p>
          </div>
          <div>
            <p className="text-[10px] opacity-60 uppercase">{t.score}</p>
            <p className="text-2xl font-bold">{coach.maturity.score}</p>
          </div>
        </div>
        <p className="text-[11px] mt-2 opacity-80 leading-relaxed">{coach.maturity.nextStage}</p>
      </div>

      {/* Top 3 Issues */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-3.5 w-3.5 text-neutral-500" />
          <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">{t.topIssues}</h3>
        </div>
        <div className="space-y-2">
          {coach.topIssues.map((issue, i) => (
            <IssueCard key={i} issue={issue} language={language} t={t} />
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

      {/* Optimize Button */}
      {canOptimize ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-[10px] text-neutral-500 mb-2">{t.optimizeDesc}</p>
          <Button onClick={onOptimize} size="sm" className="w-full text-xs gap-1.5">
            <RefreshCw className="h-3 w-3" />
            {t.optimize}
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-red-100 bg-red-50/50 p-3">
          <p className="text-[10px] text-red-500 text-center">{t.limitReached}</p>
        </div>
      )}

      {/* Iteration History */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <History className="h-3 w-3 text-neutral-400" />
            <h3 className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{t.history}</h3>
          </div>
          <div className="space-y-1">
            {history.map((h) => (
              <div key={h.round} className="flex items-center justify-between text-[10px] text-neutral-500 px-2 py-1 rounded bg-neutral-50">
                <span>{t.round} {h.round}</span>
                <span>{h.level} · {h.score}</span>
                <span className="text-neutral-300">{h.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function IssueCard({ issue, language, t }: { issue: CoachIssue; language: Language; t: Record<string, string> }) {
  return (
    <div className={`rounded-lg border p-3 ${PRIORITY_COLORS[issue.priority] || PRIORITY_COLORS.P2}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border">{issue.priority}</span>
        <p className="text-xs font-medium">{issue.title}</p>
      </div>
      <div className="grid grid-cols-1 gap-1.5 text-[10px]">
        {issue.cause && (
          <div><span className="font-medium opacity-70">{t.cause}:</span> <span className="opacity-80">{issue.cause}</span></div>
        )}
        {issue.solution && (
          <div><span className="font-medium opacity-70">{t.solution}:</span> <span className="opacity-80">{issue.solution}</span></div>
        )}
        {issue.expectedBenefit && (
          <div><span className="font-medium opacity-70">{t.benefit}:</span> <span className="opacity-80">{issue.expectedBenefit}</span></div>
        )}
      </div>
    </div>
  )
}
