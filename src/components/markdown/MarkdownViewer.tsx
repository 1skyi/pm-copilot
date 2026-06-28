"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface MarkdownViewerProps {
  content: string
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-neutral-100">
        <h2 className="text-sm font-semibold text-neutral-900">Result</h2>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        <article className="prose prose-neutral prose-sm max-w-none
          prose-headings:font-semibold prose-headings:text-neutral-900 prose-headings:tracking-tight
          prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
          prose-p:text-neutral-600 prose-p:leading-relaxed
          prose-a:text-neutral-800 prose-a:underline prose-a:underline-offset-2
          prose-strong:text-neutral-800 prose-strong:font-semibold
          prose-code:text-neutral-700 prose-code:bg-neutral-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
          prose-pre:bg-neutral-900 prose-pre:text-neutral-100 prose-pre:text-xs
          prose-table:text-sm prose-th:font-medium prose-th:text-neutral-700 prose-td:text-neutral-600
          prose-blockquote:text-neutral-500 prose-blockquote:border-neutral-200
          prose-li:text-neutral-600
          prose-hr:border-neutral-100
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  )
}
