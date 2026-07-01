"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import { FileText } from "lucide-react"

export default function TemplatesPage() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-50">
      <aside className="w-[20%] min-w-[200px] max-w-[280px] flex-shrink-0 border-r border-neutral-200 bg-white">
        <Sidebar />
      </aside>
      <main className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center space-y-3">
          <FileText className="h-8 w-8 text-neutral-300 mx-auto" />
          <h2 className="text-sm font-semibold text-neutral-400">Templates</h2>
          <p className="text-xs text-neutral-300">Coming soon</p>
        </div>
      </main>
    </div>
  )
}