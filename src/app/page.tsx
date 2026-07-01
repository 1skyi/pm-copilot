"use client"

import { useState, useCallback, useMemo } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Sidebar } from "@/components/layout/Sidebar"
import { Workspace } from "@/components/workspace/Workspace"
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer"
import { GeneratePhase, StreamedSection, Language, CoachOutput, ReviewJson, ConvergenceResult, IterationRecord, VersionV1, QualityGateResult } from "@/types"
import { WorkflowStepId } from "@/lib/ai/workflow-engine"
import { coordinator } from "@/lib/ai/coordinator"
import { versionManager } from "@/lib/ai/version-manager"

export default function Home() {
  // ─── Core ───
  const [phase, setPhase] = useState<GeneratePhase>("idle")
  const [language, setLanguage] = useState<Language>("en")

  // Streaming (during generation)
  const [streamingContent, setStreamingContent] = useState<Record<string, string>>({})
  const [activeStreamingStep, setActiveStreamingStep] = useState<WorkflowStepId | null>(null)

  // Live sections during generation (before version is created)
  const [liveSections, setLiveSections] = useState<StreamedSection[]>([])

  // Version state
  const [versions, setVersions] = useState<VersionV1[]>([])
  const [viewingVn, setViewingVn] = useState<number | null>(null)

  // Post-generation
  const [convergence, setConvergence] = useState<ConvergenceResult | null>(null)
  const [qualityGate, setQualityGate] = useState<QualityGateResult | null>(null)
  const [optimizeCallback, setOptimizeCallback] = useState<(() => void) | null>(null)

  // Compare & Evolution
  const [compareView, setCompareView] = useState<{ vA: number; vB: number } | null>(null)
  const [evolutionInsight, setEvolutionInsight] = useState<string | null>(null)

  // ─── Derived ───

  const currentVersion = useMemo(
    () => versions.find((v) => v.versionNumber === viewingVn) ?? null,
    [versions, viewingVn],
  )

  const latestVn = useMemo(
    () => versions.length > 0 ? versions[versions.length - 1].versionNumber : null,
    [versions],
  )

  const bestVn = useMemo(() => versionManager.getBestVersionNumber(), [versions])

  const isLatest = viewingVn === latestVn
  const isBest = viewingVn === bestVn

  // During generation: show live streaming. Idle/completed: show from version (or live fallback).
  const sections = phase === "generating" ? liveSections : (currentVersion?.sections ?? liveSections)
  const review = currentVersion?.review ?? null
  const coach = currentVersion?.coach ?? null
  const iterationRecords: IterationRecord[] = useMemo(
    () => versions.map((v) => ({
      round: v.versionNumber, score: v.score, maturity: v.maturity,
      p0Count: v.p0Count, p1Count: v.p1Count,
      timestamp: new Date(v.timestamp).toLocaleTimeString(),
    })),
    [versions],
  )

  // ─── Sync ───

  const sync = useCallback(() => {
    setVersions(versionManager.getAll())
    const l = versionManager.latestNumber
    if (l !== null) setViewingVn(l)
  }, [])

  // ─── Handlers ───

  const handleStreamUpdate = useCallback((newSections: StreamedSection[]) => {
    setLiveSections(newSections)
    setActiveStreamingStep(null)
  }, [])

  const handleStreamChunk = useCallback((stepId: WorkflowStepId, delta: string) => {
    setActiveStreamingStep(stepId)
    setStreamingContent((prev) => ({ ...prev, [stepId]: (prev[stepId] || "") + delta }))
  }, [])

  const handlePhaseChange = useCallback((p: GeneratePhase) => {
    setPhase(p)
    if (p === "idle") {
      setStreamingContent({}); setActiveStreamingStep(null)
      setConvergence(null); setQualityGate(null)
    }
    if (p === "generating") {
      setLiveSections([])
      setStreamingContent({}); setActiveStreamingStep(null)
      setConvergence(null); setQualityGate(null)
    }
    if (p === "completed") {
      setStreamingContent({}); setActiveStreamingStep(null)
      // NOTE: Version is created AFTER onComplete, so sync() is deferred to onConvergence
    }
  }, [sync])

  const handleReviewReady = useCallback((_: ReviewJson) => {}, [])
  const handleCoachReady = useCallback((_: CoachOutput) => {}, [])
  const handleConvergence = useCallback((c: ConvergenceResult) => {
    setConvergence(c)
    sync()
    const ln = versionManager.latestNumber
    if (ln !== null) setQualityGate(versionManager.checkQualityGate(ln))
  }, [sync])
  const handleLanguageChange = useCallback((l: Language) => setLanguage(l), [])
  const handleOptimize = useCallback(() => { if (optimizeCallback) optimizeCallback() }, [optimizeCallback])
  const handleSetOptimizeCallback = useCallback((cb: (() => void) | null) => setOptimizeCallback(cb), [])

  const handleReset = useCallback(() => {
    coordinator.resetIterations()
    versionManager.reset()
    setPhase("idle"); setLiveSections([]); setVersions([]); setViewingVn(null)
    setConvergence(null); setQualityGate(null); setCompareView(null); setEvolutionInsight(null)
  }, [])

  const handleSelectVersion = useCallback((vn: number) => {
    versionManager.setViewing(vn)
    setViewingVn(vn)
    setQualityGate(null)
    // Load this version's sections for display
    const v = versionManager.get(vn)
    if (v) setLiveSections(v.sections)
  }, [])

  const handleViewBest = useCallback(() => {
    const b = versionManager.getBestVersionNumber()
    if (b !== null) handleSelectVersion(b)
  }, [handleSelectVersion])

  const handleDiscardVersion = useCallback((vn: number) => {
    versionManager.discardVersion(vn)
    sync(); setQualityGate(null)
  }, [sync])

  const handleCompare = useCallback((vA: number, vB: number) => setCompareView({ vA, vB }), [])
  const handleCloseCompare = useCallback(() => setCompareView(null), [])

  const handleShowEvolution = useCallback(async () => {
    setEvolutionInsight(await coordinator.generateEvolutionInsight(language))
  }, [language])

  const handleCloseEvolution = useCallback(() => setEvolutionInsight(null), [])

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
          maxIterations={4}
          // Version props
          versions={versions}
          viewingVn={viewingVn}
          latestVn={latestVn}
          bestVn={bestVn}
          onSelectVersion={handleSelectVersion}
          qualityGate={qualityGate}
          onDiscardVersion={handleDiscardVersion}
          onViewBest={handleViewBest}
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
          maxIterations={4}
          onOptimize={handleOptimize}
          // Version props
          currentVersion={currentVersion}
          versions={versions}
          viewingVn={viewingVn}
          latestVn={latestVn}
          bestVn={bestVn}
          isLatest={isLatest}
          isBest={isBest}
          onSelectVersion={handleSelectVersion}
          onViewBest={handleViewBest}
          qualityGate={qualityGate}
          onDiscardVersion={handleDiscardVersion}
          // Compare & Evolution
          compareView={compareView}
          onCompare={handleCompare}
          onCloseCompare={handleCloseCompare}
          evolutionInsight={evolutionInsight}
          onShowEvolution={handleShowEvolution}
          onCloseEvolution={handleCloseEvolution}
        />
      }
    />
  )
}
