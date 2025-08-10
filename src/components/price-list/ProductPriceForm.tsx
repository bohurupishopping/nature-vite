import { useState, useEffect } from 'react'
import { X, Save, Loader2, Search } from 'lucide-react'
import {
  searchProducts,
  createProductPrice,
  updateProductPrice,
  getProductPriceByProductAndPriceList
} from '../../integrations/supabase/client'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  sku: string
  price: number
}

interface ProductPrice {
  id: string
  price_list_id: string
  product_id: string
  price: number
  created_at: string
  updated_at: string
}

interface ProductPriceFormProps {
  priceListId: string
  productPrice?: ProductPrice | null
  onClose: () => void
  onSuccess: () => void
}

export default function ProductPriceForm({
  priceListId,
  productPrice,
  onClose,
  onSuccess
}: ProductPriceFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [price, setPrice] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (productPrice) {
      // For editing, we need to get the product details
      const loadProductDetails = async () => {
        try {
          const { data: products, error } = await searchProducts('')
          if (error) {
            console.error('Error loading products:', error)
            return
          }
          const product = products?.find((p: Product) => p.id === productPrice.product_id)
          if (product) {
            setSelectedProduct(product)
            setPrice(productPrice.price.toString())
          }
        } catch (error) {
          console.error('Error loading product details:', error)
        }
      }
      loadProductDetails()
    }
  }, [productPrice])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (query.trim().length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setSearching(true)
    try {
      const { data: results, error } = await searchProducts(query)
      if (error) {
        console.error('Error searching products:', error)
        toast.error('Failed to search products')
        return
      }
      setSearchResults(results || [])
      setShowSearchResults(true)
    } catch (error) {
      console.error('Error searching products:', error)
      toast.error('Failed to search products')
    } finally {
      setSearching(false)
    }
  }

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setSearchQuery(product.name)
    setShowSearchResults(false)
    setPrice(product.price.toString())

    // Clear product error when product is selected
    if (errors.product) {
      setErrors(prev => ({ ...prev, product: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!selectedProduct) {
      newErrors.product = 'Please select a product'
    }

    if (!price.trim()) {
      newErrors.price = 'Price is required'
    } else if (isNaN(Number(price)) || Number(price) < 0) {
      newErrors.price = 'Please enter a valid price'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const priceData = {
        price_list_id: priceListId,
        product_id: selectedProduct!.id,
        price: Number(price)
      }

      if (productPrice) {
        await updateProductPrice(productPrice.id, Number(price))
        toast.success('Product price updated successfully')
      } else {
        // Check if product price already exists
        const { data: existingPrice, error: existingPriceError } = await getProductPriceByProductAndPriceList(
          selectedProduct!.id,
          priceListId
        )

        if (existingPrice && !existingPriceError) {
          toast.error('This product already has a price in this price list')
          return
        }

        await createProductPrice(priceData)
        toast.success('Product price added successfully')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving product price:', error)
      toast.error('Failed to save product price')
    } finally {
      setLoading(false)
    }
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(e.target.value)

    // Clear price error when user starts typing
    if (errors.price) {
      setErrors(prev => ({ ...prev, price: '' }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {productPrice ? 'Edit Product Price' : 'Add Product Price'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Search */}
          <div className="relative">
            <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-2">
              Product *
            </label>
            <div className="relative">
              <input
                type="text"
                id="product"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                disabled={!!productPrice} // Disable for editing
                className={`w-full px-4 py-3 pl-10 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.product ? 'border-red-300' : 'border-gray-300'
                  } ${productPrice ? 'bg-gray-50' : ''}`}
                placeholder="Search for a product..."
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>

            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductSelect(product)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">SKU: {product.sku} • ₹{product.price}</div>
                  </button>
                ))}
              </div>
            )}

            {errors.product && (
              <p className="mt-1 text-sm text-red-600">{errors.product}</p>
            )}
          </div>

          {/* Selected Product Display */}
          {selectedProduct && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="font-medium text-blue-900">{selectedProduct.name}</div>
              <div className="text-sm text-blue-700">SKU: {selectedProduct.sku}</div>
              <div className="text-sm text-blue-700">Default Price: ₹{selectedProduct.price}</div>
            </div>
          )}

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Price *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                id="price"
                value={price}
                onChange={handlePriceChange}
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 pl-8 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.price ? 'border-red-300' : 'border-gray-300'
                  }`}
                placeholder="0.00"
              />
            </div>
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{productPrice ? 'Update' : 'Add'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}