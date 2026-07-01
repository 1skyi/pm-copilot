"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  FolderKanban,
  History,
  FileText,
  Settings,
  Sparkles,
  Moon,
  Sun,
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
  const pathname = usePathname()
  const activeId = pathname === "/" ? "projects" : pathname.replace("/", "")
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  const toggleTheme = () => {
    const h = document.documentElement
    if (h.classList.contains("dark")) {
      h.classList.remove("dark"); h.classList.add("light")
      localStorage.setItem("theme", "light"); setDark(false)
    } else {
      h.classList.remove("light"); h.classList.add("dark")
      localStorage.setItem("theme", "dark"); setDark(true)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-neutral-100 dark:border-neutral-800">
        <Sparkles className="h-5 w-5 text-black dark:text-white" />
        <span className="text-sm font-semibold tracking-tight text-black dark:text-white">
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
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                activeId === item.id
                  ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white font-medium"
                  : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-700 dark:hover:text-neutral-200"
              )}
            >
              {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 w-full text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
        >
          {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          <span>{dark ? "Light Mode" : "Dark Mode"}</span>
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-neutral-400" />
            <span className="text-xs text-neutral-500 dark:text-neutral-300">PM Copilot</span>
          </div>
          <p className="text-[10px] text-neutral-300 mt-0.5">v1.0</p>
        </div>
      </div>
    </div>
  )
}