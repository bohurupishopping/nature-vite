import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Upload, X, Package } from 'lucide-react'
import { createProduct, updateProduct } from '../../integrations/supabase/client'
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

interface ProductFormProps {
  product?: Product | null
  onSave: (product: Product) => void
  onCancel: () => void
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    sku: '',
    stock_quantity: 0,
    image_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        sku: product.sku,
        stock_quantity: product.stock_quantity,
        image_url: product.image_url || ''
      })
    }
  }, [product])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required'
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0'
    }

    if (formData.stock_quantity < 0) {
      newErrors.stock_quantity = 'Stock quantity cannot be negative'
    }

    if (formData.image_url && !isValidUrl(formData.image_url)) {
      newErrors.image_url = 'Please enter a valid URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      let result
      if (product) {
        result = await updateProduct(product.id, formData)
      } else {
        result = await createProduct(formData)
      }

      if (result.error) throw result.error

      setSuccess(true)
      toast.success(`Product ${product ? 'updated' : 'created'} successfully`)
      setTimeout(() => {
        onSave(result.data)
      }, 1500)
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error(`Failed to ${product ? 'update' : 'create'} product`)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleImageUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }))
    if (errors.image_url) {
      setErrors(prev => ({ ...prev, image_url: '' }))
    }
  }

  const clearImageUrl = () => {
    setFormData(prev => ({ ...prev, image_url: '' }))
  }

  if (success) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-3xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Save className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-green-900 mb-2">
              Product {product ? 'Updated' : 'Created'} Successfully!
            </h2>
            <p className="text-green-700">
              Redirecting back to products list...
            </p>
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
          onClick={onCancel}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Products</span>
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {product ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-gray-600">
              {product ? 'Update product information' : 'Enter product details below'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Product Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-200'
                      }`}
                    placeholder="Enter product name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* SKU */}
                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                    SKU *
                  </label>
                  <input
                    type="text"
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value.toUpperCase())}
                    className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.sku ? 'border-red-500' : 'border-gray-200'
                      }`}
                    placeholder="Enter SKU (e.g., PROD-001)"
                  />
                  {errors.sku && (
                    <p className="mt-1 text-sm text-red-600">{errors.sku}</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      id="price"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.price ? 'border-red-500' : 'border-gray-200'
                        }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                  )}
                </div>

                {/* Stock Quantity */}
                <div>
                  <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    id="stock_quantity"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => handleInputChange('stock_quantity', parseInt(e.target.value) || 0)}
                    className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.stock_quantity ? 'border-red-500' : 'border-gray-200'
                      }`}
                    placeholder="0"
                  />
                  {errors.stock_quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.stock_quantity}</p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter product description"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Image
                  </label>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => handleImageUrlChange(e.target.value)}
                        className={`flex-1 px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.image_url ? 'border-red-500' : 'border-gray-200'
                          }`}
                        placeholder="Enter image URL"
                      />
                      {formData.image_url && (
                        <button
                          type="button"
                          onClick={clearImageUrl}
                          className="px-4 py-3 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-2xl hover:bg-gray-50"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    {errors.image_url && (
                      <p className="text-sm text-red-600">{errors.image_url}</p>
                    )}

                    {/* Image Preview */}
                    {formData.image_url && isValidUrl(formData.image_url) && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                        <div className="w-32 h-32 border border-gray-200 rounded-2xl overflow-hidden">
                          <img
                            src={formData.image_url}
                            alt="Product preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="text-sm text-gray-500 flex items-center">
                      <Upload className="inline h-4 w-4 mr-1" />
                      Tip: You can use image URLs from services like Imgur, Cloudinary, or your own server.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>{product ? 'Update Product' : 'Create Product'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductForm