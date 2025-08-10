import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  Filter,
  X,
  Trash2
} from 'lucide-react'
import {
  getPayments,
  getSalesmen,
  deletePayment
} from '../../integrations/supabase/client'
import { toast } from 'sonner'
import PaymentForm from './PaymentForm'

interface Payment {
  id: string
  amount_received: number
  payment_method: string
  payment_type: string
  status: string
  notes?: string
  transaction_reference?: string
  bank_name?: string
  cheque_date?: string
  created_at: string
  orders: {
    order_number: string
    total_amount: number
    customers: {
      name: string
    } | null
  }
  profiles?: {
    full_name: string
  }
}

interface Salesman {
  id: string
  full_name: string
  phone_number?: string
}

type ViewMode = 'list' | 'create'

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [salesmen, setSalesmen] = useState<Salesman[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    paymentMethod: '',
    status: '',
    salesmanId: '',
    startDate: '',
    endDate: ''
  })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const paymentMethods = ['cash', 'cheque', 'bank_transfer', 'mobile_money']
  const statuses = ['completed', 'pending', 'failed']

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const filterParams: any = {}

      if (filters.paymentMethod) filterParams.paymentMethod = filters.paymentMethod
      if (filters.status) filterParams.status = filters.status
      if (filters.salesmanId) filterParams.salesmanId = filters.salesmanId
      if (filters.startDate) filterParams.startDate = filters.startDate
      if (filters.endDate) filterParams.endDate = filters.endDate

      const { data, error } = await getPayments(filterParams)
      if (error) throw error
      setPayments(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchSalesmen = async () => {
    try {
      const { data, error } = await getSalesmen()
      if (error) throw error
      setSalesmen(data || [])
    } catch (err: any) {
      console.error('Failed to fetch salesmen:', err)
    }
  }

  const filterPayments = useCallback(() => {
    if (!searchTerm) {
      setFilteredPayments(payments)
      return
    }

    const filtered = payments.filter(payment =>
      payment.orders.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.orders.customers?.name && payment.orders.customers.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.profiles?.full_name && payment.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.transaction_reference && payment.transaction_reference.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredPayments(filtered)
  }, [payments, searchTerm])

  useEffect(() => {
    fetchPayments()
    fetchSalesmen()
  }, [filters])

  useEffect(() => {
    filterPayments()
  }, [filterPayments])

  const handleCreatePayment = () => {
    setViewMode('create')
  }

  const handleBackToList = () => {
    setViewMode('list')
    fetchPayments() // Refresh the list
    toast.success('Payment recorded successfully!')
  }

  const handleDeletePayment = async (paymentId: string) => {
    try {
      const { error } = await deletePayment(paymentId)
      if (error) throw error

      setPayments(payments.filter(p => p.id !== paymentId))
      toast.success('Payment deleted successfully')
      setDeleteConfirm(null)
    } catch (error: any) {
      console.error('Error deleting payment:', error)
      toast.error('Failed to delete payment')
      setDeleteConfirm(null)
    }
  }

  const confirmDelete = (paymentId: string) => {
    setDeleteConfirm(paymentId)
  }

  const cancelDelete = () => {
    setDeleteConfirm(null)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      paymentMethod: '',
      status: '',
      salesmanId: '',
      startDate: '',
      endDate: ''
    })
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <DollarSign className="w-4 h-4" />
      case 'cheque':
      case 'bank_transfer':
      case 'mobile_money':
        return <CreditCard className="w-4 h-4" />
      default:
        return <DollarSign className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const hasActiveFilters = filters.paymentMethod || filters.status || filters.salesmanId || filters.startDate || filters.endDate

  if (viewMode === 'create') {
    return (
      <PaymentForm
        onBack={handleBackToList}
      />
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600">Manage and track payment records</p>
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
              placeholder="Search by order, customer, or reference..."
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
              onClick={handleCreatePayment}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span>Record Payment</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Methods</option>
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>
                      {method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
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

        /* Payments List */
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || hasActiveFilters ? 'No payments found' : 'No payments yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || hasActiveFilters
                  ? 'Try adjusting your search terms or filters'
                  : 'Get started by recording your first payment'
                }
              </p>
              {!searchTerm && !hasActiveFilters && (
                <button
                  onClick={handleCreatePayment}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  <span>Record Payment</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Order & Customer</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Amount</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Payment Method</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Date</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Collected By</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-semibold text-blue-600">{payment.orders.order_number}</div>
                          <div className="text-sm text-gray-500">
                            {payment.orders.customers?.name || 'Unknown Customer'}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-900">
                              ₹{payment.amount_received.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            of ₹{payment.orders.total_amount.toFixed(2)}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="flex items-center space-x-2">
                            {getPaymentMethodIcon(payment.payment_method)}
                            <span className="text-gray-900">
                              {payment.payment_method?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                            </span>
                          </div>
                          {payment.transaction_reference && (
                            <div className="text-sm text-gray-500">
                              Ref: {payment.transaction_reference}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                          {payment.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : 'Unknown'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {payment.profiles?.full_name || 'Direct Payment'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => confirmDelete(payment.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                            title="Delete Payment"
                          >
                            <Trash2 className="w-4 h-4" />
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
      {!loading && filteredPayments.length > 0 && (
        <div className="mt-6 text-center text-gray-500">
          Showing {filteredPayments.length} of {payments.length} payments
        </div>
      )}



      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Payment</h3>
                <p className="text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this payment record? This will permanently remove it from your system.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-2xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePayment(deleteConfirm)}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-2xl hover:bg-red-700 transition-colors font-medium"
              >
                Delete Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}