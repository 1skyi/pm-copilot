"use client"

import { VersionV1, Language } from "@/types"
import { cn } from "@/lib/utils"
import { CheckCircle2, Star, ChevronRight } from "lucide-react"

interface Props {
  versions: VersionV1[]
  viewingVn: number | null
  latestVn: number | null
  bestVn: number | null
  onSelectVersion: (vn: number) => void
  language: Language
}

const DOT: Record<string, string> = {
  "Idea": "bg-neutral-300", "Prototype": "bg-orange-400", "MVP Ready": "bg-emerald-400",
  "Market Ready": "bg-blue-400", "Investment Ready": "bg-purple-400",
}
const SHORT: Record<Language, Record<string, string>> = {
  en: { "Idea":"Idea","Prototype":"Proto","MVP Ready":"MVP","Market Ready":"Market","Investment Ready":"Invest" },
  zh: { "Idea":"概念","Prototype":"原型","MVP Ready":"MVP","Market Ready":"市场","Investment Ready":"投资" },
}

export function VersionTimeline({ versions, viewingVn, latestVn, bestVn, onSelectVersion, language }: Props) {
  return (
    <div className="px-5 py-3 border-t border-neutral-100">
      <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">
        {language === "zh" ? "版本历史" : "Version History"}
      </h3>
      <div className="space-y-0.5">
        {versions.map((v) => {
          const cur = v.versionNumber === viewingVn
          const lat = v.versionNumber === latestVn
          const bes = v.versionNumber === bestVn
          return (
            <button key={v.versionNumber} onClick={() => onSelectVersion(v.versionNumber)}
              className={cn("flex w-full items-center gap-2 px-2 py-1.5 rounded text-left transition-colors",
                cur ? "bg-neutral-100 border border-neutral-200" : "hover:bg-neutral-50 border border-transparent")}>
              <span className={cn("text-[10px] font-mono font-medium min-w-[24px]", cur ? "text-neutral-800" : "text-neutral-400")}>v{v.versionNumber}</span>
              <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", DOT[v.maturity] || "bg-neutral-300")} />
              <span className={cn("text-xs font-semibold min-w-[28px]", cur ? "text-neutral-800" : "text-neutral-600")}>{v.score}</span>
              <span className="text-[10px] text-neutral-400 flex-1 truncate">{SHORT[language][v.maturity] || v.maturity}</span>
              {v.p0Count > 0 ? <span className="text-[10px] text-red-400 min-w-[20px] text-right">P0×{v.p0Count}</span> : <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />}
              <span className="flex items-center gap-0.5 flex-shrink-0">
                {bes && <Star className="h-2.5 w-2.5 text-amber-400" />}
                {lat && !bes && <span className="text-[9px] text-blue-400 font-medium">NEW</span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
