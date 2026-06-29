"use client"

import { useState, useCallback, useRef } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Sidebar } from "@/components/layout/Sidebar"
import { Workspace } from "@/components/workspace/Workspace"
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer"
import { GeneratePhase, StreamedSection, Language, CoachOutput, ReviewJson, ConvergenceResult, IterationRecord } from "@/types"
import { WorkflowStepId } from "@/lib/ai/workflow-engine"
import { coordinator } from "@/lib/ai/coordinator"

const MAX_ITERATIONS = 4

export default function Home() {
  const [phase, setPhase] = useState<GeneratePhase>("idle")
  const [sections, setSections] = useState<StreamedSection[]>([])
  const [language, setLanguage] = useState<Language>("en")
  const [streamingContent, setStreamingContent] = useState<Record<string, string>>({})
  const [activeStreamingStep, setActiveStreamingStep] = useState<WorkflowStepId | null>(null)
  const [review, setReview] = useState<ReviewJson | null>(null)
  const [coach, setCoach] = useState<CoachOutput | null>(null)
  const [convergence, setConvergence] = useState<ConvergenceResult | null>(null)
  const [iterationRecords, setIterationRecords] = useState<IterationRecord[]>([])
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
    if (newPhase === "idle") {
      setStreamingContent({})
      setActiveStreamingStep(null)
      setReview(null)
      setCoach(null)
      setConvergence(null)
    }
    if (newPhase === "completed") {
      setStreamingContent({})
      setActiveStreamingStep(null)
    }
  }, [])

  const handleReviewReady = useCallback((r: ReviewJson) => setReview(r), [])
  const handleCoachReady = useCallback((c: CoachOutput) => setCoach(c), [])
  const handleConvergence = useCallback((c: ConvergenceResult) => {
    setConvergence(c)
    setIterationRecords(coordinator.getIterationRecords())
  }, [])

  const handleLanguageChange = useCallback((lang: Language) => setLanguage(lang), [])

  // Optimize is triggered from CoachPanel → MarkdownViewer → here → Workspace's internal callback
  const handleOptimize = useCallback(() => {
    if (optimizeCallback) optimizeCallback()
  }, [optimizeCallback])

  const handleSetOptimizeCallback = useCallback((cb: (() => void) | null) => {
    setOptimizeCallback(cb)
  }, [])

  const handleReset = useCallback(() => {
    coordinator.resetIterations()
    setPhase("idle")
    setSections([])
    setReview(null)
    setCoach(null)
    setConvergence(null)
    setIterationRecords([])
  }, [])

  return (
    <MainLayout
      sidebar={<Sidebar />}
      workspace={
        <Workspace
          onStreamUpdate={handleStreamUpdate}
          onStreamChunk={handleStreamChunk}
          onPhaseChange={handlePhaseChange}
          onReviewReady={handleReviewReady}
          onCoachReady={handleCoachReady}
          onConvergence={handleConvergence}
          onSetOptimizeCallback={handleSetOptimizeCallback}
          onReset={handleReset}
          phase={phase}
          language={language}
          onLanguageChange={handleLanguageChange}
          review={review}
          convergence={convergence}
          iterationRecords={iterationRecords}
          maxIterations={MAX_ITERATIONS}
        />
      }
      result={
        <MarkdownViewer
          sections={sections}
          phase={phase}
          streamingContent={streamingContent}
          activeStreamingStep={activeStreamingStep}
          language={language}
          review={review}
          coach={coach}
          convergence={convergence}
          iterationRecords={iterationRecords}
          maxIterations={MAX_ITERATIONS}
          onOptimize={handleOptimize}
        />
      }
    />
  )
}
