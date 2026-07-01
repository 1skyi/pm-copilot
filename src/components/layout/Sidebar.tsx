"use client"

import { useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  FolderKanban,
  History,
  FileText,
  Settings,
  Sparkles,
} from "lucide-react"
import { MENU_ITEMS } from "@/constants"
import { cn } from "@/lib/utils"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FolderKanban,
  History,
  FileText,
  Settings,
}

export function Sidebar() {
  const [activeId, setActiveId] = useState("projects")

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-neutral-100">
        <Sparkles className="h-5 w-5 text-neutral-800" />
        <span className="text-sm font-semibold tracking-tight text-neutral-900">
          PM Copilot
        </span>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {MENU_ITEMS.map((item) => {
          const Icon = iconMap[item.icon]
          return (
            <Link
              key={item.id}
              href={item.id === "projects" ? "/" : `/${item.id}`}
              onClick={() => setActiveId(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                activeId === item.id
                  ? "bg-neutral-100 text-neutral-900 font-medium"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
              )}
            >
              {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-neutral-100">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-neutral-400" />
          <span className="text-xs text-neutral-400">PM Copilot</span>
        </div>
        <p className="text-[10px] text-neutral-300 mt-0.5">v1.0</p>
      </div>
    </div>
  )
}
