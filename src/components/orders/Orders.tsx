import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  Edit,
  Eye,
  ShoppingCart,
  User,
  Calendar,
  DollarSign,
  Filter,
  X
} from 'lucide-react'
import { getOrders, getSalesmen } from '../../integrations/supabase/client'
import OrderForm from './OrderForm'
import OrderDetail from './OrderDetail'

interface Order {
  id: string
  order_number: string
  total_amount: number
  status: string
  created_at: string
  order_notes: string | null
  customers: {
    name: string
    type: string | null
    contact_person: string | null
    phone_number: string | null
  } | null
  profiles: {
    full_name: string | null
  } | null
}

interface Salesman {
  id: string
  full_name: string | null
  phone_number: string | null
}

type ViewMode = 'list' | 'create' | 'edit' | 'detail'

const ORDER_STATUSES = [
  'Pending',
  'Processing',
  'Awaiting Payment',
  'Shipped',
  'Delivered',
  'Completed',
  'Cancelled'
]

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [salesmen, setSalesmen] = useState<Salesman[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    salesmanId: '',
    startDate: '',
    endDate: ''
  })

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await getOrders(filters.status || filters.salesmanId || filters.startDate || filters.endDate ? filters : undefined)
      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchSalesmen = async () => {
    try {
      const { data, error } = await getSalesmen()
      if (error) throw error
      setSalesmen(data || [])
    } catch (err) {
      console.error('Failed to fetch salesmen:', err)
    }
  }

  const filterOrders = useCallback(() => {
    if (!searchTerm) {
      setFilteredOrders(orders)
      return
    }

    const filtered = orders.filter(order =>
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customers?.name && order.customers.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.profiles?.full_name && order.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredOrders(filtered)
  }, [orders, searchTerm])

  useEffect(() => {
    fetchOrders()
    fetchSalesmen()
  }, [filters])

  useEffect(() => {
    filterOrders()
  }, [filterOrders])

  const handleCreateOrder = () => {
    setSelectedOrder(null)
    setViewMode('create')
  }

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order)
    setViewMode('edit')
  }

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setViewMode('detail')
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedOrder(null)
    fetchOrders() // Refresh the list
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      salesmanId: '',
      startDate: '',
      endDate: ''
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Processing':
        return 'bg-blue-100 text-blue-800'
      case 'Awaiting Payment':
        return 'bg-orange-100 text-orange-800'
      case 'Shipped':
        return 'bg-purple-100 text-purple-800'
      case 'Delivered':
        return 'bg-indigo-100 text-indigo-800'
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const hasActiveFilters = filters.status || filters.salesmanId || filters.startDate || filters.endDate

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <OrderForm
        order={selectedOrder}
        onBack={handleBackToList}
        isEdit={viewMode === 'edit'}
      />
    )
  }

  if (viewMode === 'detail' && selectedOrder) {
    return (
      <OrderDetail
        orderId={selectedOrder.id}
        onBack={handleBackToList}
        onEdit={() => handleEditOrder(selectedOrder)}
      />
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600">Manage your order transactions</p>
          </div>
        </div>
      </div>

      {/* Search, Filters and Actions */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search orders by number, customer, or salesman..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-2xl border transition-all duration-200 ${hasActiveFilters
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </button>
            <button
              onClick={handleCreateOrder}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span>Create Order</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  {ORDER_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salesman</label>
                <select
                  value={filters.salesmanId}
                  onChange={(e) => handleFilterChange('salesmanId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Salesmen</option>
                  {salesmen.map(salesman => (
                    <option key={salesman.id} value={salesman.id}>
                      {salesman.full_name || 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        /* Orders List */
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || hasActiveFilters ? 'No orders found' : 'No orders yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || hasActiveFilters
                  ? 'Try adjusting your search terms or filters'
                  : 'Get started by creating your first order'
                }
              </p>
              {!searchTerm && !hasActiveFilters && (
                <button
                  onClick={handleCreateOrder}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Order</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Order #</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Customer</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Salesman</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Amount</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Date</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-blue-600">{order.order_number}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {order.customers?.name || 'Unknown Customer'}
                          </div>
                          {order.customers?.contact_person && (
                            <div className="text-sm text-gray-500">
                              {order.customers.contact_person}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {order.profiles?.full_name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-900">
                            ₹{order.total_amount.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                            title="Edit Order"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {!loading && filteredOrders.length > 0 && (
        <div className="mt-6 text-center text-gray-500">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      )}
    </div>
  )
}