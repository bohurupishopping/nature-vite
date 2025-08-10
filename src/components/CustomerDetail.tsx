import React, { useState, useEffect, useCallback } from 'react'
import { 
  ArrowLeft, 
  Edit, 
  User, 
  Phone, 
  MapPin, 
  Building, 
  CreditCard,
  ShoppingCart,
  DollarSign,
  Package,
  AlertCircle
} from 'lucide-react'
import { getCustomerById, getCustomerOrders, getCustomerPayments } from '../integrations/supabase/client'

interface Customer {
  id: string
  name: string
  type: string | null
  contact_person: string | null
  phone_number: string | null
  address: string | null
  street_address: string | null
  village_or_city: string | null
  district: string | null
  price_list_id: string | null
  created_at: string
}

interface Order {
  id: string
  order_date: string
  total_amount: number
  status: string
  items_count?: number
}

interface Payment {
  id: string
  payment_date: string
  amount: number
  payment_method: string
  reference_number?: string
}

interface CustomerDetailProps {
  customerId: string
  onBack: () => void
  onEdit: (customer: Customer) => void
}

export default function CustomerDetail({ customerId, onBack, onEdit }: CustomerDetailProps) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'payments'>('info')

  useEffect(() => {
    fetchCustomerData()
  }, [customerId, fetchCustomerData])

  const fetchCustomerData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch customer details
      const { data: customerData, error: customerError } = await getCustomerById(customerId)
      if (customerError) throw customerError
      setCustomer(customerData)

      // Fetch customer orders
      const { data: ordersData, error: ordersError } = await getCustomerOrders(customerId)
      if (ordersError) throw ordersError
      setOrders(ordersData || [])

      // Fetch customer payments
      const { data: paymentsData, error: paymentsError } = await getCustomerPayments(customerId)
      if (paymentsError) throw paymentsError
      setPayments(paymentsData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customer data')
    } finally {
      setLoading(false)
    }
  }, [customerId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const totalOrderAmount = orders.reduce((sum, order) => sum + order.total_amount, 0)
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const outstandingBalance = totalOrderAmount - totalPayments

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Customer</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={onBack}
              className="bg-red-600 text-white px-6 py-3 rounded-2xl hover:bg-red-700 transition-colors"
            >
              Back to Customers
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Customer Not Found</h2>
            <p className="text-gray-600 mb-4">The requested customer could not be found.</p>
            <button
              onClick={onBack}
              className="bg-purple-600 text-white px-6 py-3 rounded-2xl hover:bg-purple-700 transition-colors"
            >
              Back to Customers
            </button>
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
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Customers</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
              <p className="text-gray-600">
                {customer.type && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    customer.type === 'Credit' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    <CreditCard className="w-4 h-4 mr-1" />
                    {customer.type} Customer
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => onEdit(customer)}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Edit className="w-5 h-5" />
            <span>Edit Customer</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPayments)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              outstandingBalance > 0 ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <CreditCard className={`w-6 h-6 ${
                outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Outstanding Balance</p>
              <p className={`text-2xl font-bold ${
                outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatCurrency(outstandingBalance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'info', label: 'Customer Information', icon: User },
              { id: 'orders', label: 'Order History', icon: ShoppingCart },
              { id: 'payments', label: 'Payment History', icon: DollarSign }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'info' | 'orders' | 'payments')}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Customer Information Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-purple-600" />
                  <span>Contact Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Contact Person</p>
                    <p className="font-medium text-gray-900">
                      {customer.contact_person || 'Not specified'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                    <p className="font-medium text-gray-900">
                      {customer.phone_number || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <span>Address Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Street Address</p>
                    <p className="font-medium text-gray-900">
                      {customer.street_address || 'Not specified'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Village/City</p>
                    <p className="font-medium text-gray-900">
                      {customer.village_or_city || 'Not specified'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm text-gray-600 mb-1">District</p>
                    <p className="font-medium text-gray-900">
                      {customer.district || 'Not specified'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Complete Address</p>
                    <p className="font-medium text-gray-900">
                      {customer.address || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Building className="w-5 h-5 text-purple-600" />
                  <span>Account Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Customer Since</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(customer.created_at)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Price List ID</p>
                    <p className="font-medium text-gray-900">
                      {customer.price_list_id || 'Default'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
                <p className="text-sm text-gray-600">{orders.length} total orders</p>
              </div>
              
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders found for this customer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Order #{order.id.slice(-8)}</p>
                          <p className="text-sm text-gray-600">{formatDate(order.order_date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
                        <p className={`text-sm px-2 py-1 rounded-full ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                <p className="text-sm text-gray-600">{payments.length} total payments</p>
              </div>
              
              {payments.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No payments found for this customer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.payment_method} Payment
                          </p>
                          <p className="text-sm text-gray-600">{formatDate(payment.payment_date)}</p>
                          {payment.reference_number && (
                            <p className="text-xs text-gray-500">Ref: {payment.reference_number}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}