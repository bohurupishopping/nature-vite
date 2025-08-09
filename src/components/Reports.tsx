import React, { useState, useEffect } from 'react'
import {
  FileText,
  Download,
  Filter,
  Calendar,
  Users,
  IndianRupee,
  Package,
  TrendingUp,
  Search,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react'
import {
  getSalesReport,
  getPaymentsReport,
  getInventoryReport,
  getDetailedSalesReport
} from '../integrations/supabase/client'
import {
  exportSalesReportToExcel,
  exportDetailedSalesReportToExcel
} from '../utils/excelExport'

export default function Reports() {
  const [activeReport, setActiveReport] = useState('sales')
  const [reportData, setReportData] = useState<any>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    salesmanId: '',
    customerId: ''
  })

  const reportTypes = [
    {
      id: 'sales',
      name: 'Sales Report',
      icon: TrendingUp,
      color: 'blue',
      description: 'Comprehensive sales analysis'
    },
    {
      id: 'payments',
      name: 'Payments & Dues',
      icon: IndianRupee,
      color: 'green',
      description: 'Payment tracking and dues'
    },
    {
      id: 'inventory',
      name: 'Inventory Report',
      icon: Package,
      color: 'purple',
      description: 'Stock levels and movements'
    }
  ]

  const fetchReportData = async () => {
    setLoading(true)
    try {
      let data, error

      switch (activeReport) {
        case 'sales':
          ({ data, error } = await getSalesReport(filters))
          break
        case 'payments':
          ({ data, error } = await getPaymentsReport(filters))
          break
        case 'inventory':
          ({ data, error } = await getInventoryReport())
          break
        default:
          data = []
          error = null
      }

      if (error) {
        console.error('Error fetching report data:', error)
        setReportData([])
      } else {
        setReportData(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      setReportData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [activeReport])

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const applyFilters = () => {
    fetchReportData()
  }

  const exportReport = () => {
    if (reportData.length === 0) {
      alert('No data available to export')
      return
    }

    exportSalesReportToExcel(reportData, activeReport)
  }

  const exportDetailedSalesReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      alert('Please select both start and end dates for detailed sales report')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await getDetailedSalesReport(filters.startDate, filters.endDate)

      if (error) {
        console.error('Error fetching detailed sales report:', error)
        alert('Error fetching detailed sales report')
        return
      }

      if (!data || data.length === 0) {
        alert('No detailed sales data available for the selected date range')
        return
      }

      exportDetailedSalesReportToExcel(data, filters.startDate, filters.endDate)
    } catch (err) {
      console.error('Error:', err)
      alert('Error generating detailed sales report')
    } finally {
      setLoading(false)
    }
  }

  const renderSalesReport = () => (
    <div className="space-y-6">
      {reportData.map((order: any, index: number) => (
        <div key={index} className="bg-white p-8 rounded-3xl border border-gray-200 hover:shadow-lg transition-all duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Customer</p>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold">
                    {(order.customers?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{order.customers?.name}</p>
                  <p className="text-sm text-gray-600">{order.customers?.email}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Salesman</p>
              <p className="text-lg font-bold text-gray-900">
                {order.profiles?.first_name} {order.profiles?.last_name}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Amount</p>
              <p className="text-2xl font-bold text-green-600 flex items-center">
                <IndianRupee className="w-5 h-5 mr-1" />
                {order.total_amount.toLocaleString('en-IN')}
              </p>
              <p className={`text-sm font-medium px-3 py-1 rounded-full inline-block ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                {order.status}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Date</p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(order.created_at).toLocaleDateString('en-IN')}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(order.created_at).toLocaleTimeString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderPaymentsReport = () => (
    <div className="space-y-6">
      {reportData.map((payment: any, index: number) => (
        <div key={index} className="bg-white p-8 rounded-3xl border border-gray-200 hover:shadow-lg transition-all duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Customer</p>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold">
                    {(payment.customers?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{payment.customers?.name}</p>
                  <p className="text-sm text-gray-600">{payment.customers?.email}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Payment Method</p>
              <p className="text-lg font-bold text-gray-900">{payment.payment_method}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Amount</p>
              <p className="text-2xl font-bold text-green-600 flex items-center">
                <IndianRupee className="w-5 h-5 mr-1" />
                {payment.amount.toLocaleString('en-IN')}
              </p>
              <p className={`text-sm font-medium px-3 py-1 rounded-full inline-block ${payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                {payment.status}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Date</p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(payment.created_at).toLocaleDateString('en-IN')}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(payment.created_at).toLocaleTimeString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderInventoryReport = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reportData.map((product: any, index: number) => (
        <div key={index} className="bg-white p-8 rounded-3xl border border-gray-200 hover:shadow-lg transition-all duration-300">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.description}</p>
              </div>
              {product.stock_quantity < 10 && (
                <div className="px-3 py-1 bg-red-100 rounded-full">
                  <p className="text-xs font-bold text-red-700">LOW STOCK</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Stock</p>
                <p className={`text-2xl font-bold ${product.stock_quantity < 10 ? 'text-red-600' : 'text-green-600'}`}>
                  {product.stock_quantity}
                </p>
                <p className="text-sm text-gray-500 font-medium">{product.unit}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Price</p>
                <p className="text-2xl font-bold text-gray-900 flex items-center">
                  <IndianRupee className="w-5 h-5 mr-1" />
                  {product.price}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const currentReportType = reportTypes.find(t => t.id === activeReport)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Reports</h1>
        <p className="text-lg text-gray-600 font-medium">Generate detailed reports for business analysis</p>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportTypes.map((type) => {
          const Icon = type.icon
          const isActive = activeReport === type.id
          return (
            <button
              key={type.id}
              onClick={() => setActiveReport(type.id)}
              className={`p-8 rounded-3xl border-2 transition-all duration-300 text-left ${isActive
                ? `border-${type.color}-500 bg-gradient-to-br ${type.color === 'blue' ? 'from-blue-50 to-indigo-50' :
                  type.color === 'green' ? 'from-green-50 to-emerald-50' :
                    'from-purple-50 to-violet-50'
                } shadow-lg`
                : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-4 rounded-2xl ${isActive
                  ? `bg-gradient-to-br ${type.color === 'blue' ? 'from-blue-500 to-indigo-500' :
                    type.color === 'green' ? 'from-green-500 to-emerald-500' :
                      'from-purple-500 to-violet-500'
                  }`
                  : 'bg-gray-100'
                  }`}>
                  <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-400'
                    }`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 ${isActive ? `text-${type.color}-900` : 'text-gray-900'
                    }`}>
                    {type.name}
                  </h3>
                  <p className={`text-sm ${isActive ? `text-${type.color}-700` : 'text-gray-600'
                    }`}>
                    {type.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      {activeReport !== 'inventory' && (
        <div className="bg-white rounded-3xl p-8 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gray-100 rounded-2xl">
                <Filter className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                <p className="text-gray-600">
                  Refine your report data
                  {activeReport === 'sales' && (
                    <span className="block text-sm text-blue-600 font-medium mt-1">
                      💡 Use date filters and click "Export Detailed Sales" for line-item level Excel report
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchReportData}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-colors flex items-center space-x-2 font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={applyFilters}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg"
              >
                Apply Filters
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            {activeReport === 'sales' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Salesman ID</label>
                <input
                  type="text"
                  value={filters.salesmanId}
                  onChange={(e) => handleFilterChange('salesmanId', e.target.value)}
                  placeholder="Enter salesman ID"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            )}
            {activeReport === 'payments' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Customer ID</label>
                <input
                  type="text"
                  value={filters.customerId}
                  onChange={(e) => handleFilterChange('customerId', e.target.value)}
                  placeholder="Enter customer ID"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {currentReportType?.name} Data
          </h2>
          <p className="text-gray-600 mt-1">{currentReportType?.description}</p>
        </div>
        <div className="flex space-x-3">

          {activeReport === 'sales' && (
            <button
              onClick={exportDetailedSalesReport}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center space-x-2 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>Export Detailed Sales</span>
            </button>
          )}
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-gray-50 rounded-3xl p-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-6 text-lg text-gray-600 font-medium">Loading report data...</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600">No data found for the selected report and filters</p>
          </div>
        ) : (
          <>
            {activeReport === 'sales' && renderSalesReport()}
            {activeReport === 'payments' && renderPaymentsReport()}
            {activeReport === 'inventory' && renderInventoryReport()}
          </>
        )}
      </div>
    </div>
  )
}