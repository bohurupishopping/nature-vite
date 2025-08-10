import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Edit, Package, TrendingUp, RotateCcw, IndianRupee } from 'lucide-react'
import {
  getProductSalesHistory,
  getProductReturnsHistory
} from '../../integrations/supabase/client'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  sku: string
  stock_quantity: number
  image_url?: string
  created_at: string
}

interface SalesHistoryItem {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  orders: {
    id: string
    order_number: string
    created_at: string
    customers: {
      name: string
    }
  }
}

interface ReturnsHistoryItem {
  id: string
  quantity: number
  reason?: string
  created_at: string
  customers: {
    name: string
  }
}

interface ProductDetailProps {
  product: Product
  onBack: () => void
  onEdit: () => void
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack, onEdit }) => {
  const [salesHistory, setSalesHistory] = useState<SalesHistoryItem[]>([])
  const [returnsHistory, setReturnsHistory] = useState<ReturnsHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'returns'>('overview')

  const fetchHistoryData = useCallback(async () => {
    try {
      const [salesResult, returnsResult] = await Promise.all([
        getProductSalesHistory(product.id),
        getProductReturnsHistory(product.id)
      ])

      if (salesResult.error) {
        console.error('Error fetching sales history:', salesResult.error)
      } else {
        setSalesHistory(salesResult.data || [])
      }

      if (returnsResult.error) {
        console.error('Error fetching returns history:', returnsResult.error)
      } else {
        setReturnsHistory(returnsResult.data || [])
      }
    } catch (error) {
      console.error('Error fetching history data:', error)
      toast.error('Failed to fetch product history')
    } finally {
      setLoading(false)
    }
  }, [product.id])

  useEffect(() => {
    fetchHistoryData()
  }, [fetchHistoryData])

  const calculateTotalSales = () => {
    return salesHistory.reduce((total, sale) => total + sale.total_price, 0)
  }

  const calculateTotalQuantitySold = () => {
    return salesHistory.reduce((total, sale) => total + sale.quantity, 0)
  }

  const calculateTotalReturns = () => {
    return returnsHistory.reduce((total, returnItem) => total + returnItem.quantity, 0)
  }

  const getStockStatus = () => {
    if (product.stock_quantity === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-100' }
    if (product.stock_quantity <= 10) return { text: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' }
    return { text: 'In Stock', color: 'text-green-600 bg-green-100' }
  }

  const stockStatus = getStockStatus()

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors text-sm md:text-base"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          <span>Back to Products</span>
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Package className="w-5 h-5 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-sm md:text-base text-gray-600">
                <span className={`inline-flex items-center px-2.5 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${stockStatus.color}`}>
                  {stockStatus.text}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onEdit}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm md:text-base"
          >
            <Edit className="w-4 h-4 md:w-5 md:h-5" />
            <span>Edit Product</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-xl md:rounded-3xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-green-100 rounded-xl md:rounded-2xl flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-600">Total Sales Revenue</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                ₹{calculateTotalSales().toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-3xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-100 rounded-xl md:rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-600">Units Sold</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {calculateTotalQuantitySold()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-3xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-red-100 rounded-xl md:rounded-2xl flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-600">Units Returned</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {calculateTotalReturns()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Overview */}
      <div className="bg-white rounded-xl md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6 md:mb-8">
        <div className="p-4 md:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Product Image */}
            <div className="lg:col-span-1">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-56 md:h-64 object-cover rounded-xl md:rounded-2xl"
                />
              ) : (
                <div className="w-full h-56 md:h-64 bg-gray-100 rounded-xl md:rounded-2xl flex items-center justify-center">
                  <Package className="h-12 w-12 md:h-16 md:w-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
                <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
                  <span className="text-xl md:text-2xl font-bold text-green-600">
                    ₹{product.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="bg-gray-50 rounded-xl md:rounded-2xl p-3 md:p-4">
                  <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1">SKU</label>
                  <p className="text-sm md:text-base font-medium text-gray-900">{product.sku}</p>
                </div>
                <div className="bg-gray-50 rounded-xl md:rounded-2xl p-3 md:p-4">
                  <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1">Stock Quantity</label>
                  <p className="text-sm md:text-base font-medium text-gray-900">{product.stock_quantity}</p>
                </div>
                <div className="bg-gray-50 rounded-xl md:rounded-2xl p-3 md:p-4">
                  <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1">Created Date</label>
                  <p className="text-sm md:text-base font-medium text-gray-900">
                    {new Date(product.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {product.description && (
                <div className="bg-gray-50 rounded-xl md:rounded-2xl p-3 md:p-4">
                  <label className="block text-xs md:text-sm font-medium text-gray-600 mb-2">Description</label>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed">{product.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex space-x-4 md:space-x-8 px-4 md:px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Package },
              { id: 'sales', label: 'Sales History', icon: TrendingUp },
              { id: 'returns', label: 'Returns History', icon: RotateCcw }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'overview' | 'sales' | 'returns')}
                className={`flex items-center space-x-2 py-3 md:py-4 border-b-2 font-medium text-xs md:text-sm transition-colors ${activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                <span>{label} {id === 'sales' && `(${salesHistory.length})`}{id === 'returns' && `(${returnsHistory.length})`}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">Product Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <h4 className="text-sm md:text-base font-medium text-gray-900 mb-2 md:mb-3">Recent Activity</h4>
                      <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-gray-600">
                        <li className="flex justify-between">
                          <span>Total orders:</span>
                          <span className="font-medium">{salesHistory.length}</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Total returns:</span>
                          <span className="font-medium">{returnsHistory.length}</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Current stock:</span>
                          <span className="font-medium">{product.stock_quantity} units</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Product created:</span>
                          <span className="font-medium">{new Date(product.created_at).toLocaleDateString()}</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <h4 className="text-sm md:text-base font-medium text-gray-900 mb-2 md:mb-3">Performance Metrics</h4>
                      <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-gray-600">
                        <li className="flex justify-between">
                          <span>Average sale price:</span>
                          <span className="font-medium">₹{salesHistory.length > 0 ? (calculateTotalSales() / calculateTotalQuantitySold()).toFixed(2) : '0.00'}</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Return rate:</span>
                          <span className="font-medium">{calculateTotalQuantitySold() > 0 ? ((calculateTotalReturns() / calculateTotalQuantitySold()) * 100).toFixed(1) : '0'}%</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Revenue per unit:</span>
                          <span className="font-medium">₹{salesHistory.length > 0 ? (calculateTotalSales() / salesHistory.length).toFixed(2) : '0.00'}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sales' && (
                <div>
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900">Sales History</h3>
                    <p className="text-xs md:text-sm text-gray-600">{salesHistory.length} total sales</p>
                  </div>
                  {salesHistory.length > 0 ? (
                    <div className="space-y-4">
                      {salesHistory.map((sale) => (
                        <div key={sale.id} className="bg-gray-50 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-100 rounded-xl md:rounded-2xl flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm md:text-base font-medium text-gray-900">Order #{sale.orders.order_number}</p>
                              <p className="text-xs md:text-sm text-gray-600">{sale.orders.customers.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm md:text-base font-bold text-green-600">₹{sale.total_price.toFixed(2)}</p>
                            <p className="text-xs md:text-sm text-gray-600">{sale.quantity} units @ ₹{sale.unit_price.toFixed(2)}</p>
                            <p className="text-[10px] md:text-xs text-gray-500">{new Date(sale.orders.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 md:py-12">
                      <TrendingUp className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                      <p className="text-sm md:text-base text-gray-500">No sales history found for this product</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'returns' && (
                <div>
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900">Returns History</h3>
                    <p className="text-xs md:text-sm text-gray-600">{returnsHistory.length} total returns</p>
                  </div>
                  {returnsHistory.length > 0 ? (
                    <div className="space-y-4">
                      {returnsHistory.map((returnItem) => (
                        <div key={returnItem.id} className="bg-gray-50 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-9 h-9 md:w-10 md:h-10 bg-red-100 rounded-xl md:rounded-2xl flex items-center justify-center">
                              <RotateCcw className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm md:text-base font-medium text-gray-900">{returnItem.customers.name}</p>
                              <p className="text-xs md:text-sm text-gray-600">{returnItem.reason || 'No reason provided'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm md:text-base font-bold text-gray-900">{returnItem.quantity} units</p>
                            <p className="text-[10px] md:text-xs text-gray-500">{new Date(returnItem.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 md:py-12">
                      <RotateCcw className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                      <p className="text-sm md:text-base text-gray-500">No returns history found for this product</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductDetail