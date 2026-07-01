/**
 * VersionManager — single source of truth for all product versions.
 *
 * Principles:
 * - Versions are immutable snapshots. Never mutated after creation.
 * - "Latest" = highest version number. "Best" = highest score (P0-count tiebreak).
 * - Quality gate prevents blind overwrite of better versions.
 * - Module-level singleton preserves state across React re-renders.
 */
import { VersionV1, QualityGateResult, EvolutionSnapshot, StreamedSection, ReviewJson, CoachOutput, Language, CompareResult } from "@/types"
import { getProvider, getConfig } from "./providers"

export class VersionManager {
  private versions: VersionV1[] = []
  private _viewing: number | null = null

  // ─── Creation ───

  createVersion(
    idea: string,
    sections: StreamedSection[],
    review: ReviewJson,
    coach: CoachOutput | null,
    parentVersionNumber: number | null,
  ): number {
    const vn = this.versions.length + 1
    const p0 = review.issues.filter((i) => i.priority === "P0").length
    const p1 = review.issues.filter((i) => i.priority === "P1").length

    // Deep-clone to guarantee immutability
    const v: VersionV1 = {
      versionNumber: vn,
      idea,
      sections: JSON.parse(JSON.stringify(sections)),
      review: JSON.parse(JSON.stringify(review)),
      coach: coach ? JSON.parse(JSON.stringify(coach)) : null,
      score: review.score,
      maturity: review.maturity,
      p0Count: p0,
      p1Count: p1,
      timestamp: new Date().toISOString(),
      parentVersionNumber,
    }

    this.versions.push(v)
    this._viewing = vn
    return vn
  }

  // ─── Queries ───

  getAll(): VersionV1[] { return [...this.versions] }

  get(vn: number): VersionV1 | undefined {
    return this.versions.find((x) => x.versionNumber === vn)
  }

  get viewing(): VersionV1 | undefined {
    return this._viewing ? this.get(this._viewing) : undefined
  }
  get viewingNumber(): number | null { return this._viewing }

  get latest(): VersionV1 | undefined {
    return this.versions.length ? this.versions[this.versions.length - 1] : undefined
  }
  get latestNumber(): number | null {
    return this.versions.length ? this.versions[this.versions.length - 1].versionNumber : null
  }

  /** Best = argmax(score); tiebreak = min(p0Count); tiebreak = latest. */
  getBestVersionNumber(): number | null {
    if (!this.versions.length) return null
    let best = this.versions[0]
    for (const v of this.versions) {
      if (v.score > best.score) { best = v; continue }
      if (v.score === best.score) {
        if (v.p0Count < best.p0Count) { best = v; continue }
        if (v.p0Count === best.p0Count && v.versionNumber > best.versionNumber) best = v
      }
    }
    return best.versionNumber
  }

  getBest(): VersionV1 | undefined {
    const n = this.getBestVersionNumber()
    return n ? this.get(n) : undefined
  }

  get count(): number { return this.versions.length }

  // ─── Viewing ───

  setViewing(vn: number): void { this._viewing = vn }
  viewLatest(): void { if (this.latestNumber) this._viewing = this.latestNumber }
  viewBest(): void { const n = this.getBestVersionNumber(); if (n) this._viewing = n }

  // ─── Quality Gate ───

  checkQualityGate(newVn: number): QualityGateResult {
    const nv = this.get(newVn)
    if (!nv) return { passed: true, bestVersionNumber: 0, bestScore: 0, newScore: 0, message: "" }
    const best = this.getBest()
    if (!best || best.versionNumber === newVn) {
      return { passed: true, bestVersionNumber: newVn, bestScore: nv.score, newScore: nv.score,
        message: "Initial version — accepted." }
    }
    const passed = nv.score >= best.score
    return {
      passed,
      bestVersionNumber: best.versionNumber,
      bestScore: best.score,
      newScore: nv.score,
      message: passed
        ? `Score ${nv.score} ≥ best (v${best.versionNumber}, ${best.score}). Accepted.`
        : `Score ${nv.score} < best (v${best.versionNumber}, ${best.score}). Recommend keeping best version.`,
    }
  }

  discardVersion(vn: number): void {
    const idx = this.versions.findIndex((x) => x.versionNumber === vn)
    if (idx < 0) return
    this.versions.splice(idx, 1)
    if (this._viewing === vn) this.viewBest()
  }

  // ─── Evolution ───

  getEvolutionSnapshots(): EvolutionSnapshot[] {
    return this.versions.map((v) => ({
      versionNumber: v.versionNumber, score: v.score, maturity: v.maturity,
      p0Count: v.p0Count, p1Count: v.p1Count, timestamp: v.timestamp,
    }))
  }

  // ─── Compare (AI) ───

  async compareVersions(vA: number, vB: number, language: Language): Promise<CompareResult> {
    const va = this.get(vA); const vb = this.get(vB)
    if (!va || !vb) return { versionA: vA, versionB: vB, analysis: "Version not found." }

    const provider = getProvider()
    const cfg = getConfig()
    const sys = language === "zh"
      ? "你是产品分析师。比较两个产品版本，输出3-5句话的产品级变化分析。聚焦：目标用户变化、MVP范围变化、商业模式变化、差异化变化、风险变化。每句以 ✓ 开头。禁止代码Diff。"
      : "You are a product analyst. Compare two product versions. Output 3-5 sentences of product-level change analysis. Focus: user targeting, MVP scope, business model, differentiation, risk. Start each sentence with ✓. No code diffs."

    const aText = this._versionText(va).slice(0, 3000)
    const bText = this._versionText(vb).slice(0, 3000)
    const prompt = language === "zh"
      ? `v${vA}:\n${aText}\n\nv${vB}:\n${bText}`
      : `v${vA}:\n${aText}\n\nv${vB}:\n${bText}`

    try {
      const analysis = await provider.generate(sys, prompt, cfg)
      return { versionA: vA, versionB: vB, analysis }
    } catch {
      return { versionA: vA, versionB: vB,
        analysis: language === "zh" ? "无法生成对比。" : "Comparison failed." }
    }
  }

  // ─── Evolution Insight (AI) ───

  async generateEvolutionInsight(language: Language): Promise<string> {
    if (this.versions.length < 2) {
      return language === "zh" ? "需要至少两个版本。" : "Need at least 2 versions."
    }
    const first = this.versions[0]
    const last = this.versions[this.versions.length - 1]
    const provider = getProvider()
    const cfg = getConfig()
    const sys = language === "zh"
      ? "你是产品进化分析师。对比第一版和最新版，总结产品成长。3-6个要点，每个✓开头，不超过1句话。聚焦：用户定位是否更精准、商业模式是否建立、MVP是否更聚焦、风险是否下降、差异化是否增强。"
      : "You are a product evolution analyst. Compare v1 and latest. Output 3-6 bullets starting with ✓. 1 sentence each. Focus: user targeting precision, business model maturity, MVP focus, risk reduction, differentiation strength."

    const prompt = language === "zh"
      ? `v1:\n${this._versionText(first).slice(0, 2000)}\n\nv${last.versionNumber}:\n${this._versionText(last).slice(0, 2000)}`
      : `v1:\n${this._versionText(first).slice(0, 2000)}\n\nv${last.versionNumber}:\n${this._versionText(last).slice(0, 2000)}`

    try { return await provider.generate(sys, prompt, cfg) }
    catch { return language === "zh" ? "无法生成进化洞察。" : "Evolution insight failed." }
  }

  // ─── Reset ───

  reset(): void { this.versions = []; this._viewing = null }

  // ─── Helpers ───

  private _versionText(v: VersionV1): string {
    const labels: Record<string, string> = {
      clarification: "Clarification", requirement: "Requirement",
      "product-design": "Product Design", flow: "Flow", database: "Database",
      api: "API", test: "Test", "dev-prompt": "Dev Prompt", "ai-review": "AI Review",
    }
    return v.sections.map((s) => `### ${labels[s.stepId] || s.stepId}\n${s.content.slice(0, 400)}`).join("\n\n")
  }
}

export const versionManager = new VersionManager()
