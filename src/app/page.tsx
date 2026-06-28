"use client"

import { useState, useCallback, useRef } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Sidebar } from "@/components/layout/Sidebar"
import { Workspace } from "@/components/workspace/Workspace"
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer"
import { GeneratePhase, StreamedSection, Language } from "@/types"
import { WorkflowStepId } from "@/lib/ai/workflow-engine"

export default function Home() {
  const [phase, setPhase] = useState<GeneratePhase>("idle")
  const [sections, setSections] = useState<StreamedSection[]>([])
  const [language, setLanguage] = useState<Language>("en")
  // Streaming state: maps stepId → currently streaming content
  const [streamingContent, setStreamingContent] = useState<Record<string, string>>({})
  const [activeStreamingStep, setActiveStreamingStep] = useState<WorkflowStepId | null>(null)

  const handleStreamUpdate = useCallback((newSections: StreamedSection[]) => {
    setSections(newSections)
    // Clear streaming state when a step completes
    setActiveStreamingStep(null)
  }, [])

  const handleStreamChunk = useCallback((stepId: WorkflowStepId, delta: string) => {
    setActiveStreamingStep(stepId)
    setStreamingContent((prev) => ({
      ...prev,
      [stepId]: (prev[stepId] || "") + delta,
    }))
  }, [])

  const handlePhaseChange = useCallback((newPhase: GeneratePhase) => {
    setPhase(newPhase)
    if (newPhase === "idle" || newPhase === "completed") {
      setStreamingContent({})
      setActiveStreamingStep(null)
    }
  }, [])

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang)
  }, [])

  return (
    <MainLayout
      sidebar={<Sidebar />}
      workspace={
        <Workspace
          onStreamUpdate={handleStreamUpdate}
          onStreamChunk={handleStreamChunk}
          onPhaseChange={handlePhaseChange}
          phase={phase}
          language={language}
          onLanguageChange={handleLanguageChange}
        />
      }
      result={
        <MarkdownViewer
          sections={sections}
          phase={phase}
          streamingContent={streamingContent}
          activeStreamingStep={activeStreamingStep}
          language={language}
        />
      }
    />
  )
}
