import { useState, useEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'
import Reports from './components/Reports'
import Customers from './components/customers/Customers'
import Products from './components/products/Products'
import PriceLists from './components/price-list/PriceLists'
import Orders from './components/orders/Orders'
import Payments from './components/payments/Payments'
import Layout from './components/Layout'
import { getCurrentUser } from './integrations/supabase/client'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await getCurrentUser()
        setIsAuthenticated(!!user)
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
    setCurrentPage('dashboard')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentPage('dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Router>
        <AuthPage onLogin={handleLogin} />
      </Router>
    )
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'customers':
        return <Customers />
      case 'products':
        return <Products />
      case 'price-lists':
        return <PriceLists />
      case 'orders':
        return <Orders />
      case 'payments':
        return <Payments />
      case 'reports':
        return <Reports />
      default:
        return <Dashboard />
    }
  }

  return (
    <Router>
      <Layout
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLogout={handleLogout}
      >
        {renderCurrentPage()}
      </Layout>
    </Router>
  )
}

export default App