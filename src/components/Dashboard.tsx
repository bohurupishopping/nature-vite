import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Users, 
  IndianRupee, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  MapPin,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { 
  getRecentOrders, 
  getCustomersWithDues, 
  getLowStockItems, 
  getRecentMarketVisits 
} from '../integrations/supabase/client'

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    recentOrders: [],
    customerDues: [],
    lowStockItems: [],
    marketVisits: [],
    loading: true
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [orders, dues, stock, visits] = await Promise.all([
          getRecentOrders(),
          getCustomersWithDues(),
          getLowStockItems(),
          getRecentMarketVisits()
        ])

        setDashboardData({
          recentOrders: orders.data || [],
          customerDues: dues.data || [],
          lowStockItems: stock.data || [],
          marketVisits: visits.data || [],
          loading: false
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setDashboardData(prev => ({ ...prev, loading: false }))
      }
    }

    fetchDashboardData()
  }, [])

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, color = 'blue' }: any) => (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
            {trend && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 font-medium">{subtitle}</p>}
        </div>
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${
          color === 'blue' ? 'from-blue-500 to-blue-600' :
          color === 'amber' ? 'from-amber-500 to-amber-600' :
          color === 'red' ? 'from-red-500 to-red-600' :
          'from-green-500 to-green-600'
        }`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )

  if (dashboardData.loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-2xl w-1/3 mb-2"></div>
          <div className="h-5 bg-gray-200 rounded-xl w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-40 rounded-3xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const totalRevenue = dashboardData.recentOrders.reduce((sum: number, order: any) => sum + order.total_amount, 0)
  const totalDues = dashboardData.customerDues.reduce((sum: number, due: any) => sum + due.total_due, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Dashboard</h1>
        <p className="text-lg text-gray-600 font-medium">Monitor your business performance at a glance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={BarChart3}
          title="Recent Orders"
          value={dashboardData.recentOrders.length}
          subtitle="Last 10 orders"
          trend={12}
          color="blue"
        />
        <StatCard
          icon={IndianRupee}
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          subtitle="From recent orders"
          trend={8}
          color="green"
        />
        <StatCard
          icon={Users}
          title="Pending Dues"
          value={`₹${totalDues.toLocaleString('en-IN')}`}
          subtitle={`${dashboardData.customerDues.length} customers`}
          trend={-5}
          color="amber"
        />
        <StatCard
          icon={Package}
          title="Low Stock"
          value={dashboardData.lowStockItems.length}
          subtitle="Items need restocking"
          color="red"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
              <p className="text-gray-600 mt-1">Latest customer transactions</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-2xl">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="space-y-4">
            {dashboardData.recentOrders.slice(0, 5).map((order: any, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {(order.customers?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {order.customers?.name || 'Unknown Customer'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.profiles?.first_name} {order.profiles?.last_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 flex items-center">
                    <IndianRupee className="w-4 h-4 mr-1" />
                    {order.total_amount.toLocaleString('en-IN')}
                  </p>
                  <p className={`text-sm font-medium px-2 py-1 rounded-full ${
                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Dues */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Customer Dues</h2>
              <p className="text-gray-600 mt-1">Outstanding payments</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-2xl">
              <IndianRupee className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="space-y-4">
            {dashboardData.customerDues.slice(0, 5).map((due: any, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {due.customer_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{due.customer_name}</p>
                    <p className="text-sm text-amber-600 font-medium">Outstanding Balance</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-700 flex items-center">
                    <IndianRupee className="w-4 h-4 mr-1" />
                    {due.total_due.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {dashboardData.lowStockItems.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-3xl p-8">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-red-100 rounded-2xl mr-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-red-900">Low Stock Alert</h2>
              <p className="text-red-700 mt-1">Items requiring immediate attention</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.lowStockItems.map((item: any, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl border border-red-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                  <div className="px-2 py-1 bg-red-100 rounded-full">
                    <span className="text-xs font-bold text-red-700">LOW</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Stock</p>
                    <p className="font-bold text-red-600">{item.stock_quantity} {item.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Price</p>
                    <p className="font-bold text-gray-900 flex items-center">
                      <IndianRupee className="w-4 h-4 mr-1" />
                      {item.price}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Market Visits */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Recent Market Visits</h2>
            <p className="text-gray-600 mt-1">Latest field activities</p>
          </div>
          <div className="p-3 bg-green-100 rounded-2xl">
            <MapPin className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dashboardData.marketVisits.slice(0, 6).map((visit: any, index) => (
            <div key={index} className="p-6 bg-green-50 rounded-2xl border border-green-200 hover:bg-green-100 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{visit.customers?.name}</p>
                    <p className="text-sm text-green-600 font-medium">
                      {new Date(visit.visit_date).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Salesman:</span> {visit.profiles?.first_name} {visit.profiles?.last_name}
              </p>
              {visit.notes && (
                <p className="text-sm text-gray-500 italic bg-white p-3 rounded-xl">
                  "{visit.notes}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}