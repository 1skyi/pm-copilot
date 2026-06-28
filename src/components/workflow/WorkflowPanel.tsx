"use client"

import { WorkflowStep, WorkflowStepStatus } from "@/types"
import { cn } from "@/lib/utils"
import { Check, Loader2, Circle, XCircle } from "lucide-react"

interface WorkflowPanelProps {
  steps: WorkflowStep[]
}

const statusConfig: Record<
  WorkflowStepStatus,
  { icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  PENDING: {
    icon: Circle,
    className: "text-neutral-300",
  },
  RUNNING: {
    icon: Loader2,
    className: "text-blue-500",
  },
  COMPLETED: {
    icon: Check,
    className: "text-emerald-500",
  },
  ERROR: {
    icon: XCircle,
    className: "text-red-500",
  },
}

export function WorkflowPanel({ steps }: WorkflowPanelProps) {
  return (
    <div className="px-5 py-4">
      <h3 className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-3">
        Workflow
      </h3>
      <div className="space-y-0">
        {steps.map((step, index) => {
          const config = statusConfig[step.status]
          const Icon = config.icon
          const isLast = index === steps.length - 1
          const isRunning = step.status === "RUNNING"
          const isCompleted = step.status === "COMPLETED"

          return (
            <div key={step.id} className="relative flex items-start gap-3">
              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-[11px] top-6 bottom-0 w-px",
                    isCompleted ? "bg-emerald-200" : "bg-neutral-200"
                  )}
                />
              )}

              {/* Status icon */}
              <div
                className={cn(
                  "relative z-10 mt-0.5 flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-white",
                  isCompleted && "bg-emerald-50",
                  isRunning && "bg-blue-50"
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5",
                    config.className,
                    isRunning && "animate-spin"
                  )}
                />
              </div>

              {/* Step info */}
              <div className="flex-1 pb-4 min-w-0">
                <p
                  className={cn(
                    "text-sm truncate",
                    isCompleted
                      ? "text-neutral-600"
                      : isRunning
                        ? "text-neutral-900 font-medium"
                        : step.status === "ERROR"
                          ? "text-red-600"
                          : "text-neutral-400"
                  )}
                >
                  {step.name}
                </p>
                {isRunning && step.runningText && (
                  <p className="text-[10px] text-blue-500 mt-0.5 animate-pulse">
                    {step.runningText}
                  </p>
                )}
                {!isRunning && (
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {isCompleted ? "Completed" : step.status === "ERROR" ? "Error" : "Pending"}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
