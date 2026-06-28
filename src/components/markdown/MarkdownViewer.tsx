"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { Sparkles, Copy, Download, Check, FileText, Layers, Database, CheckCircle } from "lucide-react"
import { GeneratePhase, StreamedSection } from "@/types"
import { EMPTY_STATE_FEATURES } from "@/constants"

interface MarkdownViewerProps {
  sections: StreamedSection[]
  phase: GeneratePhase
}

const featureIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Layers,
  Database,
  CheckCircle,
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-6 w-6 text-neutral-800" />
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
          PM Copilot
        </h1>
      </div>

      <p className="text-sm text-neutral-500 text-center mb-8 max-w-xs leading-relaxed">
        Describe your product idea, and AI will automatically generate structured documents for you.
      </p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {EMPTY_STATE_FEATURES.map((feat) => {
          const Icon = featureIconMap[feat.icon]
          return (
            <div
              key={feat.label}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-neutral-100 bg-neutral-50/50"
            >
              {Icon && <Icon className="h-5 w-5 text-neutral-500" />}
              <span className="text-xs font-medium text-neutral-700">
                {feat.label}
              </span>
              <span className="text-[10px] text-neutral-400 text-center leading-tight">
                {feat.desc}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function MarkdownViewer({ sections, phase }: MarkdownViewerProps) {
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fullContent = sections
    .map((s) => s.title + s.content)
    .join("")

  // Auto-scroll to bottom when new content streams in
  useEffect(() => {
    if (scrollRef.current && phase === "generating") {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [fullContent, phase])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }, [fullContent])

  const handleExport = useCallback(() => {
    const blob = new Blob([fullContent], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "pm-copilot-output.md"
    a.click()
    URL.revokeObjectURL(url)
  }, [fullContent])

  if (phase === "idle") {
    return <EmptyState />
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-neutral-900">Result</h2>
          {phase === "generating" && (
            <span className="flex items-center gap-1 text-[10px] text-blue-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              Generating...
            </span>
          )}
        </div>

        {fullContent && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              <Download className="h-3 w-3" />
              Export
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="px-6 py-5">
          <article className="prose prose-neutral max-w-none
            prose-headings:font-semibold prose-headings:text-neutral-900 prose-headings:tracking-tight
            prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
            prose-p:text-neutral-600 prose-p:leading-relaxed
            prose-p:text-base
            prose-a:text-neutral-800 prose-a:underline prose-a:underline-offset-2
            prose-strong:text-neutral-800 prose-strong:font-semibold
            prose-code:text-neutral-700 prose-code:bg-neutral-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
            prose-pre:bg-neutral-900 prose-pre:text-neutral-100 prose-pre:text-xs
            prose-table:text-sm prose-th:font-medium prose-th:text-neutral-700 prose-td:text-neutral-600
            prose-blockquote:text-neutral-500 prose-blockquote:border-neutral-200
            prose-li:text-neutral-600 prose-li:text-base
            prose-hr:border-neutral-100
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {fullContent}
            </ReactMarkdown>
          </article>

          {phase === "generating" && (
            <span className="inline-block w-1.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      </div>
    </div>
  )
}
