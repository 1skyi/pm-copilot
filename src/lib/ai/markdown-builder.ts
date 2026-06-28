import { StreamedSection } from "@/types"

export class MarkdownBuilder {
  private sections: StreamedSection[] = []

  reset(): void {
    this.sections = []
  }

  append(section: StreamedSection): void {
    this.sections.push(section)
  }

  getSections(): StreamedSection[] {
    return [...this.sections]
  }

  getFullContent(): string {
    return this.sections.map((s) => s.title + s.content).join("")
  }

  getSectionCount(): number {
    return this.sections.length
  }
}
