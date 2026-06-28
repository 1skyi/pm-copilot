"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Sparkles, Check, Loader2, Clock, XCircle, Languages, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { WorkflowPanel } from "@/components/workflow/WorkflowPanel"
import { coordinator, CoordinatorCallbacks } from "@/lib/ai/coordinator"
import { ProviderError } from "@/lib/ai/provider"
import { WorkflowStepId } from "@/lib/ai/workflow-engine"
import { WORKFLOW_STEPS, WORKFLOW_STEPS_ZH, RECENT_IDEAS, SAMPLE_PLACEHOLDERS } from "@/constants"
import { WorkflowStep, GeneratePhase, StreamedSection, Language, CoachOutput } from "@/types"

interface WorkspaceProps {
  onStreamUpdate: (sections: StreamedSection[]) => void
  onStreamChunk: (stepId: WorkflowStepId, delta: string) => void
  onPhaseChange: (phase: GeneratePhase) => void
  onCoachReady: (coach: CoachOutput) => void
  onSetOptimizeCallback: (cb: (() => void) | null) => void
  phase: GeneratePhase
  language: Language
  onLanguageChange: (lang: Language) => void
  canOptimize: boolean
}

export function Workspace({
  onStreamUpdate, onStreamChunk, onPhaseChange,
  onCoachReady, onSetOptimizeCallback,
  phase, language, onLanguageChange, canOptimize,
}: WorkspaceProps) {
  const [projectName, setProjectName] = useState("")
  const [idea, setIdea] = useState("")
  const stepTemplates = language === "zh" ? WORKFLOW_STEPS_ZH : WORKFLOW_STEPS
  const [steps, setSteps] = useState<WorkflowStep[]>(
    stepTemplates.map((s) => ({ ...s, status: "PENDING" }))
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const originalIdeaRef = useRef("")
  const lastCoachRef = useRef<CoachOutput | null>(null)
  const issueHistoryRef = useRef<string[]>([])

  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  // Pick random placeholder on client to avoid SSR hydration mismatch
  useEffect(() => {
    setPlaceholderIndex(Math.floor(Math.random() * SAMPLE_PLACEHOLDERS.length))
  }, [])

  useEffect(() => {
    if (phase === "idle") {
      const templates = language === "zh" ? WORKFLOW_STEPS_ZH : WORKFLOW_STEPS
      setSteps(templates.map((s) => ({ ...s, status: "PENDING" })))
    }
  }, [language, phase])

  const runWorkflow = useCallback((ideaText: string) => {
    if (phase !== "idle") return
    setErrorMessage(null)
    onPhaseChange("generating")
    originalIdeaRef.current = ideaText

    const callbacks: CoordinatorCallbacks = {
      onStepStart: (_step, allSteps) => {
        const bilingual = allSteps.map((s) => {
          const zh = WORKFLOW_STEPS_ZH.find((z) => z.id === s.id)
          return language === "zh" && zh ? { ...s, name: zh.name, runningText: zh.runningText } : s
        })
        setSteps(bilingual)
      },
      onStreamChunk: (stepId, delta) => onStreamChunk(stepId, delta),
      onStepComplete: (_step, _section, allSections, allSteps) => {
        onStreamUpdate(allSections)
        setSteps(allSteps)
      },
      onComplete: (allSections) => {
        onStreamUpdate(allSections)
        onPhaseChange("completed")
      },
      onCoachReady: (coach) => {
        lastCoachRef.current = coach
        // Accumulate issue titles for convergence
        coach.topIssues.forEach((i) => issueHistoryRef.current.push(`[${i.priority}] ${i.title}`))
        onCoachReady(coach)
      },
      onError: (_stepId, error) => {
        if (error instanceof ProviderError && error.code === "missing_key") {
          setErrorMessage(error.message)
          onPhaseChange("idle")
        }
      },
    }

    coordinator.execute(ideaText, language, callbacks)
  }, [phase, language, onPhaseChange, onStreamUpdate, onStreamChunk, onCoachReady])

  const handleGenerate = useCallback(() => {
    const ideaText = idea.trim() || projectName.trim() || (language === "zh" ? "未命名项目" : "Untitled Project")
    runWorkflow(ideaText)
  }, [idea, projectName, runWorkflow, language])

  // Optimize: generate improved idea then re-run
  const handleOptimize = useCallback(async () => {
    if (!canOptimize || !lastCoachRef.current) return
    const originalIdea = originalIdeaRef.current || idea.trim() || projectName.trim()
    if (!originalIdea) return

    onPhaseChange("generating")
    setErrorMessage(null)

    try {
      const improvedIdea = await coordinator.generateImprovedIdea(
        originalIdea, lastCoachRef.current, language, issueHistoryRef.current
      )
      setIdea(improvedIdea)
      // Reset phase so runWorkflow can proceed
      onPhaseChange("idle")
      // Brief timeout to let React re-render then start
      setTimeout(() => runWorkflow(improvedIdea), 100)
    } catch {
      setErrorMessage(language === "zh" ? "优化失败，请重试" : "Optimization failed, please retry")
      onPhaseChange("idle")
    }
  }, [canOptimize, idea, projectName, language, onPhaseChange, runWorkflow])

  // Register optimize callback for parent
  useEffect(() => {
    onSetOptimizeCallback(() => handleOptimize)
    return () => onSetOptimizeCallback(null)
  }, [handleOptimize, onSetOptimizeCallback])

  const toggleLanguage = () => onLanguageChange(language === "en" ? "zh" : "en")

  const buttonContent = () => {
    switch (phase) {
      case "generating":
        return <><Loader2 className="h-3.5 w-3.5 animate-spin" />{language === "zh" ? "生成中..." : "Generating..."}</>
      case "completed":
        return <><Check className="h-3.5 w-3.5" />{language === "zh" ? "已完成" : "Completed"}</>
      default:
        return <><Sparkles className="h-3.5 w-3.5" />{language === "zh" ? "开始生成" : "Generate"}</>
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5 border-b border-neutral-100">
        <h2 className="text-sm font-semibold text-neutral-900">
          {language === "zh" ? "工作区" : "Workspace"}
        </h2>
        <button onClick={toggleLanguage} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors">
          <Languages className="h-3 w-3" />{language === "en" ? "中文" : "EN"}
        </button>
      </div>

      <div className="px-5 py-4 space-y-3 border-b border-neutral-100">
        <div>
          <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            {language === "zh" ? "项目名称" : "Project Name"}
          </label>
          <Input value={projectName} onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. Campus Sports Management" className="mt-1 h-8 text-sm"
            disabled={phase === "generating"} />
        </div>
        <div>
          <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            {language === "zh" ? "产品想法" : "Idea"}
          </label>
          <Input value={idea} onChange={(e) => setIdea(e.target.value)}
            placeholder={SAMPLE_PLACEHOLDERS[placeholderIndex]} className="mt-1 h-8 text-sm"
            disabled={phase === "generating"} />
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2 p-2.5 rounded-md bg-red-50 border border-red-100">
            <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-600 leading-relaxed">{errorMessage}</p>
          </div>
        )}

        <Button onClick={handleGenerate} className="w-full h-8 text-sm gap-1.5 transition-all"
          size="sm" disabled={phase !== "idle"}
          variant={phase === "completed" ? "outline" : "default"}>
          {buttonContent()}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <WorkflowPanel steps={steps} language={language} />
      </div>

      {phase === "idle" && (
        <div className="px-5 py-3 border-t border-neutral-100">
          <h3 className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-2">
            {language === "zh" ? "最近想法" : "Recent Ideas"}
          </h3>
          <div className="space-y-0.5">
            {RECENT_IDEAS.map((item) => (
              <button key={item.name} className="flex w-full items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-neutral-50 transition-colors">
                <Clock className="h-3 w-3 text-neutral-300 flex-shrink-0" />
                <span className="text-xs text-neutral-600 truncate">{item.name}</span>
                <span className="text-[10px] text-neutral-300 ml-auto flex-shrink-0">{item.date}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
