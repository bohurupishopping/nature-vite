import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  Edit,
  Eye,
  Users,
  Phone,
  MapPin,
  CreditCard,
  Banknote
} from 'lucide-react'
import { getCustomers } from '../../integrations/supabase/client'
import CustomerForm from './CustomerForm'
import CustomerDetail from './CustomerDetail'

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

type ViewMode = 'list' | 'create' | 'edit' | 'detail'

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const { data, error } = await getCustomers()
      if (error) throw error
      setCustomers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }

  const filterCustomers = useCallback(() => {
    if (!searchTerm) {
      setFilteredCustomers(customers)
      return
    }

    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone_number && customer.phone_number.includes(searchTerm))
    )
    setFilteredCustomers(filtered)
  }, [customers, searchTerm])

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    filterCustomers()
  }, [filterCustomers])

  const handleCreateCustomer = () => {
    setSelectedCustomer(null)
    setViewMode('create')
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setViewMode('edit')
  }

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setViewMode('detail')
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedCustomer(null)
    fetchCustomers() // Refresh the list
  }

  const getTypeIcon = (type: string | null) => {
    if (type === 'Credit') {
      return <CreditCard className="w-4 h-4 text-orange-500" />
    } else if (type === 'Cash') {
      return <Banknote className="w-4 h-4 text-green-500" />
    }
    return <div className="w-4 h-4" />
  }

  const getTypeColor = (type: string | null) => {
    if (type === 'Credit') {
      return 'bg-orange-100 text-orange-800'
    } else if (type === 'Cash') {
      return 'bg-green-100 text-green-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <CustomerForm
        customer={selectedCustomer}
        onBack={handleBackToList}
        isEdit={viewMode === 'edit'}
      />
    )
  }

  if (viewMode === 'detail' && selectedCustomer) {
    return (
      <CustomerDetail
        customerId={selectedCustomer.id}
        onBack={handleBackToList}
        onEdit={() => handleEditCustomer(selectedCustomer)}
      />
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">Manage your customer database</p>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search customers by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleCreateCustomer}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        /* Customer List */
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No customers found' : 'No customers yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Get started by adding your first customer'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={handleCreateCustomer}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Customer</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Customer</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Contact Person</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Phone</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Type</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Location</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-semibold text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">
                            Added {new Date(customer.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-900">
                          {customer.contact_person || '-'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          {customer.phone_number && (
                            <>
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">{customer.phone_number}</span>
                            </>
                          )}
                          {!customer.phone_number && (
                            <span className="text-gray-500">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(customer.type)}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(customer.type)}`}>
                            {customer.type || 'Not Set'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          {(customer.village_or_city || customer.district) && (
                            <>
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">
                                {[customer.village_or_city, customer.district].filter(Boolean).join(', ')}
                              </span>
                            </>
                          )}
                          {!customer.village_or_city && !customer.district && (
                            <span className="text-gray-500">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewCustomer(customer)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditCustomer(customer)}
                            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200"
                            title="Edit Customer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {!loading && filteredCustomers.length > 0 && (
        <div className="mt-6 text-center text-gray-500">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      )}
    </div>
  )
}