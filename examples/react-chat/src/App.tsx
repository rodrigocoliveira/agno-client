import { BrowserRouter, Routes, Route } from 'react-router'
import { AppLayout } from '@/layouts/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { ChatHubPage } from '@/pages/ChatHubPage'
import { ChatHooksPage } from '@/pages/ChatHooksPage'
import { ChatComponentsPage } from '@/pages/ChatComponentsPage'
import { SessionsPage } from '@/pages/SessionsPage'
import { MemoryPage } from '@/pages/MemoryPage'
import { KnowledgePage } from '@/pages/KnowledgePage'
import { MetricsPage } from '@/pages/MetricsPage'
import { EvalsPage } from '@/pages/EvalsPage'
import { TracesPage } from '@/pages/TracesPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatHubPage />} />
          <Route path="/chat/hooks" element={<ChatHooksPage />} />
          <Route path="/chat/components" element={<ChatComponentsPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/memory" element={<MemoryPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/metrics" element={<MetricsPage />} />
          <Route path="/evals" element={<EvalsPage />} />
          <Route path="/traces" element={<TracesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
