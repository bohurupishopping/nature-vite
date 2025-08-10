import { useState, useEffect } from 'react'
import { X, Search, DollarSign, Calendar, CreditCard, User } from 'lucide-react'
import {
  createPayment,
  getOrdersForPayment,
  getSalesmen
} from '../../integrations/supabase/client'
import { toast } from 'sonner'

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

const PaymentForm = ({ onSuccess, onCancel }: PaymentFormProps) => {
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [salesmen, setSalesmen] = useState<Salesman[]>([])
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
      fetchOrders(searchTerm)
    }
  }, [searchTerm])

  const fetchOrders = async (search?: string) => {
    try {
      const { data, error } = await getOrdersForPayment(search)
      if (error) throw error
      setOrders(data || [])
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
    
    if (!selectedOrderId) {
      toast.error('Please select an order')
      return
    }
    
    if (!amountReceived || parseFloat(amountReceived) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    if (paymentType === 'salesman_collected' && !collectedBy) {
      toast.error('Please select who collected the payment')
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
      toast.error('Failed to record payment: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  )

  const showConditionalFields = () => {
    return paymentMethod === 'cheque' || paymentMethod === 'bank_transfer'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Record Payment</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Payment Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentType"
                  value="direct"
                  checked={paymentType === 'direct'}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Direct Payment</div>
                  <div className="text-sm text-gray-500">Payment received directly</div>
                </div>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentType"
                  value="salesman_collected"
                  checked={paymentType === 'salesman_collected'}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Salesman Collected</div>
                  <div className="text-sm text-gray-500">Payment collected by salesman</div>
                </div>
              </label>
            </div>
          </div>

          {/* Order Selection */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Order *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by order number or customer name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowOrderDropdown(true)
                }}
                onFocus={() => setShowOrderDropdown(true)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            {/* Order Dropdown */}
            {showOrderDropdown && filteredOrders.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleOrderSelect(order)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
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
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {order.status?.replace('_', ' ') || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Order Info */}
          {selectedOrder && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Selected Order</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Order:</span> {selectedOrder.order_number}
                </div>
                <div>
                  <span className="text-blue-700">Customer:</span> {selectedOrder.customers?.name || 'Unknown Customer'}
                </div>
                <div>
                  <span className="text-blue-700">Total Amount:</span> ₹{selectedOrder.total_amount.toFixed(2)}
                </div>
                <div>
                  <span className="text-blue-700">Status:</span> {selectedOrder.status?.replace('_', ' ') || 'Unknown'}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount Received */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Received *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bank Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="date"
                      value={chequeDate}
                      onChange={(e) => setChequeDate(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transaction Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Reference
            </label>
            <input
              type="text"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter transaction reference (optional)"
            />
          </div>

          {/* Collected By (for salesman collected payments) */}
          {paymentType === 'salesman_collected' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collected By *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={collectedBy}
                  onChange={(e) => setCollectedBy(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any additional notes (optional)"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Recording...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  Add Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PaymentForm