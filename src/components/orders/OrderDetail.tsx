import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Edit,
  Package,
  User,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  FileText,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
  X
} from 'lucide-react'
import {
  getOrderById,
  updateOrderStatus,
  getOrderPayments
} from '../../integrations/supabase/client'

interface OrderDetail {
  id: string
  order_number: string
  total_amount: number
  discount_amount: number
  tax_amount: number
  shipping_costs: number
  status: string
  created_at: string
  order_notes: string | null
  order_type: string
  due_date: string | null
  is_fully_paid: boolean
  customers: {
    name: string
    type: string | null
    contact_person: string | null
    phone_number: string | null
    address: string | null
  } | null
  profiles: {
    full_name: string | null
  } | null
  order_items: {
    id: string
    quantity: number
    unit_price: number
    products: {
      name: string
      sku: string
      image_url: string | null
    } | null
  }[]
}

interface Payment {
  id: string
  amount_received: number
  status: string
  payment_method: string | null
  created_at: string
  notes: string | null
  profiles: {
    full_name: string | null
  } | null
}

interface OrderDetailProps {
  orderId: string
  onBack: () => void
  onEdit: () => void
}

const ORDER_STATUSES = [
  'Pending',
  'Processing',
  'Awaiting Payment',
  'Shipped',
  'Delivered',
  'Completed',
  'Cancelled'
]

export default function OrderDetail({ orderId, onBack, onEdit }: OrderDetailProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [showStatusUpdate, setShowStatusUpdate] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    fetchOrderDetails()
    fetchOrderPayments()
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const { data, error } = await getOrderById(orderId)
      if (error) throw error
      setOrder(data)
      setNewStatus(data?.status || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order details')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderPayments = async () => {
    try {
      const { data, error } = await getOrderPayments(orderId)
      if (error) throw error
      setPayments(data || [])
    } catch (err) {
      console.error('Failed to fetch payments:', err)
    }
  }

  const handleStatusUpdate = async () => {
    if (!order || newStatus === order.status) {
      setShowStatusUpdate(false)
      return
    }

    try {
      setUpdating(true)
      const { error } = await updateOrderStatus(orderId, newStatus)
      if (error) throw error

      setOrder({ ...order, status: newStatus })
      setShowStatusUpdate(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Processing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Awaiting Payment':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Delivered':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-4 h-4" />
      case 'Processing':
        return <Package className="w-4 h-4" />
      case 'Awaiting Payment':
        return <CreditCard className="w-4 h-4" />
      case 'Shipped':
        return <Truck className="w-4 h-4" />
      case 'Delivered':
      case 'Completed':
        return <CheckCircle className="w-4 h-4" />
      case 'Cancelled':
        return <X className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const calculateSubtotal = () => {
    if (!order) return 0
    return order.order_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  }

  const calculateTotalPaid = () => {
    return payments.reduce((sum, payment) => sum + payment.amount_received, 0)
  }

  const calculateBalance = () => {
    if (!order) return 0
    return order.total_amount - calculateTotalPaid()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Orders</span>
        </button>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Error Loading Order</h3>
              <p className="text-red-700">{error || 'Order not found'}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Orders</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order {order.order_number}</h1>
            <p className="text-gray-600">Created on {new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowStatusUpdate(true)}
              className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
            >
              {getStatusIcon(order.status)}
              <span>Update Status</span>
            </button>
            <button
              onClick={onEdit}
              className="flex items-center space-x-2 bg-gray-50 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Order Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span>{order.status}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ORDER_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowStatusUpdate(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={updating || newStatus === order.status}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Order Number</label>
                  <p className="text-gray-900 font-semibold">{order.order_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Order Type</label>
                  <p className="text-gray-900">{order.order_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span>{order.status}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created Date</label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {order.due_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Due Date</label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">{new Date(order.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Payment Status</label>
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${order.is_fully_paid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                    <CreditCard className="w-4 h-4" />
                    <span>{order.is_fully_paid ? 'Fully Paid' : 'Pending Payment'}</span>
                  </div>
                </div>
              </div>
            </div>
            {order.order_notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-500 mb-2">Order Notes</label>
                <div className="flex items-start space-x-2">
                  <FileText className="w-4 h-4 text-gray-400 mt-1" />
                  <p className="text-gray-900">{order.order_notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            {order.customers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Customer Name</label>
                    <p className="text-gray-900 font-semibold">{order.customers.name}</p>
                  </div>
                  {order.customers.contact_person && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Contact Person</label>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">{order.customers.contact_person}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {order.customers.phone_number && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">{order.customers.phone_number}</p>
                      </div>
                    </div>
                  )}
                  {order.customers.type && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Customer Type</label>
                      <p className="text-gray-900">{order.customers.type}</p>
                    </div>
                  )}
                </div>
                {order.customers.address && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                      <p className="text-gray-900">{order.customers.address}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Customer information not available</p>
            )}
          </div>

          {/* Salesman Information */}
          {order.profiles && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Salesman Information</h2>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <p className="text-gray-900">{order.profiles.full_name || 'Unknown'}</p>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Order Items</span>
            </h2>
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.products?.name || 'Unknown Product'}</h4>
                      <p className="text-sm text-gray-500">SKU: {item.products?.sku || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {item.quantity} × ₹{item.unit_price.toFixed(2)} = ₹{(item.quantity * item.unit_price).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Order Summary</span>
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">-₹{order.discount_amount.toFixed(2)}</span>
                </div>
              )}
              {order.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">₹{order.tax_amount.toFixed(2)}</span>
                </div>
              )}
              {order.shipping_costs > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">₹{order.shipping_costs.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-blue-600">₹{order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Payment Summary</span>
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">₹{order.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium text-green-600">₹{calculateTotalPaid().toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Balance:</span>
                  <span className={`${calculateBalance() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{calculateBalance().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">₹{payment.amount_received.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                        {payment.payment_method && (
                          <p className="text-xs text-blue-600">{payment.payment_method}</p>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${payment.status === 'Full' ? 'bg-green-100 text-green-800' :
                        payment.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        {payment.status}
                      </div>
                    </div>
                    {payment.notes && (
                      <p className="text-sm text-gray-600 mt-2">{payment.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}