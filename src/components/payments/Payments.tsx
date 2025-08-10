import { useState, useEffect } from 'react'
import { Plus, Filter, Search, DollarSign, Calendar, User, CreditCard } from 'lucide-react'
import {
  getPayments,
  getSalesmen,
  getOrdersForPayment
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

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [salesmen, setSalesmen] = useState<Salesman[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  
  // Filter states
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [salesmanFilter, setSalesmanFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const paymentMethods = ['cash', 'cheque', 'bank_transfer', 'mobile_money']
  const statuses = ['completed', 'pending', 'failed']

  useEffect(() => {
    fetchPayments()
    fetchSalesmen()
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [paymentMethodFilter, statusFilter, salesmanFilter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const filters: any = {}
      
      if (paymentMethodFilter) filters.paymentMethod = paymentMethodFilter
      if (statusFilter) filters.status = statusFilter
      if (salesmanFilter) filters.salesmanId = salesmanFilter
      
      const { data, error } = await getPayments(filters)
      if (error) throw error
      setPayments(data || [])
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to fetch payments: ' + err.message)
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

  const handlePaymentSuccess = () => {
    fetchPayments()
    setShowPaymentForm(false)
    toast.success('Payment recorded successfully!')
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
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredPayments = payments.filter(payment =>
    payment.orders.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.orders.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    payment.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={fetchPayments}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Manage and track payment records</p>
        </div>
        <button
          onClick={() => setShowPaymentForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search orders, customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Payment Method Filter */}
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Payment Methods</option>
            {paymentMethods.map(method => (
              <option key={method} value={method}>
                {method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          {/* Salesman Filter */}
          <select
            value={salesmanFilter}
            onChange={(e) => setSalesmanFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Salesmen</option>
            {salesmen.map(salesman => (
              <option key={salesman.id} value={salesman.id}>
                {salesman.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order & Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collected By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || paymentMethodFilter || statusFilter || salesmanFilter
                      ? 'No payments found matching your filters.'
                      : 'No payments recorded yet.'}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.orders.order_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.orders.customers?.name || 'Unknown Customer'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{payment.amount_received.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        of ₹{payment.orders.total_amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(payment.payment_method)}
                        <span className="text-sm text-gray-900">
                          {payment.payment_method?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                        </span>
                      </div>
                      {payment.transaction_reference && (
                        <div className="text-xs text-gray-500">
                          Ref: {payment.transaction_reference}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getStatusColor(payment.status)
                      }`}>
                        {payment.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.profiles?.full_name || 'Direct Payment'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <PaymentForm
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentForm(false)}
        />
      )}
    </div>
  )
}

export default Payments