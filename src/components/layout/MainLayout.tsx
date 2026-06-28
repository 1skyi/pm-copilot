"use client"

import { ReactNode } from "react"

interface MainLayoutProps {
  sidebar: ReactNode
  workspace: ReactNode
  result: ReactNode
}

export function MainLayout({ sidebar, workspace, result }: MainLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-50">
      <aside className="w-[20%] min-w-[200px] max-w-[280px] flex-shrink-0 border-r border-neutral-200 bg-white">
        {sidebar}
      </aside>
      <main className="w-[30%] min-w-[300px] max-w-[420px] flex-shrink-0 border-r border-neutral-200 bg-white overflow-y-auto">
        {workspace}
      </main>
      <section className="flex-1 bg-white overflow-y-auto">
        {result}
      </section>
    </div>
  )
}
