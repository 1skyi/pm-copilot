"use client"

import { WorkflowStep, WorkflowStepStatus } from "@/types"
import { cn } from "@/lib/utils"
import { Check, Loader2, Clock, XCircle } from "lucide-react"

interface WorkflowPanelProps {
  steps: WorkflowStep[]
}

const statusConfig: Record<
  WorkflowStepStatus,
  { icon: React.ComponentType<{ className?: string }>; label: string; className: string }
> = {
  WAITING: {
    icon: Clock,
    label: "Waiting",
    className: "text-neutral-300 bg-neutral-50",
  },
  RUNNING: {
    icon: Loader2,
    label: "Running",
    className: "text-blue-500 bg-blue-50",
  },
  COMPLETED: {
    icon: Check,
    label: "Done",
    className: "text-emerald-600 bg-emerald-50",
  },
  ERROR: {
    icon: XCircle,
    label: "Error",
    className: "text-red-500 bg-red-50",
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

          return (
            <div key={step.id} className="relative flex items-start gap-3">
              {/* Connector line */}
              {!isLast && (
                <div className="absolute left-[11px] top-6 bottom-0 w-px bg-neutral-200" />
              )}

              {/* Status icon */}
              <div
                className={cn(
                  "relative z-10 mt-0.5 flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full",
                  config.className
                )}
              >
                <Icon
                  className={cn(
                    "h-3 w-3",
                    step.status === "RUNNING" && "animate-spin"
                  )}
                />
              </div>

              {/* Step info */}
              <div className="flex-1 pb-4">
                <p
                  className={cn(
                    "text-sm",
                    step.status === "COMPLETED"
                      ? "text-neutral-500"
                      : step.status === "RUNNING"
                        ? "text-neutral-900 font-medium"
                        : step.status === "ERROR"
                          ? "text-red-600"
                          : "text-neutral-400"
                  )}
                >
                  {step.name}
                </p>
                <span className="text-[10px] text-neutral-300">
                  {config.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
