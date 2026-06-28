"use client"

import { useState, useCallback, useRef } from "react"
import { Sparkles, Check, Loader2, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { WorkflowPanel } from "@/components/workflow/WorkflowPanel"
import {
  WORKFLOW_STEPS,
  STREAMED_SECTIONS,
  RECENT_IDEAS,
  SAMPLE_PLACEHOLDERS,
} from "@/constants"
import { WorkflowStep, GeneratePhase, StreamedSection } from "@/types"

interface WorkspaceProps {
  onGenerate: (sections: StreamedSection[]) => void
  onStreamUpdate: (sections: StreamedSection[]) => void
  onPhaseChange: (phase: GeneratePhase) => void
  phase: GeneratePhase
}

export function Workspace({
  onGenerate,
  onStreamUpdate,
  onPhaseChange,
  phase,
}: WorkspaceProps) {
  const [projectName, setProjectName] = useState("")
  const [idea, setIdea] = useState("")
  const [steps, setSteps] = useState<WorkflowStep[]>(
    WORKFLOW_STEPS.map((s) => ({ ...s, status: "PENDING" }))
  )
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const [placeholderIndex] = useState(
    () => Math.floor(Math.random() * SAMPLE_PLACEHOLDERS.length)
  )

  const handleGenerate = useCallback(() => {
    if (phase !== "idle") return

    onPhaseChange("generating")

    // Reset all steps to PENDING
    const initialSteps: WorkflowStep[] = WORKFLOW_STEPS.map((s) => ({
      ...s,
      status: "PENDING",
    }))
    setSteps(initialSteps)

    const streamedSoFar: StreamedSection[] = []
    let currentIndex = 0

    const advanceStep = () => {
      if (currentIndex >= WORKFLOW_STEPS.length) {
        // All done
        onPhaseChange("completed")
        return
      }

      const stepId = WORKFLOW_STEPS[currentIndex].id

      // Set current step to RUNNING
      setSteps((prev) =>
        prev.map((s) =>
          s.id === stepId ? { ...s, status: "RUNNING" } : s
        )
      )

      // After a delay, mark as COMPLETED and stream content
      const delay = 1200 + Math.random() * 800

      timerRef.current = setTimeout(() => {
        const section = STREAMED_SECTIONS.find((s) => s.stepId === stepId)
        if (section) {
          streamedSoFar.push(section)
          onStreamUpdate([...streamedSoFar])
        }

        setSteps((prev) =>
          prev.map((s) =>
            s.id === stepId ? { ...s, status: "COMPLETED" } : s
          )
        )

        currentIndex++
        advanceStep()
      }, delay)
    }

    // Small initial delay before first step
    timerRef.current = setTimeout(advanceStep, 400)
  }, [phase, onPhaseChange, onStreamUpdate])

  const buttonContent = () => {
    switch (phase) {
      case "generating":
        return (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Generating...
          </>
        )
      case "completed":
        return (
          <>
            <Check className="h-3.5 w-3.5" />
            Completed
          </>
        )
      default:
        return (
          <>
            <Sparkles className="h-3.5 w-3.5" />
            Generate
          </>
        )
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-5 py-5 border-b border-neutral-100">
        <h2 className="text-sm font-semibold text-neutral-900">Workspace</h2>
      </div>

      {/* Inputs */}
      <div className="px-5 py-4 space-y-3 border-b border-neutral-100">
        <div>
          <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            Project Name
          </label>
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. Campus Sports Management"
            className="mt-1 h-8 text-sm"
            disabled={phase === "generating"}
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            Idea
          </label>
          <Input
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder={SAMPLE_PLACEHOLDERS[placeholderIndex]}
            className="mt-1 h-8 text-sm"
            disabled={phase === "generating"}
          />
        </div>
        <Button
          onClick={handleGenerate}
          className="w-full h-8 text-sm gap-1.5 transition-all"
          size="sm"
          disabled={phase !== "idle"}
          variant={phase === "completed" ? "outline" : "default"}
        >
          {buttonContent()}
        </Button>
      </div>

      {/* Workflow */}
      <div className="flex-1 overflow-y-auto">
        <WorkflowPanel steps={steps} />
      </div>

      {/* Recent Ideas (only when idle) */}
      {phase === "idle" && (
        <div className="px-5 py-3 border-t border-neutral-100">
          <h3 className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-2">
            Recent Ideas
          </h3>
          <div className="space-y-0.5">
            {RECENT_IDEAS.map((item) => (
              <button
                key={item.name}
                className="flex w-full items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-neutral-50 transition-colors"
              >
                <Clock className="h-3 w-3 text-neutral-300 flex-shrink-0" />
                <span className="text-xs text-neutral-600 truncate">
                  {item.name}
                </span>
                <span className="text-[10px] text-neutral-300 ml-auto flex-shrink-0">
                  {item.date}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
