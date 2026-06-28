"use client"

import { useState, useCallback } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Sidebar } from "@/components/layout/Sidebar"
import { Workspace } from "@/components/workspace/Workspace"
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer"
import { GeneratePhase, StreamedSection, Language, CoachOutput, IterationRecord } from "@/types"
import { WorkflowStepId } from "@/lib/ai/workflow-engine"

const MAX_ITERATIONS = 4

export default function Home() {
  const [phase, setPhase] = useState<GeneratePhase>("idle")
  const [sections, setSections] = useState<StreamedSection[]>([])
  const [language, setLanguage] = useState<Language>("en")
  const [streamingContent, setStreamingContent] = useState<Record<string, string>>({})
  const [activeStreamingStep, setActiveStreamingStep] = useState<WorkflowStepId | null>(null)
  const [coach, setCoach] = useState<CoachOutput | null>(null)
  const [iteration, setIteration] = useState(0)
  const [iterationHistory, setIterationHistory] = useState<IterationRecord[]>([])
  const [optimizeCallback, setOptimizeCallback] = useState<(() => void) | null>(null)

  const handleStreamUpdate = useCallback((newSections: StreamedSection[]) => {
    setSections(newSections)
    setActiveStreamingStep(null)
  }, [])

  const handleStreamChunk = useCallback((stepId: WorkflowStepId, delta: string) => {
    setActiveStreamingStep(stepId)
    setStreamingContent((prev) => ({ ...prev, [stepId]: (prev[stepId] || "") + delta }))
  }, [])

  const handlePhaseChange = useCallback((newPhase: GeneratePhase) => {
    setPhase(newPhase)
    if (newPhase === "idle" || newPhase === "completed") {
      setStreamingContent({})
      setActiveStreamingStep(null)
    }
  }, [])

  const handleCoachReady = useCallback((coachData: CoachOutput) => {
    setCoach(coachData)
    const record: IterationRecord = {
      round: iteration + 1,
      score: coachData.maturity.score,
      level: coachData.maturity.level,
      timestamp: new Date().toLocaleTimeString(),
    }
    setIteration((prev) => prev + 1)
    setIterationHistory((prev) => [...prev, record])
  }, [iteration])

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang)
  }, [])

  const handleSetOptimizeCallback = useCallback((cb: (() => void) | null) => {
    setOptimizeCallback(() => cb)
  }, [])

  const handleOptimize = useCallback(() => {
    if (optimizeCallback) optimizeCallback()
  }, [optimizeCallback])

  return (
    <MainLayout
      sidebar={<Sidebar />}
      workspace={
        <Workspace
          onStreamUpdate={handleStreamUpdate}
          onStreamChunk={handleStreamChunk}
          onPhaseChange={handlePhaseChange}
          onCoachReady={handleCoachReady}
          onSetOptimizeCallback={handleSetOptimizeCallback}
          phase={phase}
          language={language}
          onLanguageChange={handleLanguageChange}
          canOptimize={iteration < MAX_ITERATIONS}
        />
      }
      result={
        <MarkdownViewer
          sections={sections}
          phase={phase}
          streamingContent={streamingContent}
          activeStreamingStep={activeStreamingStep}
          language={language}
          coach={coach}
          iteration={iteration}
          iterationHistory={iterationHistory}
          maxIterations={MAX_ITERATIONS}
          canOptimize={iteration < MAX_ITERATIONS}
          onOptimize={handleOptimize}
        />
      }
    />
  )
}
