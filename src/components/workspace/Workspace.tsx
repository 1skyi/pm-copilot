"use client"

import { useState, useCallback, useEffect } from "react"
import { Sparkles, Check, Loader2, Clock, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { WorkflowPanel } from "@/components/workflow/WorkflowPanel"
import { coordinator, CoordinatorCallbacks } from "@/lib/ai/coordinator"
import { ProviderError } from "@/lib/ai/provider"
import { WORKFLOW_STEPS, RECENT_IDEAS, SAMPLE_PLACEHOLDERS } from "@/constants"
import { WorkflowStep, GeneratePhase, StreamedSection } from "@/types"

interface WorkspaceProps {
  onStreamUpdate: (sections: StreamedSection[]) => void
  onPhaseChange: (phase: GeneratePhase) => void
  phase: GeneratePhase
}

export function Workspace({
  onStreamUpdate,
  onPhaseChange,
  phase,
}: WorkspaceProps) {
  const [projectName, setProjectName] = useState("")
  const [idea, setIdea] = useState("")
  const [steps, setSteps] = useState<WorkflowStep[]>(
    WORKFLOW_STEPS.map((s) => ({ ...s, status: "PENDING" }))
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  // Pick random placeholder on client to avoid SSR hydration mismatch
  useEffect(() => {
    setPlaceholderIndex(Math.floor(Math.random() * SAMPLE_PLACEHOLDERS.length))
  }, [])

  // Abort coordinator on unmount to prevent setState on unmounted component
  useEffect(() => {
    return () => {
      coordinator.abort()
    }
  }, [])

  const handleGenerate = useCallback(() => {
    if (phase !== "idle") return

    setErrorMessage(null)
    onPhaseChange("generating")

    const ideaText = idea.trim() || projectName.trim() || "Untitled Project"

    const callbacks: CoordinatorCallbacks = {
      onStepStart: (_step, allSteps) => {
        setSteps(allSteps)
      },
      onStepComplete: (_step, _section, allSections) => {
        onStreamUpdate(allSections)
      },
      onComplete: (allSections) => {
        onStreamUpdate(allSections)
        onPhaseChange("completed")
      },
      onError: (_stepId, error) => {
        if (error instanceof ProviderError && error.code === "missing_key") {
          setErrorMessage(error.message)
          onPhaseChange("idle")
        }
      },
    }

    coordinator.execute(ideaText, callbacks)
  }, [phase, idea, projectName, onPhaseChange, onStreamUpdate])

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

        {errorMessage && (
          <div className="flex items-start gap-2 p-2.5 rounded-md bg-red-50 border border-red-100">
            <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-600 leading-relaxed">{errorMessage}</p>
          </div>
        )}

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

      {/* Recent Ideas */}
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
