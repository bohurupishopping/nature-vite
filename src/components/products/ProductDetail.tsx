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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Product Details</h1>
        </div>
        <button
          onClick={onEdit}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Product
        </button>
      </div>

      {/* Product Overview */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Image */}
            <div className="lg:col-span-1">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-lg font-semibold text-green-600">
                    ₹{product.price.toFixed(2)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}>
                    {stockStatus.text}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">SKU</label>
                  <p className="text-lg font-semibold text-gray-900">{product.sku}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Stock Quantity</label>
                  <p className="text-lg font-semibold text-gray-900">{product.stock_quantity}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created Date</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(product.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {product.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <IndianRupee className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Sales Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{calculateTotalSales().toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Units Sold</p>
              <p className="text-2xl font-bold text-gray-900">
                {calculateTotalQuantitySold()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Units Returned</p>
              <p className="text-2xl font-bold text-gray-900">
                {calculateTotalReturns()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'sales'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Sales History ({salesHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('returns')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'returns'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Returns History ({returnsHistory.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Product Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Recent Activity</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Total orders: {salesHistory.length}</li>
                        <li>• Total returns: {returnsHistory.length}</li>
                        <li>• Current stock: {product.stock_quantity} units</li>
                        <li>• Product created: {new Date(product.created_at).toLocaleDateString()}</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Average sale price: ₹{salesHistory.length > 0 ? (calculateTotalSales() / calculateTotalQuantitySold()).toFixed(2) : '0.00'}</li>
                        <li>• Return rate: {calculateTotalQuantitySold() > 0 ? ((calculateTotalReturns() / calculateTotalQuantitySold()) * 100).toFixed(1) : '0'}%</li>
                        <li>• Revenue per unit: ₹{salesHistory.length > 0 ? (calculateTotalSales() / salesHistory.length).toFixed(2) : '0.00'}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sales' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales History</h3>
                  {salesHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Order
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Unit Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {salesHistory.map((sale) => (
                            <tr key={sale.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {sale.orders.order_number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {sale.orders.customers.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {sale.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ₹{sale.unit_price.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                ₹{sale.total_price.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(sale.orders.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p>No sales history found for this product.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'returns' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Returns History</h3>
                  {returnsHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reason
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {returnsHistory.map((returnItem) => (
                            <tr key={returnItem.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {returnItem.customers.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {returnItem.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {returnItem.reason || 'No reason provided'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(returnItem.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <RotateCcw className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p>No returns history found for this product.</p>
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