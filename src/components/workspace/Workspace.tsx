"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Sparkles, Check, Loader2, Clock, XCircle, Languages } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { WorkflowPanel } from "@/components/workflow/WorkflowPanel"
import { VersionTimeline } from "@/components/workspace/VersionTimeline"
import { coordinator, CoordinatorCallbacks } from "@/lib/ai/coordinator"
import { ProviderError } from "@/lib/ai/provider"
import { WorkflowStepId } from "@/lib/ai/workflow-engine"
import { WORKFLOW_STEPS, WORKFLOW_STEPS_ZH, RECENT_IDEAS, SAMPLE_PLACEHOLDERS } from "@/constants"
import { WorkflowStep, GeneratePhase, StreamedSection, Language, ReviewJson, CoachOutput, ConvergenceResult, IterationRecord, VersionV1, QualityGateResult } from "@/types"

interface WorkspaceProps {
  onStreamUpdate: (sections: StreamedSection[]) => void
  onStreamChunk: (stepId: WorkflowStepId, delta: string) => void
  onPhaseChange: (phase: GeneratePhase) => void
  onReviewReady: (review: ReviewJson) => void
  onCoachReady: (coach: CoachOutput) => void
  onConvergence: (result: ConvergenceResult) => void
  onSetOptimizeCallback: (cb: (() => void) | null) => void
  onReset: () => void
  phase: GeneratePhase
  language: Language
  onLanguageChange: (lang: Language) => void
  review: ReviewJson | null
  convergence: ConvergenceResult | null
  iterationRecords: IterationRecord[]
  maxIterations: number
  versions: VersionV1[]
  viewingVn: number | null
  latestVn: number | null
  bestVn: number | null
  onSelectVersion: (vn: number) => void
  qualityGate: QualityGateResult | null
  onDiscardVersion: (vn: number) => void
  onViewBest: () => void
  onStepClick: (stepId: string) => void
}

export function Workspace({
  onStreamUpdate, onStreamChunk, onPhaseChange,
  onReviewReady, onCoachReady, onConvergence,
  onSetOptimizeCallback, onReset,
  phase, language, onLanguageChange, review, convergence, iterationRecords, maxIterations,
  versions, viewingVn, latestVn, bestVn, onSelectVersion, qualityGate, onDiscardVersion, onViewBest,
  onStepClick,
}: WorkspaceProps) {
  const [projectName, setProjectName] = useState("")
  const [idea, setIdea] = useState("")
  const stepTemplates = language === "zh" ? WORKFLOW_STEPS_ZH : WORKFLOW_STEPS
  const [steps, setSteps] = useState<WorkflowStep[]>(stepTemplates.map((s) => ({ ...s, status: "PENDING" })))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const ideaRef = useRef("")
  const reviewRef = useRef<ReviewJson | null>(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  useEffect(() => { reviewRef.current = review }, [review])

  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  useEffect(() => { setPlaceholderIndex(Math.floor(Math.random() * SAMPLE_PLACEHOLDERS.length)) }, [])

  useEffect(() => {
    if (phase === "idle") {
      const t = language === "zh" ? WORKFLOW_STEPS_ZH : WORKFLOW_STEPS
      setSteps(t.map((s) => ({ ...s, status: "PENDING" })))
    }
  }, [language, phase])

  const runWorkflow = useCallback((ideaText: string) => {
    if (phaseRef.current !== "generating" && phaseRef.current !== "idle") return
    onPhaseChange("generating")
    ideaRef.current = ideaText
    const cb: CoordinatorCallbacks = {
      onStepStart: (_, allSteps) => {
        const b = allSteps.map((s) => {
          const zh = WORKFLOW_STEPS_ZH.find((z) => z.id === s.id)
          return language === "zh" && zh ? { ...s, name: zh.name, runningText: zh.runningText } : s
        })
        setSteps(b)
      },
      onStreamChunk: (stepId, delta) => onStreamChunk(stepId, delta),
      onStepComplete: (_, __, allSections, allSteps) => { onStreamUpdate(allSections); setSteps(allSteps) },
      onComplete: (allSections) => { onStreamUpdate(allSections); onPhaseChange("completed") },
      onReviewReady, onCoachReady, onConvergence,
      onError: (_stepId, error) => {
        if (error instanceof ProviderError && error.code === "missing_key") {
          setErrorMessage(error.message); onPhaseChange("idle")
        }
      },
    }
    coordinator.execute(ideaText, language, cb)
  }, [language, onPhaseChange, onStreamUpdate, onStreamChunk, onReviewReady, onCoachReady, onConvergence])

  const handleGenerate = useCallback(() => {
    if (phase !== "idle") return; setErrorMessage(null)
    runWorkflow(idea.trim() || projectName.trim() || (language === "zh" ? "未命名项目" : "Untitled Project"))
  }, [phase, idea, projectName, runWorkflow, language])

  const toggleLanguage = () => onLanguageChange(language === "en" ? "zh" : "en")

  const buttonContent = () => {
    switch (phase) {
      case "generating": return <><Loader2 className="h-3.5 w-3.5 animate-spin" />{language === "zh" ? "生成中..." : "Generating..."}</>
      case "completed": return <><Check className="h-3.5 w-3.5" />{language === "zh" ? "已完成" : "Completed"}</>
      default: return <><Sparkles className="h-3.5 w-3.5" />{language === "zh" ? "生成" : "Generate"}</>
    }
  }

  const isStalled = convergence?.status === "stalled"
  const canOptimize = convergence?.status !== "stalled" && true

  const handleOptimize = useCallback(async () => {
    if (!canOptimize) return; setErrorMessage(null)
    onStreamUpdate([]) // Clear old spec so user sees fresh streaming
    try {
      const originalIdea = ideaRef.current || idea.trim() || projectName.trim() || (language === "zh" ? "未命名项目" : "Untitled Project")
      if (!reviewRef.current) { setErrorMessage(language === "zh" ? "没有审查结果" : "No review available"); return }
      const { improvedIdea: improved } = await coordinator.optimize(originalIdea, reviewRef.current, language)
      setIdea(improved); ideaRef.current = improved; onPhaseChange("idle")
      setTimeout(() => { if (phaseRef.current !== "generating") { onPhaseChange("generating"); runWorkflow(improved) } }, 100)
    } catch { setErrorMessage(language === "zh" ? "优化失败" : "Optimization failed"); onPhaseChange("idle") }
  }, [canOptimize, idea, projectName, language, onPhaseChange, onStreamUpdate, runWorkflow])

  useEffect(() => { onSetOptimizeCallback(() => handleOptimize); return () => onSetOptimizeCallback(null) }, [handleOptimize, onSetOptimizeCallback])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5 border-b border-neutral-100">
        <h2 className="text-sm font-semibold text-neutral-900">{language === "zh" ? "工作区" : "Workspace"}</h2>
        <button onClick={toggleLanguage} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors">
          <Languages className="h-3 w-3" />{language === "en" ? "中文" : "EN"}
        </button>
      </div>

      <div className="px-5 py-4 space-y-3 border-b border-neutral-100">
        <div>
          <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{language === "zh" ? "项目名称" : "Project Name"}</label>
          <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Campus Sports Management" className="mt-1 h-8 text-sm" disabled={phase === "generating"} />
        </div>
        <div>
          <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{language === "zh" ? "产品想法" : "Idea"}</label>
          <Input value={idea} onChange={(e) => setIdea(e.target.value)} placeholder={SAMPLE_PLACEHOLDERS[placeholderIndex]} className="mt-1 h-8 text-sm" disabled={phase === "generating"} />
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2 p-2.5 rounded-md bg-red-50 border border-red-100">
            <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-600 leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {isStalled && (
          <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-100">
            <XCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-700">
              <p className="font-medium mb-0.5">{language === "zh" ? "迭代停滞" : "Iteration Stalled"}</p>
              <p className="text-amber-600">{convergence.reason}</p>
            </div>
          </div>
        )}

        {/* Quality Gate */}
        {qualityGate && !qualityGate.passed && (
          <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-100">
            <XCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-xs text-amber-700">
              <p className="font-medium mb-0.5">{language === "zh" ? "质量关卡未通过" : "Quality Gate Failed"}</p>
              <p className="text-amber-600 mb-1.5">{qualityGate.message}</p>
              <div className="flex gap-2">
                <button onClick={onViewBest} className="text-[10px] px-2 py-0.5 rounded border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 transition-colors">{language === "zh" ? "查看最佳版本" : "View Best Version"}</button>
                <button onClick={() => viewingVn && onDiscardVersion(viewingVn)} className="text-[10px] px-2 py-0.5 rounded border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 transition-colors">{language === "zh" ? "放弃此版本" : "Discard"}</button>
              </div>
            </div>
          </div>
        )}

        <Button onClick={handleGenerate} className="w-full h-8 text-sm gap-1.5 transition-all" size="sm" disabled={phase !== "idle"} variant={phase === "completed" ? "outline" : "default"}>
          {buttonContent()}
        </Button>

        {(convergence?.status === "converged" || convergence?.status === "stalled" || convergence?.status === "limit_reached") && (
          <Button onClick={onReset} className="w-full h-8 text-sm gap-1.5" size="sm" variant="ghost">
            {language === "zh" ? "重新开始" : "Start Fresh"}
          </Button>
        )}
      </div>

      {versions.length > 0 && (
        <VersionTimeline versions={versions} viewingVn={viewingVn} latestVn={latestVn} bestVn={bestVn} onSelectVersion={onSelectVersion} language={language} />
      )}

      <div className="flex-1 overflow-y-auto">
        <WorkflowPanel steps={steps} language={language} onStepClick={onStepClick} />
      </div>

      {phase === "idle" && !review && (
        <div className="px-5 py-3 border-t border-neutral-100">
          <h3 className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-2">{language === "zh" ? "最近想法" : "Recent Ideas"}</h3>
          <div className="space-y-0.5">
            {RECENT_IDEAS.map((item) => (
              <button key={item.name} className="flex w-full items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-neutral-50 transition-colors">
                <Clock className="h-3 w-3 text-neutral-300 flex-shrink-0" /><span className="text-xs text-neutral-600 truncate">{item.name}</span><span className="text-[10px] text-neutral-300 ml-auto flex-shrink-0">{item.date}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
