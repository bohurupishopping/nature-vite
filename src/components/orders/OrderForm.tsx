import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Save,
  Trash2,
  Search,
  Users,
  Package,
  Calculator,
  AlertCircle
} from 'lucide-react'
import {
  createOrder,
  getCustomers,
  getProducts,
  getSalesmen,
  getProductPriceByProductAndPriceList
} from '../../integrations/supabase/client'

interface Customer {
  id: string
  name: string
  type: string | null
  contact_person: string | null
  phone_number: string | null
  price_list_id: string | null
}

interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock_quantity: number
  image_url: string | null
}

interface Salesman {
  id: string
  full_name: string | null
  phone_number: string | null
}

interface OrderItem {
  id: string
  product_id: string
  product: Product | null
  quantity: number
  unit_price: number
  total_price: number
}

interface OrderFormProps {
  order?: any
  onBack: () => void
  isEdit?: boolean
}

export default function OrderForm({ onBack, isEdit = false }: OrderFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [salesmen, setSalesmen] = useState<Salesman[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

  // Form state
  const [orderType, setOrderType] = useState<'direct' | 'salesman'>('direct')
  const [selectedSalesmanId, setSelectedSalesmanId] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [orderNotes, setOrderNotes] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [shippingCosts, setShippingCosts] = useState(0)
  const [dueDate, setDueDate] = useState('')

  // Search states
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (customerSearch) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (customer.contact_person && customer.contact_person.toLowerCase().includes(customerSearch.toLowerCase()))
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers(customers)
    }
  }, [customerSearch, customers])

  useEffect(() => {
    if (productSearch) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.sku.toLowerCase().includes(productSearch.toLowerCase())
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [productSearch, products])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [customersRes, productsRes, salesmenRes] = await Promise.all([
        getCustomers(),
        getProducts(),
        getSalesmen()
      ])

      if (customersRes.error) throw customersRes.error
      if (productsRes.error) throw productsRes.error
      if (salesmenRes.error) throw salesmenRes.error

      setCustomers(customersRes.data || [])
      setProducts(productsRes.data || [])
      setSalesmen(salesmenRes.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerSelect = async (customer: Customer) => {
    setSelectedCustomerId(customer.id)
    setSelectedCustomer(customer)
    setCustomerSearch(customer.name)
    setShowCustomerDropdown(false)

    // Update prices for existing order items based on customer's price list
    if (customer.price_list_id && orderItems.length > 0) {
      const updatedItems = await Promise.all(
        orderItems.map(async (item) => {
          if (item.product) {
            try {
              const { data: priceData } = await getProductPriceByProductAndPriceList(
                item.product.id,
                customer.price_list_id!
              )
              const newPrice = priceData?.price || item.product.price
              return {
                ...item,
                unit_price: newPrice,
                total_price: item.quantity * newPrice
              }
            } catch {
              return item
            }
          }
          return item
        })
      )
      setOrderItems(updatedItems)
    }
  }

  const handleProductSelect = async (product: Product) => {
    // Check if product already exists in order items
    const existingItem = orderItems.find(item => item.product_id === product.id)
    if (existingItem) {
      setError('Product already added to order')
      return
    }

    // Get price based on customer's price list or default price
    let unitPrice = product.price
    if (selectedCustomer?.price_list_id) {
      try {
        const { data: priceData } = await getProductPriceByProductAndPriceList(
          product.id,
          selectedCustomer.price_list_id
        )
        unitPrice = priceData?.price || product.price
      } catch {
        // Use default price if custom price not found
      }
    }

    const newItem: OrderItem = {
      id: Date.now().toString(),
      product_id: product.id,
      product,
      quantity: 1,
      unit_price: unitPrice,
      total_price: unitPrice
    }

    setOrderItems([...orderItems, newItem])
    setProductSearch('')
    setShowProductDropdown(false)
  }

  const updateOrderItem = (itemId: string, field: 'quantity' | 'unit_price', value: number) => {
    setOrderItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value }
          updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price
          return updatedItem
        }
        return item
      })
    )
  }

  const removeOrderItem = (itemId: string) => {
    setOrderItems(items => items.filter(item => item.id !== itemId))
  }

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total_price, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    return subtotal - discountAmount + taxAmount + shippingCosts
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!selectedCustomerId) {
      setError('Please select a customer')
      return
    }

    if (orderType === 'salesman' && !selectedSalesmanId) {
      setError('Please select a salesman')
      return
    }

    if (orderItems.length === 0) {
      setError('Please add at least one product to the order')
      return
    }

    // Check stock availability
    for (const item of orderItems) {
      if (item.product && item.quantity > item.product.stock_quantity) {
        setError(`Insufficient stock for ${item.product.name}. Available: ${item.product.stock_quantity}`)
        return
      }
    }

    try {
      setLoading(true)

      const orderData = {
        salesman_id: orderType === 'direct' ? salesmen[0]?.id || '' : selectedSalesmanId,
        customer_id: selectedCustomerId,
        total_amount: calculateTotal(),
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        shipping_costs: shippingCosts,
        order_notes: orderNotes || undefined,
        order_type: 'Standard',
        due_date: dueDate || undefined
      }

      const orderItemsData = orderItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))

      const { error: createError } = await createOrder(orderData, orderItemsData)

      if (createError) throw createError

      onBack()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !customers.length) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Order' : 'Create New Order'}
        </h1>
        <p className="text-gray-600">Fill in the order details below</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Order Type Selection */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Type</h3>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                value="direct"
                checked={orderType === 'direct'}
                onChange={(e) => setOrderType(e.target.value as 'direct' | 'salesman')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-900">Direct Order</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                value="salesman"
                checked={orderType === 'salesman'}
                onChange={(e) => setOrderType(e.target.value as 'direct' | 'salesman')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-900">Salesman Order</span>
            </label>
          </div>

          {/* Salesman Selection */}
          {orderType === 'salesman' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Salesman *
              </label>
              <select
                value={selectedSalesmanId}
                onChange={(e) => setSelectedSalesmanId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a salesman...</option>
                {salesmen.map(salesman => (
                  <option key={salesman.id} value={salesman.id}>
                    {salesman.full_name || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Customer Selection */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Customer Information</span>
          </h3>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search and Select Customer *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value)
                  setShowCustomerDropdown(true)
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder="Search customers by name or contact person..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Customer Dropdown */}
            {showCustomerDropdown && filteredCustomers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredCustomers.map(customer => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleCustomerSelect(customer)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    {customer.contact_person && (
                      <div className="text-sm text-gray-500">{customer.contact_person}</div>
                    )}
                    {customer.type && (
                      <div className="text-xs text-blue-600">{customer.type} Customer</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Selection */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Products</span>
          </h3>

          {/* Add Product */}
          <div className="relative mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search and Add Products
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value)
                  setShowProductDropdown(true)
                }}
                onFocus={() => setShowProductDropdown(true)}
                placeholder="Search products by name or SKU..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Product Dropdown */}
            {showProductDropdown && filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductSelect(product)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    disabled={orderItems.some(item => item.product_id === product.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                        <div className="text-sm text-green-600">₹{product.price.toFixed(2)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Stock: {product.stock_quantity}</div>
                        {orderItems.some(item => item.product_id === product.id) && (
                          <div className="text-xs text-blue-600">Already added</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Order Items List */}
          {orderItems.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Order Items</h4>
              {orderItems.map(item => (
                <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.product?.name}</div>
                    <div className="text-sm text-gray-500">SKU: {item.product?.sku}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        max={item.product?.stock_quantity || 999}
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-20 px-2 py-1 border border-gray-200 rounded text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Unit Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateOrderItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border border-gray-200 rounded text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Total</label>
                      <div className="w-24 px-2 py-1 bg-gray-100 rounded text-center font-medium">
                        ₹{item.total_price.toFixed(2)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOrderItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Calculations */}
        {orderItems.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Calculator className="w-5 h-5" />
              <span>Order Summary</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Costs</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={shippingCosts}
                  onChange={(e) => setShippingCosts(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center text-lg">
                <span className="font-medium text-gray-900">Subtotal:</span>
                <span className="font-semibold">₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-medium text-gray-900">Discount:</span>
                <span className="font-semibold text-red-600">-₹{discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-medium text-gray-900">Tax:</span>
                <span className="font-semibold">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-medium text-gray-900">Shipping:</span>
                <span className="font-semibold">₹{shippingCosts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-900">Total:</span>
                <span className="text-blue-600">₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes</label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special instructions or notes..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || orderItems.length === 0 || !selectedCustomerId}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span>{loading ? 'Creating...' : 'Place Order'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}