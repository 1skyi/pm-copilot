"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { WorkflowPanel } from "@/components/workflow/WorkflowPanel"
import { MOCK_WORKFLOW_DATA } from "@/constants"
import { WorkflowStep } from "@/types"

export function Workspace() {
  const [projectName, setProjectName] = useState("")
  const [idea, setIdea] = useState("")
  const [steps, setSteps] = useState<WorkflowStep[]>(MOCK_WORKFLOW_DATA)

  const handleGenerate = () => {
    // Placeholder — no AI logic yet
    console.log("Generate:", { projectName, idea })
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
            placeholder="Enter project name..."
            className="mt-1 h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            Idea
          </label>
          <Input
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe your product idea..."
            className="mt-1 h-8 text-sm"
          />
        </div>
        <Button
          onClick={handleGenerate}
          className="w-full h-8 text-sm gap-1.5"
          size="sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Generate
        </Button>
      </div>

      {/* Workflow */}
      <div className="flex-1 overflow-y-auto">
        <WorkflowPanel steps={steps} />
      </div>
    </div>
  )
}
