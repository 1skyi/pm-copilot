"use client"
import { useState, useEffect } from "react"
import { Language, VersionV1 } from "@/types"
import { X, GitCompare, Loader2 } from "lucide-react"
import { coordinator } from "@/lib/ai/coordinator"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Props { vA: number; vB: number; language: Language; onClose: () => void; versions: VersionV1[] }

const T: Record<Language, Record<string, string>> = {
  en: { title:"Version Comparison", loading:"Analyzing product changes...", none:"Select two versions to compare", close:"Close" },
  zh: { title:"版本对比", loading:"正在分析产品变化...", none:"选择两个版本进行对比", close:"关闭" },
}

export function VersionCompare({ vA, vB, language, onClose, versions }: Props) {
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const t = T[language]
  useEffect(() => {
    let ok = true
    ;(async () => { setLoading(true); const r = await coordinator.compareVersions(vA, vB, language); if (ok) { setAnalysis(r); setLoading(false) } })()
    return () => { ok = false }
  }, [vA, vB, language])

  const va = versions.find((x) => x.versionNumber === vA)
  const vb = versions.find((x) => x.versionNumber === vB)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><GitCompare className="h-4 w-4 text-neutral-500" /><h2 className="text-sm font-semibold text-neutral-900">{t.title}</h2></div>
        <button onClick={onClose} className="p-1 rounded text-neutral-400 hover:text-neutral-600"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-mono text-neutral-600 border border-neutral-200 rounded px-2 py-1 bg-neutral-50">v{vA} · {va?.maturity ?? "—"} · {va?.score ?? "—"}</span>
        <span className="text-neutral-300 text-xs">vs</span>
        <span className="text-xs font-mono text-neutral-600 border border-neutral-200 rounded px-2 py-1 bg-neutral-50">v{vB} · {vb?.maturity ?? "—"} · {vb?.score ?? "—"}</span>
      </div>
      {loading && <div className="flex items-center gap-2 text-neutral-400 text-sm py-8"><Loader2 className="h-4 w-4 animate-spin" /><span>{t.loading}</span></div>}
      {!loading && analysis && <div className="prose prose-neutral max-w-none prose-p:text-neutral-600 prose-p:leading-relaxed prose-p:text-sm prose-strong:text-neutral-800 prose-li:text-neutral-600 prose-li:text-sm"><ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown></div>}
      {!loading && !analysis && <p className="text-sm text-neutral-400">{t.none}</p>}
    </div>
  )
}
