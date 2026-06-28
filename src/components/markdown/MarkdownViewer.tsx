"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { Sparkles, Copy, Download, Check, FileText, Layers, Database, CheckCircle, Loader2 } from "lucide-react"
import { GeneratePhase, StreamedSection, Language } from "@/types"
import { WorkflowStepId } from "@/lib/ai/workflow-engine"
import { EMPTY_STATE_FEATURES } from "@/constants"

interface MarkdownViewerProps {
  sections: StreamedSection[]
  phase: GeneratePhase
  streamingContent: Record<string, string>
  activeStreamingStep: WorkflowStepId | null
  language: Language
}

const featureIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Layers,
  Database,
  CheckCircle,
}

const SECTION_TITLES: Record<WorkflowStepId, Record<Language, string>> = {
  clarification: { en: "## Clarification\n\n", zh: "## 需求澄清\n\n" },
  requirement: { en: "## Requirements\n\n", zh: "## 需求文档\n\n" },
  "product-design": { en: "## Product Design\n\n", zh: "## 产品设计\n\n" },
  flow: { en: "## User Flows\n\n", zh: "## 用户流程\n\n" },
  database: { en: "## Database Schema\n\n", zh: "## 数据库设计\n\n" },
  api: { en: "## API Design\n\n", zh: "## API设计\n\n" },
  test: { en: "## Test Plan\n\n", zh: "## 测试计划\n\n" },
  "dev-prompt": { en: "## Development Prompt\n\n", zh: "## 开发指南\n\n" },
  "ai-review": { en: "## AI Review\n\n", zh: "## AI审查\n\n" },
}

const UI: Record<Language, Record<string, string>> = {
  en: {
    title: "Result",
    generating: "Generating...",
    copy: "Copy",
    copied: "Copied",
    export: "Export",
    thinking: "AI is thinking...",
    emptyTitle: "PM Copilot",
    emptyDesc: "Describe your product idea, and AI will automatically generate structured documents for you.",
  },
  zh: {
    title: "生成结果",
    generating: "生成中...",
    copy: "复制",
    copied: "已复制",
    export: "导出",
    thinking: "AI 正在思考...",
    emptyTitle: "PM Copilot",
    emptyDesc: "描述你的产品想法，AI 将自动生成结构化文档。",
  },
}

const EMPTY_FEATURES_ZH = [
  { icon: "FileText", label: "需求文档", desc: "结构化产品需求" },
  { icon: "Layers", label: "产品设计", desc: "完整产品设计文档" },
  { icon: "Database", label: "技术设计", desc: "数据库与 API 架构" },
  { icon: "CheckCircle", label: "AI 审查", desc: "AI 驱动的质量评估" },
]

function EmptyState({ language }: { language: Language }) {
  const t = UI[language]
  const features = language === "zh" ? EMPTY_FEATURES_ZH : EMPTY_STATE_FEATURES

  return (
    <div className="flex h-full flex-col items-center justify-center px-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-6 w-6 text-neutral-800" />
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
          {t.emptyTitle}
        </h1>
      </div>

      <p className="text-sm text-neutral-500 text-center mb-8 max-w-xs leading-relaxed">
        {t.emptyDesc}
      </p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {features.map((feat) => {
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

export function MarkdownViewer({
  sections,
  phase,
  streamingContent,
  activeStreamingStep,
  language,
}: MarkdownViewerProps) {
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Build full content: completed sections + active streaming section
  const completedContent = sections
    .map((s) => s.title + s.content)
    .join("")

  let streamingBlock = ""
  if (activeStreamingStep && streamingContent[activeStreamingStep]) {
    const title = SECTION_TITLES[activeStreamingStep]?.[language] ?? `## ${activeStreamingStep}\n\n`
    streamingBlock = title + streamingContent[activeStreamingStep]
  }

  const fullContent = completedContent + streamingBlock

  // Auto-scroll during generation
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [fullContent])

  const handleCopy = useCallback(async () => {
    const copyText = sections.map((s) => s.title + s.content).join("")
    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }, [sections])

  const handleExport = useCallback(() => {
    const exportText = sections.map((s) => s.title + s.content).join("")
    const blob = new Blob([exportText], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "pm-copilot-output.md"
    a.click()
    URL.revokeObjectURL(url)
  }, [sections])

  const t = UI[language]

  if (phase === "idle") {
    return <EmptyState language={language} />
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-neutral-900">{t.title}</h2>
          {phase === "generating" && (
            <span className="flex items-center gap-1 text-[10px] text-blue-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              {t.generating}
            </span>
          )}
        </div>

        {sections.length > 0 && (
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
              {copied ? t.copied : t.copy}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              <Download className="h-3 w-3" />
              {t.export}
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
            prose-p:text-neutral-600 prose-p:leading-relaxed prose-p:text-base
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

          {/* Blinking cursor during active streaming */}
          {activeStreamingStep && (
            <span className="inline-block w-1.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle" />
          )}

          {/* Placeholder when generating but no content yet */}
          {phase === "generating" && !fullContent && (
            <div className="flex items-center gap-2 text-neutral-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t.thinking}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
