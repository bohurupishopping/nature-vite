import { useState } from 'react'
import {
  FileSpreadsheet,
  Calendar,
  Download
} from 'lucide-react'
import {
  getDetailedSalesReport
} from '../integrations/supabase/client'
import {
  exportDetailedSalesReportToExcel
} from '../utils/excelExport'

export default function Reports() {
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  })

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const exportDetailedSalesReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      alert('Please select both start and end dates for detailed sales report')
      return
    }

    if (new Date(filters.startDate) > new Date(filters.endDate)) {
      alert('Start date cannot be later than end date')
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sales Report Export</h1>
        <p className="text-gray-600">Export detailed sales reports with line-item data in Excel format</p>
      </div>

      {/* Export Card */}
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Detailed Sales Report</h2>
            <p className="text-sm text-gray-600 mt-1">Export comprehensive sales data with order details, customer info, and product line items</p>
          </div>
        </div>

        {/* Date Filters */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-4 h-4 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">Select Date Range</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-center">
          <button
            onClick={exportDetailedSalesReport}
            disabled={loading || !filters.startDate || !filters.endDate}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center space-x-2 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Generating Report...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Detailed Sales Report</span>
              </>
            )}
          </button>
        </div>

        {/* Report Features */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Report Includes:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Order numbers and dates</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Customer information</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Salesman details</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Product line items</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Quantities and pricing</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Summary statistics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-blue-900 mb-2">Excel Export Features</h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• Two worksheets: Detailed data and Summary statistics</li>
              <li>• Properly formatted columns with Indian Rupee symbols</li>
              <li>• Auto-sized columns for better readability</li>
              <li>• Top products analysis and order status breakdown</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}