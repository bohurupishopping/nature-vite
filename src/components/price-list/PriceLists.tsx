import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, DollarSign, Tag } from 'lucide-react'
import {
  getPriceLists,
  deletePriceList,
  getProductPricesByPriceList,
  getProducts
} from '../../integrations/supabase/client'
import { toast } from 'sonner'
import ProductPriceForm from './ProductPriceForm'
import PriceListForm from './PriceListForm'

interface PriceList {
  id: string
  name: string
  description?: string
  created_at: string
}

interface ProductPrice {
  id: string
  price: number
  products: {
    id: string
    name: string
    sku: string
    image_url?: string
  }
}

interface Product {
  id: string
  name: string
  sku: string
  price: number
  image_url?: string
}

const PriceLists: React.FC = () => {
  const [priceLists, setPriceLists] = useState<PriceList[]>([])
  const [selectedPriceList, setSelectedPriceList] = useState<string>('')
  const [productPrices, setProductPrices] = useState<ProductPrice[]>([])
  const [, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showPriceListForm, setShowPriceListForm] = useState(false)
  const [showProductPriceForm, setShowProductPriceForm] = useState(false)
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPriceLists()
    fetchProducts()
  }, [])

  useEffect(() => {
    if (selectedPriceList) {
      fetchProductPrices(selectedPriceList)
    }
  }, [selectedPriceList])

  const fetchPriceLists = async () => {
    try {
      const { data, error } = await getPriceLists()
      if (error) throw error
      setPriceLists(data || [])
    } catch (error) {
      console.error('Error fetching price lists:', error)
      toast.error('Failed to fetch price lists')
    }
  }

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

  const fetchProductPrices = async (priceListId: string) => {
    try {
      const { data, error } = await getProductPricesByPriceList(priceListId)
      if (error) throw error
      setProductPrices(data || [])
    } catch (error) {
      console.error('Error fetching product prices:', error)
      toast.error('Failed to fetch product prices')
    }
  }

  const handleDeletePriceList = async (id: string) => {
    if (!confirm('Are you sure you want to delete this price list?')) return

    try {
      const { error } = await deletePriceList(id)
      if (error) throw error
      setPriceLists(priceLists.filter(pl => pl.id !== id))
      if (selectedPriceList === id) {
        setSelectedPriceList('')
        setProductPrices([])
      }
      toast.success('Price list deleted successfully')
    } catch (error) {
      console.error('Error deleting price list:', error)
      toast.error('Failed to delete price list')
    }
  }

  const handlePriceListSuccess = () => {
    fetchPriceLists()
    setShowPriceListForm(false)
  }

  const openEditForm = (priceList: PriceList) => {
    setEditingPriceList(priceList)
    setShowPriceListForm(true)
  }

  const openCreateForm = () => {
    setEditingPriceList(null)
    setShowPriceListForm(true)
  }

  const filteredProductPrices = productPrices.filter(pp =>
    pp.products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pp.products.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
            <Tag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Prices & Price Lists</h1>
            <p className="text-gray-600">Manage your product pricing and price lists</p>
          </div>
        </div>
      </div>

      {/* Price Lists Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Price Lists</h2>
            <button
              onClick={openCreateForm}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Price List</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Name</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Description</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Created</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {priceLists.map((priceList) => (
                <tr key={priceList.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-gray-900">{priceList.name}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-gray-900">
                      {priceList.description || '-'}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-gray-900">
                      {new Date(priceList.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditForm(priceList)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                        title="Edit Price List"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePriceList(priceList.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                        title="Delete Price List"
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

        {priceLists.length === 0 && (
          <div className="text-center py-12">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No price lists yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first price list</p>
            <button
              onClick={openCreateForm}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              <span>Add Price List</span>
            </button>
          </div>
        )}
      </div>

      {/* Product Prices Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Product Prices</h2>
            {selectedPriceList && (
              <button
                onClick={() => setShowProductPriceForm(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <DollarSign className="w-5 h-5" />
                <span>Add Product Price</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Price List
            </label>
            <select
              value={selectedPriceList}
              onChange={(e) => setSelectedPriceList(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a price list...</option>
              {priceLists.map((priceList) => (
                <option key={priceList.id} value={priceList.id}>
                  {priceList.name}
                </option>
              ))}
            </select>
          </div>

          {selectedPriceList && (
            <>
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Product</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">SKU</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Price</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProductPrices.map((productPrice) => (
                      <tr key={productPrice.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            {productPrice.products.image_url ? (
                              <img
                                className="h-10 w-10 rounded-2xl mr-3 object-cover"
                                src={productPrice.products.image_url}
                                alt={productPrice.products.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-2xl mr-3 bg-gray-100 flex items-center justify-center">
                                <Tag className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div className="font-semibold text-gray-900">
                              {productPrice.products.name}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-900">{productPrice.products.sku}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-green-600">₹{productPrice.price.toFixed(2)}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end space-x-2">
                            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredProductPrices.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No products found' : 'No product prices yet'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm
                      ? 'Try adjusting your search terms'
                      : 'Get started by adding your first product price'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => setShowProductPriceForm(true)}
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Add Product Price</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Price List Form Modal */}
      {showPriceListForm && (
        <PriceListForm
          priceList={editingPriceList}
          onClose={() => setShowPriceListForm(false)}
          onSuccess={handlePriceListSuccess}
        />
      )}

      {/* Product Price Form Modal */}
      {showProductPriceForm && selectedPriceList && (
        <ProductPriceForm
          priceListId={selectedPriceList}
          onClose={() => setShowProductPriceForm(false)}
          onSuccess={() => {
            fetchProductPrices(selectedPriceList)
            setShowProductPriceForm(false)
          }}
        />
      )}
    </div>
  )
}

export default PriceLists