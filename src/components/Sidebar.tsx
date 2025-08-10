import React from 'react'
import {
  Home,
  FileText,
  LogOut,
  Building2,
  ChevronLeft,
  ChevronRight,
  Users,
  Package,
  IndianRupee,
  ShoppingCart
} from 'lucide-react'
import { signOut } from '../integrations/supabase/client'

interface SidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
  onLogout: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export default function Sidebar({
  currentPage,
  onPageChange,
  onLogout,
  isCollapsed,
  onToggleCollapse
}: SidebarProps) {
  const handleLogout = async () => {
    await signOut()
    onLogout()
  }

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'products', name: 'Products', icon: Package },
    { id: 'price-lists', name: 'Price Lists', icon: IndianRupee },
    { id: 'orders', name: 'Orders', icon: ShoppingCart },
    { id: 'reports', name: 'Reports', icon: FileText }
  ]

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${isCollapsed ? 'w-20' : 'w-64'
      }`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Nature</h1>
                <p className="text-xs text-gray-500 font-medium">Manager</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl font-medium transition-all duration-200 ${isActive
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
              {!isCollapsed && <span>{item.name}</span>}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )
}