import { useState, useEffect } from 'react'
import { X, Save, Tag } from 'lucide-react'
import { createPriceList, updatePriceList } from '../../integrations/supabase/client'
import { toast } from 'sonner'

interface PriceList {
  id: string
  name: string
  description?: string
  created_at: string
}

interface PriceListFormProps {
  priceList?: PriceList | null
  onClose: () => void
  onSuccess: () => void
}

export default function PriceListForm({ priceList, onClose, onSuccess }: PriceListFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (priceList) {
      setFormData({
        name: priceList.name,
        description: priceList.description || ''
      })
    }
  }, [priceList])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
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
      if (priceList) {
        await updatePriceList(priceList.id, formData)
        toast.success('Price list updated successfully')
      } else {
        await createPriceList(formData)
        toast.success('Price list created successfully')
      }
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Error saving price list:', error)
      toast.error('Failed to save price list')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Save className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-green-900 mb-2">
              Price List {priceList ? 'Updated' : 'Created'} Successfully!
            </h2>
            <p className="text-green-700">
              Redirecting back to price lists...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Tag className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {priceList ? 'Edit Price List' : 'Create Price List'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.name ? 'border-red-300' : 'border-gray-200'
                }`}
              placeholder="Enter price list name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              placeholder="Enter price list description (optional)"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{priceList ? 'Update Price List' : 'Create Price List'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}