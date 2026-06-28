import { MainLayout } from "@/components/layout/MainLayout"
import { Sidebar } from "@/components/layout/Sidebar"
import { Workspace } from "@/components/workspace/Workspace"
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer"
import { MOCK_MARKDOWN } from "@/constants"

export default function Home() {
  return (
    <MainLayout
      sidebar={<Sidebar />}
      workspace={<Workspace />}
      result={<MarkdownViewer content={MOCK_MARKDOWN} />}
    />
  )
}
