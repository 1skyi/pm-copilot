import { WorkflowStep, StreamedSection } from "@/types"
import { WorkflowEngine, WorkflowStepId } from "./workflow-engine"
import { PromptManager } from "./prompt-manager"
import { MarkdownBuilder } from "./markdown-builder"

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

  /**
   * Execute the full AI workflow for a given product idea.
   * Progress is reported via callbacks — UI stays decoupled.
   */
  async execute(idea: string, callbacks: CoordinatorCallbacks): Promise<void> {
    this.workflow.reset()
    this.builder.reset()
    this.aborted = false

    const stepIds = [...this.workflow.getStepIds()]

    for (const stepId of stepIds) {
      if (this.aborted) break

      // 1. Start step
      const step = this.workflow.startCurrentStep()
      if (!step) break

      callbacks.onStepStart(step, this.workflow.getSteps())

      try {
        // 2. Execute prompt (mock delay inside)
        const section = await this.prompts.execute(stepId, idea)

        if (this.aborted) break

        // 3. Build markdown
        this.builder.append(section)

        // 4. Complete step
        this.workflow.completeCurrentStep()
        callbacks.onStepComplete(step, section, this.builder.getSections())
      } catch (error) {
        this.workflow.markError(stepId)
        callbacks.onError(
          stepId,
          error instanceof Error ? error : new Error(String(error))
        )
        // Continue to next step even on error
        this.workflow.completeCurrentStep()
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

// Singleton — one brain for the entire app
export const coordinator = new Coordinator()
