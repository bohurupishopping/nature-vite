import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, DollarSign } from 'lucide-react'
import {
  getPriceLists,
  createPriceList,
  updatePriceList,
  deletePriceList,
  getProductPricesByPriceList,
  getProducts
} from '../integrations/supabase/client'
import { toast } from 'sonner'
import ProductPriceForm from './ProductPriceForm'

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
  const [priceListForm, setPriceListForm] = useState({ name: '', description: '' })
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

  const handleCreatePriceList = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await createPriceList(priceListForm)
      if (error) throw error
      setPriceLists([...priceLists, data])
      setPriceListForm({ name: '', description: '' })
      setShowPriceListForm(false)
      toast.success('Price list created successfully')
    } catch (error) {
      console.error('Error creating price list:', error)
      toast.error('Failed to create price list')
    }
  }

  const handleUpdatePriceList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPriceList) return

    try {
      const { data, error } = await updatePriceList(editingPriceList.id, priceListForm)
      if (error) throw error
      setPriceLists(priceLists.map(pl => pl.id === editingPriceList.id ? data : pl))
      setPriceListForm({ name: '', description: '' })
      setEditingPriceList(null)
      setShowPriceListForm(false)
      toast.success('Price list updated successfully')
    } catch (error) {
      console.error('Error updating price list:', error)
      toast.error('Failed to update price list')
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

  const openEditForm = (priceList: PriceList) => {
    setEditingPriceList(priceList)
    setPriceListForm({ name: priceList.name, description: priceList.description || '' })
    setShowPriceListForm(true)
  }

  const openCreateForm = () => {
    setEditingPriceList(null)
    setPriceListForm({ name: '', description: '' })
    setShowPriceListForm(true)
  }

  const filteredProductPrices = productPrices.filter(pp =>
    pp.products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pp.products.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Product Prices &amp; Price Lists</h1>
      </div>

      {/* Price Lists Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Price Lists</h2>
          <button
            onClick={openCreateForm}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Price List
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {priceLists.map((priceList) => (
                <tr key={priceList.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {priceList.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {priceList.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(priceList.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditForm(priceList)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePriceList(priceList.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Prices Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Product Prices</h2>
          {selectedPriceList && (
            <button
              onClick={() => setShowProductPriceForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Add Product Price
            </button>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Price List
          </label>
          <select
            value={selectedPriceList}
            onChange={(e) => setSelectedPriceList(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProductPrices.map((productPrice) => (
                    <tr key={productPrice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {productPrice.products.image_url && (
                            <img
                              className="h-10 w-10 rounded-full mr-3 object-cover"
                              src={productPrice.products.image_url}
                              alt={productPrice.products.name}
                            />
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {productPrice.products.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {productPrice.products.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{productPrice.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProductPrices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No product prices found for this price list.
              </div>
            )}
          </>
        )}
      </div>

      {/* Price List Form Modal */}
      {showPriceListForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingPriceList ? 'Edit Price List' : 'Create New Price List'}
            </h3>
            <form onSubmit={editingPriceList ? handleUpdatePriceList : handleCreatePriceList}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={priceListForm.name}
                  onChange={(e) => setPriceListForm({ ...priceListForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={priceListForm.description}
                  onChange={(e) => setPriceListForm({ ...priceListForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPriceListForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingPriceList ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
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