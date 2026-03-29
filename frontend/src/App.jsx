import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SalesDataProvider } from './context/SalesDataContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import TrendsPage from './pages/TrendsPage'
import ForecastPage from './pages/ForecastPage'
import ReportsPage from './pages/ReportsPage'
import RecordsPage from './pages/RecordsPage'
import AIAssistantPage from './pages/AIAssistantPage'

const App = () => (
  <SalesDataProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="trends" element={<TrendsPage />} />
          <Route path="forecast" element={<ForecastPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="records" element={<RecordsPage />} />
          <Route path="ai" element={<AIAssistantPage />} />
          <Route path="dashboard" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </SalesDataProvider>
)

export default App
