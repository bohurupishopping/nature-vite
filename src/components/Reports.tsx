import { useState, useEffect } from 'react'
import {
  FileSpreadsheet,
  Calendar,
  Download,
  Target,
  TrendingUp,
  Users,
  MapPin,
  History,
  DollarSign
} from 'lucide-react'
import {
  getDetailedSalesReport,
  getTargetPeriods,
  getSalesVsTargetAchievement,
  getSalesmanPerformanceVsTarget,
  getProductPerformanceVsTarget,
  getCustomerPerformanceVsTarget,
  getDistrictPerformanceVsTarget,
  getSalesTrendDaily,
  getSalesTrendWeekly,
  getSalesTrendMonthly,
  getTopCustomers,
  getCustomerDuesAndBalances,
  getNewVsExistingCustomerSales,
  getCustomers,
  getCustomerPurchaseHistory
} from '../integrations/supabase/client'
import {
  exportDetailedSalesReportToExcel,
  exportComprehensiveSalesReport,
  exportCustomerPurchaseHistoryReport
} from '../utils/excelExport'

interface TargetPeriod {
  id: string
  name: string
  start_date: string
  end_date: string
}

interface Customer {
  id: string
  name: string
}

export default function Reports() {
  const [loading, setLoading] = useState(false)
  const [targetPeriods, setTargetPeriods] = useState<TargetPeriod[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    targetPeriodId: '',
    customerId: '',
    topCustomersLimit: 20
  })

  useEffect(() => {
    loadTargetPeriods()
    loadCustomers()
  }, [])

  const loadTargetPeriods = async () => {
    try {
      const { data, error } = await getTargetPeriods()
      if (error) {
        console.error('Error loading target periods:', error)
        return
      }
      setTargetPeriods(data || [])
    } catch (err) {
      console.error('Error loading target periods:', err)
    }
  }

  const loadCustomers = async () => {
    try {
      const { data, error } = await getCustomers()
      if (error) {
        console.error('Error loading customers:', error)
        return
      }
      setCustomers(data || [])
    } catch (err) {
      console.error('Error loading customers:', err)
    }
  }

  const handleFilterChange = (field: string, value: string | number) => {
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

  const exportComprehensiveReport = async () => {
    if (!filters.targetPeriodId) {
      alert('Please select a target period for comprehensive report')
      return
    }

    setLoading(true)
    try {
      const selectedPeriod = targetPeriods.find(p => p.id === filters.targetPeriodId)
      if (!selectedPeriod) {
        alert('Selected target period not found')
        return
      }

      // Fetch all report data in parallel
      const [
        salesVsTargetResult,
        salesmanPerformanceResult,
        productPerformanceResult,
        customerPerformanceResult,
        districtPerformanceResult,
        salesTrendDailyResult,
        salesTrendWeeklyResult,
        salesTrendMonthlyResult,
        topCustomersResult,
        customerDuesResult,
        newVsExistingResult
      ] = await Promise.all([
        getSalesVsTargetAchievement(filters.targetPeriodId),
        getSalesmanPerformanceVsTarget(filters.targetPeriodId),
        getProductPerformanceVsTarget(filters.targetPeriodId),
        getCustomerPerformanceVsTarget(filters.targetPeriodId),
        getDistrictPerformanceVsTarget(filters.targetPeriodId),
        getSalesTrendDaily(selectedPeriod.start_date, selectedPeriod.end_date),
        getSalesTrendWeekly(selectedPeriod.start_date, selectedPeriod.end_date),
        getSalesTrendMonthly(selectedPeriod.start_date, selectedPeriod.end_date),
        getTopCustomers(selectedPeriod.start_date, selectedPeriod.end_date, filters.topCustomersLimit),
        getCustomerDuesAndBalances(),
        getNewVsExistingCustomerSales(selectedPeriod.start_date, selectedPeriod.end_date)
      ])

      // Check for errors
      const errors = [
        salesVsTargetResult.error,
        salesmanPerformanceResult.error,
        productPerformanceResult.error,
        customerPerformanceResult.error,
        districtPerformanceResult.error,
        salesTrendDailyResult.error,
        salesTrendWeeklyResult.error,
        salesTrendMonthlyResult.error,
        topCustomersResult.error,
        customerDuesResult.error,
        newVsExistingResult.error
      ].filter(Boolean)

      if (errors.length > 0) {
        console.error('Errors fetching report data:', errors)
        alert('Some report data could not be fetched. Check console for details.')
      }

      // Prepare report data
      const reportData = {
        salesVsTarget: salesVsTargetResult.data || [],
        salesmanPerformance: salesmanPerformanceResult.data || [],
        productPerformance: productPerformanceResult.data || [],
        customerPerformance: customerPerformanceResult.data || [],
        districtPerformance: districtPerformanceResult.data || [],
        salesTrendDaily: salesTrendDailyResult.data || [],
        salesTrendWeekly: salesTrendWeeklyResult.data || [],
        salesTrendMonthly: salesTrendMonthlyResult.data || [],
        topCustomers: topCustomersResult.data || [],
        customerDues: customerDuesResult.data || [],
        newVsExisting: newVsExistingResult.data || []
      }

      exportComprehensiveSalesReport(
        reportData,
        selectedPeriod.name,
        { startDate: selectedPeriod.start_date, endDate: selectedPeriod.end_date }
      )
    } catch (err) {
      console.error('Error generating comprehensive report:', err)
      alert('Error generating comprehensive report')
    } finally {
      setLoading(false)
    }
  }

  const exportCustomerPurchaseHistory = async () => {
    if (!filters.customerId) {
      alert('Please select a customer for purchase history report')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await getCustomerPurchaseHistory(filters.customerId)

      if (error) {
        console.error('Error fetching customer purchase history:', error)
        alert('Error fetching customer purchase history')
        return
      }

      if (!data || data.length === 0) {
        alert('No purchase history found for the selected customer')
        return
      }

      const selectedCustomer = customers.find(c => c.id === filters.customerId)
      exportCustomerPurchaseHistoryReport(data, selectedCustomer?.name || 'Unknown Customer')
    } catch (err) {
      console.error('Error:', err)
      alert('Error generating customer purchase history report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sales Reports & Analytics</h1>
        <p className="text-gray-600">Comprehensive sales reporting with target analysis, trends, and customer insights</p>
      </div>

      {/* Comprehensive Sales Report */}
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Comprehensive Sales Analysis</h2>
            <p className="text-sm text-gray-600 mt-1">Complete sales vs target analysis with multiple performance metrics</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-4 h-4 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">Select Target Period</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Target Period</label>
              <select
                value={filters.targetPeriodId}
                onChange={(e) => handleFilterChange('targetPeriodId', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="">Select a target period</option>
                {targetPeriods.map(period => (
                  <option key={period.id} value={period.id}>
                    {period.name} ({new Date(period.start_date).toLocaleDateString('en-IN')} - {new Date(period.end_date).toLocaleDateString('en-IN')})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Top Customers Limit</label>
              <input
                type="number"
                value={filters.topCustomersLimit}
                onChange={(e) => handleFilterChange('topCustomersLimit', parseInt(e.target.value) || 20)}
                min="5"
                max="100"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <button
            onClick={exportComprehensiveReport}
            disabled={loading || !filters.targetPeriodId}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Generating Report...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Comprehensive Report</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-purple-500" />
            <span className="text-gray-700">Sales vs Target Analysis</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="text-gray-700">Salesman Performance</span>
          </div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-purple-500" />
            <span className="text-gray-700">Product Performance</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="text-gray-700">Customer Performance</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-purple-500" />
            <span className="text-gray-700">District Performance</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-gray-700">Sales Trends (Daily/Weekly/Monthly)</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="text-gray-700">Top Customers</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-purple-500" />
            <span className="text-gray-700">Customer Dues</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="text-gray-700">New vs Existing Customers</span>
          </div>
        </div>
      </div>

      {/* Detailed Sales Report */}
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
      </div>

      {/* Customer Purchase History Report */}
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
            <History className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Customer Purchase History</h2>
            <p className="text-sm text-gray-600 mt-1">Export detailed purchase history for a specific customer</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-4 h-4 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">Select Customer</h3>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <select
              value={filters.customerId}
              onChange={(e) => handleFilterChange('customerId', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            >
              <option value="">Select a customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={exportCustomerPurchaseHistory}
            disabled={loading || !filters.customerId}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center space-x-2 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Generating Report...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Purchase History</span>
              </>
            )}
          </button>
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
              <li>• Multiple worksheets with organized data tabs</li>
              <li>• Properly formatted columns with Indian Rupee symbols</li>
              <li>• Auto-sized columns for better readability</li>
              <li>• Achievement percentages and variance calculations</li>
              <li>• Summary statistics and trend analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}