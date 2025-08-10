import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Save,
  Search,
  DollarSign,
  Calendar,
  CreditCard,
  User,
  AlertCircle
} from 'lucide-react'
import {
  createPayment,
  getOrdersForPayment,
  getSalesmen
} from '../../integrations/supabase/client'

interface Order {
  id: string
  order_number: string
  total_amount: number
  status: string
  created_at: string
  customers: {
    name: string
    type: string
  } | null
}


interface Salesman {
  id: string
  full_name: string
  phone_number?: string
}

interface PaymentFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function PaymentForm({ onSuccess, onCancel }: PaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [salesmen, setSalesmen] = useState<Salesman[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showOrderDropdown, setShowOrderDropdown] = useState(false)

  // Form fields
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [paymentType, setPaymentType] = useState('direct') // 'direct' or 'salesman_collected'
  const [amountReceived, setAmountReceived] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [transactionReference, setTransactionReference] = useState('')
  const [bankName, setBankName] = useState('')
  const [chequeDate, setChequeDate] = useState('')
  const [collectedBy, setCollectedBy] = useState('')

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'mobile_money', label: 'Mobile Money' }
  ]

  useEffect(() => {
    fetchOrders()
    fetchSalesmen()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = orders.filter(order =>
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customers?.name && order.customers.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredOrders(filtered)
    } else {
      setFilteredOrders(orders)
    }
  }, [searchTerm, orders])

  const fetchOrders = async () => {
    try {
      const { data, error } = await getOrdersForPayment()
      if (error) throw error

      // Transform the response to match our Order interface
      const transformedOrders: Order[] = (data || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
        customers: order.customers
      }))

      setOrders(transformedOrders)
    } catch (err: any) {
      console.error('Failed to fetch orders:', err)
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

  const handleOrderSelect = (order: Order) => {
    setSelectedOrderId(order.id)
    setSelectedOrder(order)
    setSearchTerm(order.order_number)
    setShowOrderDropdown(false)

    // Set default amount to remaining balance
    setAmountReceived(order.total_amount.toString())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!selectedOrderId) {
      setError('Please select an order')
      return
    }

    if (!amountReceived || parseFloat(amountReceived) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (paymentType === 'salesman_collected' && !collectedBy) {
      setError('Please select who collected the payment')
      return
    }

    try {
      setLoading(true)

      const paymentData = {
        order_id: selectedOrderId,
        amount_received: parseFloat(amountReceived),
        payment_method: paymentMethod,
        payment_type: paymentType,
        notes: notes || undefined,
        transaction_reference: transactionReference || undefined,
        bank_name: bankName || undefined,
        cheque_date: chequeDate || undefined,
        collected_by: paymentType === 'salesman_collected' ? collectedBy : undefined,
        status: 'completed'
      }

      const { error } = await createPayment(paymentData)
      if (error) throw error

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  const showConditionalFields = () => {
    return paymentMethod === 'cheque' || paymentMethod === 'bank_transfer'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Record Payment</h2>
                <p className="text-gray-600">Add a new payment record</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Payment Type Selection */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="paymentType"
                  value="direct"
                  checked={paymentType === 'direct'}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-900">Direct Payment</div>
                  <div className="text-sm text-gray-500">Payment received directly</div>
                </div>
              </label>
              <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="paymentType"
                  value="salesman_collected"
                  checked={paymentType === 'salesman_collected'}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-900">Salesman Collected</div>
                  <div className="text-sm text-gray-500">Payment collected by salesman</div>
                </div>
              </label>
            </div>
          </div>

          {/* Order Selection */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search and Select Order *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by order number or customer name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setShowOrderDropdown(true)
                  }}
                  onFocus={() => setShowOrderDropdown(true)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Order Dropdown */}
              {showOrderDropdown && filteredOrders.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredOrders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => handleOrderSelect(order)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{order.order_number}</div>
                          <div className="text-sm text-gray-500">{order.customers?.name || 'Unknown Customer'}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">₹{order.total_amount.toFixed(2)}</div>
                          <div className={`text-xs px-2 py-1 rounded-full ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                            {order.status || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Order Info */}
            {selectedOrder && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Selected Order</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Order:</span> {selectedOrder.order_number}
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Customer:</span> {selectedOrder.customers?.name || 'Unknown Customer'}
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Total Amount:</span> ₹{selectedOrder.total_amount.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Status:</span> {selectedOrder.status || 'Unknown'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Amount Received */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Received *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    required
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Conditional Fields */}
            {showConditionalFields() && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Bank Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter bank name"
                  />
                </div>

                {/* Cheque Date */}
                {paymentMethod === 'cheque' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cheque Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="date"
                        value={chequeDate}
                        onChange={(e) => setChequeDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transaction Reference */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Reference
              </label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter transaction reference (optional)"
              />
            </div>

            {/* Collected By (for salesman collected payments) */}
            {paymentType === 'salesman_collected' && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collected By *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={collectedBy}
                    onChange={(e) => setCollectedBy(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    required
                  >
                    <option value="">Select salesman</option>
                    {salesmen.map(salesman => (
                      <option key={salesman.id} value={salesman.id}>
                        {salesman.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any additional notes (optional)"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedOrderId || !amountReceived}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? 'Recording...' : 'Record Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}