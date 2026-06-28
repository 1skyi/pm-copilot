"use client"

import { useState, useCallback } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Sidebar } from "@/components/layout/Sidebar"
import { Workspace } from "@/components/workspace/Workspace"
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer"
import { GeneratePhase, StreamedSection } from "@/types"

export default function Home() {
  const [phase, setPhase] = useState<GeneratePhase>("idle")
  const [sections, setSections] = useState<StreamedSection[]>([])

  const handleStreamUpdate = useCallback((newSections: StreamedSection[]) => {
    setSections(newSections)
  }, [])

  const handlePhaseChange = useCallback((newPhase: GeneratePhase) => {
    setPhase(newPhase)
  }, [])

  return (
    <MainLayout
      sidebar={<Sidebar />}
      workspace={
        <Workspace
          onGenerate={() => {}}
          onStreamUpdate={handleStreamUpdate}
          onPhaseChange={handlePhaseChange}
          phase={phase}
        />
      }
      result={
        <MarkdownViewer
          sections={sections}
          phase={phase}
        />
      }
    />
  )
}
