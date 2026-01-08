import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CalculatorPage from './pages/CalculatorPage'
import RimsPage from './pages/RimsPage'
import HubsPage from './pages/HubsPage'
import BuildsPage from './pages/BuildsPage'
import BuildSheetPage from './pages/BuildSheetPage'
import UsersPage from './pages/UsersPage'
import HelpPage from './pages/HelpPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-scenic-900"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicHelpPage() {
  return (
    <div className="min-h-screen bg-scenic-50 dark:bg-scenic-900">
      <header className="bg-white border-b border-scenic-200 dark:bg-scenic-800 dark:border-scenic-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="Scenic Routes" className="h-10 w-10" />
              <div>
                <h1 className="text-lg font-bold text-scenic-900 dark:text-scenic-100">Spoke Calculator</h1>
                <p className="text-xs text-scenic-500 dark:text-scenic-400">Scenic Routes Community Bicycle Center</p>
              </div>
            </div>
            <a href="/login" className="btn btn-primary text-sm">Sign In</a>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HelpPage />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/help" element={<PublicHelpPage />} />
      <Route path="/build/:id/print" element={
        <ProtectedRoute>
          <BuildSheetPage />
        </ProtectedRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<CalculatorPage />} />
        <Route path="rims" element={<RimsPage />} />
        <Route path="hubs" element={<HubsPage />} />
        <Route path="builds" element={<BuildsPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
    </Routes>
  )
}
