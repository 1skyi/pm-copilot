"use client"
import { Language } from "@/types"
import { X, TrendingUp } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Props { insight: string; language: Language; onClose: () => void }

const T: Record<Language, Record<string, string>> = {
  en: { title:"Evolution Insight", subtitle:"Product growth across all versions" },
  zh: { title:"产品演进洞察", subtitle:"跨所有版本的产品成长" },
}

export function EvolutionInsight({ insight, language, onClose }: Props) {
  const t = T[language]
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5"><TrendingUp className="h-4 w-4 text-neutral-500" /><h2 className="text-sm font-semibold text-neutral-900">{t.title}</h2></div>
          <p className="text-[10px] text-neutral-400">{t.subtitle}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded text-neutral-400 hover:text-neutral-600"><X className="h-4 w-4" /></button>
      </div>
      <div className="prose prose-neutral max-w-none prose-p:text-neutral-600 prose-p:leading-relaxed prose-p:text-sm prose-strong:text-neutral-800 prose-li:text-neutral-600 prose-li:text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{insight}</ReactMarkdown>
      </div>
    </div>
  )
}
