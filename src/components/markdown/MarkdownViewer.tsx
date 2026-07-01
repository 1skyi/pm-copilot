"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Sparkles, Copy, Download, Check, FileText, Layers, Database, CheckCircle, Loader2, ChevronLeft, ChevronRight, Star, GitCompare, TrendingUp } from "lucide-react"
import { GeneratePhase, StreamedSection, Language, ReviewJson, CoachOutput, ConvergenceResult, IterationRecord, VersionV1, QualityGateResult } from "@/types"
import { WorkflowStepId } from "@/lib/ai/workflow-engine"
import { EMPTY_STATE_FEATURES } from "@/constants"
import { CoachPanel } from "@/components/coach/CoachPanel"
import { VersionCompare } from "@/components/markdown/VersionCompare"
import { EvolutionInsight } from "@/components/markdown/EvolutionInsight"

interface MarkdownViewerProps {
  sections: StreamedSection[]; phase: GeneratePhase
  streamingContent: Record<string, string>; activeStreamingStep: WorkflowStepId | null
  language: Language; review: ReviewJson | null; coach: CoachOutput | null
  convergence: ConvergenceResult | null; iterationRecords: IterationRecord[]; maxIterations: number
  onOptimize: () => void
  // Version
  currentVersion: VersionV1 | null; versions: VersionV1[]
  viewingVn: number | null; latestVn: number | null; bestVn: number | null
  isLatest: boolean; isBest: boolean
  onSelectVersion: (vn: number) => void; onViewBest: () => void
  qualityGate: QualityGateResult | null; onDiscardVersion: (vn: number) => void
  // Compare / Evolution
  compareView: { vA: number; vB: number } | null
  onCompare: (vA: number, vB: number) => void; onCloseCompare: () => void
  evolutionInsight: string | null; onShowEvolution: () => void; onCloseEvolution: () => void
}

const featureIconMap: Record<string, React.ComponentType<{ className?: string }>> = { FileText, Layers, Database, CheckCircle }

const SECTION_TITLES: Record<WorkflowStepId, Record<Language, string>> = {
  clarification: { en: "## Clarification\n\n", zh: "## 需求澄清\n\n" },
  requirement: { en: "## Requirements\n\n", zh: "## 需求文档\n\n" },
  "product-design": { en: "## Product Design\n\n", zh: "## 产品设计\n\n" },
  flow: { en: "## User Flows\n\n", zh: "## 用户流程\n\n" },
  database: { en: "## Database Schema\n\n", zh: "## 数据库设计\n\n" },
  api: { en: "## API Design\n\n", zh: "## API设计\n\n" },
  test: { en: "## Test Plan\n\n", zh: "## 测试计划\n\n" },
  "dev-prompt": { en: "## Development Prompt\n\n", zh: "## 开发指南\n\n" },
  "ai-review": { en: "## AI Review\n\n", zh: "## AI审查\n\n" },
}

const MAT_BG: Record<string, string> = {
  "Idea": "border-neutral-200 bg-neutral-50 text-neutral-600", "Prototype": "border-orange-200 bg-orange-50 text-orange-700",
  "MVP Ready": "border-emerald-200 bg-emerald-50 text-emerald-700", "Market Ready": "border-blue-200 bg-blue-50 text-blue-700",
  "Investment Ready": "border-purple-200 bg-purple-50 text-purple-700",
}

const UI: Record<Language, Record<string, string>> = {
  en: { title:"Result", generating:"Generating...", copy:"Copy", copied:"Copied", export:"Export",
    thinking:"AI is thinking...", emptyTitle:"PM Copilot",
    emptyDesc:"Describe your product idea, and AI will automatically generate structured documents for you.",
    prev:"Previous", next:"Next", compare:"Compare", evolution:"Evolution" },
  zh: { title:"生成结果", generating:"生成中...", copy:"复制", copied:"已复制", export:"导出",
    thinking:"AI 正在思考...", emptyTitle:"PM Copilot",
    emptyDesc:"描述你的产品想法，AI 将自动生成结构化文档。",
    prev:"上一版", next:"下一版", compare:"对比", evolution:"演进" },
}

const EMPTY_FEATURES_ZH = [
  { icon:"FileText", label:"需求文档", desc:"结构化产品需求" }, { icon:"Layers", label:"产品设计", desc:"完整产品设计文档" },
  { icon:"Database", label:"技术设计", desc:"数据库与 API 架构" }, { icon:"CheckCircle", label:"AI 审查", desc:"AI 驱动的质量评估" },
]

function EmptyState({ language }: { language: Language }) {
  const t = UI[language]; const features = language === "zh" ? EMPTY_FEATURES_ZH : EMPTY_STATE_FEATURES
  return (
    <div className="flex h-full flex-col items-center justify-center px-8">
      <div className="flex items-center gap-2 mb-6"><Sparkles className="h-6 w-6 text-neutral-800" /><h1 className="text-xl font-semibold text-neutral-900 tracking-tight">{t.emptyTitle}</h1></div>
      <p className="text-sm text-neutral-500 text-center mb-8 max-w-xs leading-relaxed">{t.emptyDesc}</p>
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {features.map((feat) => { const Icon = featureIconMap[feat.icon]; return <div key={feat.label} className="flex flex-col items-center gap-2 p-4 rounded-lg border border-neutral-100 bg-neutral-50/50">{Icon && <Icon className="h-5 w-5 text-neutral-500" />}<span className="text-xs font-medium text-neutral-700">{feat.label}</span><span className="text-[10px] text-neutral-400 text-center leading-tight">{feat.desc}</span></div> })}
      </div>
    </div>
  )
}

function formatReviewMd(review: ReviewJson, language: Language): string {
  const sl = language === "zh" ? "评分" : "Score"; const ml = language === "zh" ? "成熟度" : "Maturity"
  const il = language === "zh" ? "问题" : "Issues"
  let md = `**${sl}:** ${review.score}  |  **${ml}:** ${review.maturity}\n\n### ${il}\n\n`
  for (const i of review.issues) {
    md += `- **[${i.priority}] ${i.field}** — ${i.problem}\n`
    md += `  - ${language === "zh" ? "原因" : "Reason"}: ${i.reason}\n`
    md += `  - ${language === "zh" ? "建议" : "Recommendation"}: ${i.recommendation}\n\n`
  }
  return md
}

export function MarkdownViewer({
  sections, phase, streamingContent, activeStreamingStep, language,
  review, coach, convergence, iterationRecords, maxIterations, onOptimize,
  currentVersion, versions, viewingVn, latestVn, bestVn, isLatest, isBest,
  onSelectVersion, onViewBest, qualityGate, onDiscardVersion,
  compareView, onCompare, onCloseCompare, evolutionInsight, onShowEvolution, onCloseEvolution,
}: MarkdownViewerProps) {
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const userScrolledUpRef = useRef(false)
  const t = UI[language]

  const displaySections = sections.map((s) => s.stepId === "ai-review" && review ? { ...s, content: formatReviewMd(review, language) + "\n\n" } : s)
  const completedContent = displaySections.map((s) => (SECTION_TITLES[s.stepId as WorkflowStepId]?.[language] ?? s.title) + s.content).join("")
  let streamingBlock = ""
  if (activeStreamingStep && streamingContent[activeStreamingStep]) {
    streamingBlock = (SECTION_TITLES[activeStreamingStep]?.[language] ?? `## ${activeStreamingStep}\n\n`) + streamingContent[activeStreamingStep]
  }
  const fullContent = completedContent + streamingBlock

  useEffect(() => { const el = scrollRef.current; if (el && !userScrolledUpRef.current) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }) }, [fullContent])
  useEffect(() => { if (phase === "generating") userScrolledUpRef.current = false }, [phase])
  const handleScroll = useCallback(() => { const el = scrollRef.current; if (el) userScrolledUpRef.current = el.scrollTop + el.clientHeight < el.scrollHeight - 40 }, [])

  const getFullText = useCallback(() => sections.map((s) => (SECTION_TITLES[s.stepId as WorkflowStepId]?.[language] ?? s.title) + s.content).join(""), [sections, language])
  const handleCopy = useCallback(async () => { try { await navigator.clipboard.writeText(getFullText()); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {} }, [getFullText])
  const handleExport = useCallback(() => { const b = new Blob([getFullText()], { type: "text/markdown" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "pm-copilot-output.md"; a.click(); URL.revokeObjectURL(u) }, [getFullText])

  const canOptimize = convergence?.status === "iterating" && iterationRecords.length < maxIterations
  const hasVersions = versions.length >= 2
  const idx = versions.findIndex((v) => v.versionNumber === viewingVn)
  const hasPrev = idx > 0; const hasNext = idx >= 0 && idx < versions.length - 1

  if (phase === "idle" && !review) return <EmptyState language={language} />

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-neutral-900">{t.title}</h2>
          {phase === "generating" && <span className="flex items-center gap-1 text-[10px] text-blue-500"><span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />{t.generating}</span>}
        </div>
        <div className="flex items-center gap-1">
          {viewingVn && (
            <div className="flex items-center gap-1 mr-2 border-r border-neutral-100 pr-2">
              <button onClick={() => hasPrev && onSelectVersion(viewingVn - 1)} disabled={!hasPrev} className="p-1 rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed" title={t.prev}><ChevronLeft className="h-3 w-3" /></button>
              <span className="text-[10px] text-neutral-500 font-mono min-w-[40px] text-center">v{viewingVn}</span>
              <button onClick={() => hasNext && onSelectVersion(viewingVn + 1)} disabled={!hasNext} className="p-1 rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed" title={t.next}><ChevronRight className="h-3 w-3" /></button>
              {isBest && <Star className="h-3 w-3 text-amber-400" />}
              {isLatest && !isBest && <span className="text-[9px] text-blue-400 font-medium">NEW</span>}
            </div>
          )}
          {currentVersion && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${MAT_BG[currentVersion.maturity] || "border-neutral-200 bg-neutral-50"}`}>{currentVersion.maturity} · {currentVersion.score}</span>
          )}
          {sections.length > 0 && (
            <>
              <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50">{copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}{copied ? t.copied : t.copy}</button>
              <button onClick={handleExport} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"><Download className="h-3 w-3" />{t.export}</button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" ref={scrollRef} onScroll={handleScroll}>
        {compareView && <VersionCompare vA={compareView.vA} vB={compareView.vB} language={language} onClose={onCloseCompare} versions={versions} />}
        {evolutionInsight && <EvolutionInsight insight={evolutionInsight} language={language} onClose={onCloseEvolution} />}

        {!compareView && !evolutionInsight && (
          <div className="px-6 py-5">
            <article className="prose prose-neutral max-w-none prose-headings:font-semibold prose-headings:text-neutral-900 prose-headings:tracking-tight prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-neutral-600 prose-p:leading-relaxed prose-p:text-base prose-a:text-neutral-800 prose-a:underline prose-a:underline-offset-2 prose-strong:text-neutral-800 prose-strong:font-semibold prose-code:text-neutral-700 prose-code:bg-neutral-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-neutral-900 prose-pre:text-neutral-100 prose-pre:text-xs prose-table:text-sm prose-th:font-medium prose-th:text-neutral-700 prose-td:text-neutral-600 prose-blockquote:text-neutral-500 prose-blockquote:border-neutral-200 prose-li:text-neutral-600 prose-li:text-base prose-hr:border-neutral-100">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{fullContent}</ReactMarkdown>
            </article>
            {activeStreamingStep && <span className="inline-block w-1.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle" />}
            {phase === "generating" && !fullContent && <div className="flex items-center gap-2 text-neutral-400 text-sm"><Loader2 className="h-4 w-4 animate-spin" /><span>{t.thinking}</span></div>}
          </div>
        )}

        {/* Version actions */}
        {!compareView && !evolutionInsight && viewingVn && hasVersions && phase === "completed" && (
          <div className="px-6 pb-3 flex items-center gap-2">
            <button onClick={() => { const other = idx === 0 ? versions[1].versionNumber : versions[0].versionNumber; onCompare(viewingVn, other) }} className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors"><GitCompare className="h-3 w-3" />{t.compare}</button>
            <button onClick={onShowEvolution} className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors"><TrendingUp className="h-3 w-3" />{t.evolution}</button>
          </div>
        )}

        {coach && !compareView && !evolutionInsight && (
          <CoachPanel
            coach={coach} convergence={convergence} iterationRecords={iterationRecords} maxIterations={maxIterations} language={language} onOptimize={onOptimize} canOptimize={canOptimize}
            isLatest={isLatest} isBest={isBest} currentVersionNumber={viewingVn ?? 0} bestVersionNumber={bestVn ?? 0}
            onViewBest={onViewBest} qualityGate={qualityGate} onDiscardVersion={() => viewingVn && onDiscardVersion(viewingVn)}
          />
        )}
      </div>
    </div>
  )
}
