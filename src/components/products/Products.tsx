import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Eye, Search, Package } from 'lucide-react'
import {
  getProducts,
  searchProducts
} from '../../integrations/supabase/client'
import { toast } from 'sonner'
import ProductForm from './ProductForm'
import ProductDetail from './ProductDetail'

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

type ViewMode = 'list' | 'create' | 'edit' | 'detail'

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [displayMode] = useState<'grid' | 'table'>('grid')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await getProducts()
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = useCallback(async () => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products)
      return
    }

    try {
      const { data, error } = await searchProducts(searchTerm)
      if (error) throw error
      setFilteredProducts(data || [])
    } catch (error) {
      console.error('Error searching products:', error)
      setFilteredProducts(
        products.filter(product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }
  }, [searchTerm, products])

  useEffect(() => {
    filterProducts()
  }, [filterProducts])

  const handleCreateProduct = () => {
    setSelectedProduct(null)
    setViewMode('create')
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setViewMode('edit')
  }

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setViewMode('detail')
  }

  const handleProductSaved = (savedProduct: Product) => {
    if (viewMode === 'create') {
      setProducts([...products, savedProduct])
    } else if (viewMode === 'edit') {
      setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p))
    }
    setViewMode('list')
    setSelectedProduct(null)
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedProduct(null)
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-100' }
    if (stock <= 10) return { text: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' }
    return { text: 'In Stock', color: 'text-green-600 bg-green-100' }
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <ProductForm
        product={selectedProduct}
        onSave={handleProductSaved}
        onCancel={handleBackToList}
      />
    )
  }

  if (viewMode === 'detail' && selectedProduct) {
    return (
      <ProductDetail
        product={selectedProduct}
        onBack={handleBackToList}
        onEdit={() => handleEditProduct(selectedProduct)}
      />
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600">Manage your product inventory</p>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleCreateProduct}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Products Display */}
          {displayMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock_quantity)
                return (
                  <div key={product.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200">
                    <div className="aspect-w-1 aspect-h-1 w-full">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-500 mb-3">SKU: {product.sku}</p>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xl font-bold text-green-600">₹{product.price.toFixed(2)}</span>
                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewProduct(product)}
                          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Product</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">SKU</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Price</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Stock</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Created</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock_quantity)
                      return (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              {product.image_url ? (
                                <img
                                  className="h-10 w-10 rounded-2xl mr-3 object-cover"
                                  src={product.image_url}
                                  alt={product.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-2xl mr-3 bg-gray-100 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-gray-900">{product.name}</div>
                                {product.description && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {product.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-gray-900">{product.sku}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-green-600">₹{product.price.toFixed(2)}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                              {product.stock_quantity}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-gray-900">
                              {new Date(product.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleViewProduct(product)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                                title="Edit Product"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No products found' : 'No products yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Get started by adding your first product'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={handleCreateProduct}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Product</span>
                </button>
              )}
            </div>
          )}

          {/* Summary */}
          {filteredProducts.length > 0 && (
            <div className="mt-6 text-center text-gray-500">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Products