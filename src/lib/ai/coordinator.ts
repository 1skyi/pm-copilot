import { WorkflowStep, StreamedSection } from "@/types"
import { WorkflowEngine, WorkflowStepId } from "./workflow-engine"
import { PromptManager } from "./prompt-manager"
import { MarkdownBuilder } from "./markdown-builder"
import { ProviderError } from "./provider"

export interface CoordinatorCallbacks {
  onStepStart: (step: WorkflowStep, steps: WorkflowStep[]) => void
  onStepComplete: (step: WorkflowStep, section: StreamedSection, allSections: StreamedSection[]) => void
  onComplete: (allSections: StreamedSection[]) => void
  onError: (stepId: WorkflowStepId, error: Error) => void
}

export class Coordinator {
  private workflow: WorkflowEngine
  private prompts: PromptManager
  private builder: MarkdownBuilder
  private aborted = false

  constructor() {
    this.workflow = new WorkflowEngine()
    this.prompts = new PromptManager()
    this.builder = new MarkdownBuilder()
  }

  async execute(idea: string, callbacks: CoordinatorCallbacks): Promise<void> {
    this.workflow.reset()
    this.builder.reset()
    this.aborted = false

    const stepIds = [...this.workflow.getStepIds()]

    for (const stepId of stepIds) {
      if (this.aborted) break

      const step = this.workflow.startCurrentStep()
      if (!step) break

      callbacks.onStepStart(step, this.workflow.getSteps())

      try {
        const section = await this.prompts.execute(stepId, idea)

        if (this.aborted) break

        this.builder.append(section)
        this.workflow.completeCurrentStep()
        callbacks.onStepComplete(step, section, this.builder.getSections())
      } catch (error) {
        this.workflow.markError(stepId)
        callbacks.onError(
          stepId,
          error instanceof Error ? error : new Error(String(error))
        )

        // Fatal errors — stop the workflow
        if (error instanceof ProviderError && error.code === "missing_key") {
          this.aborted = true
          break
        }

        // Non-fatal errors — skip to next step without overwriting ERROR status
        this.workflow.skipCurrentStep()
      }
    }

    if (!this.aborted) {
      callbacks.onComplete(this.builder.getSections())
    }
  }

  abort(): void {
    this.aborted = true
  }
}

export const coordinator = new Coordinator()
