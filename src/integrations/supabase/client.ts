import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Dashboard data helpers
export const getRecentOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers(name, email),
      profiles(first_name, last_name)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  return { data, error }
}

export const getCustomersWithDues = async () => {
  const { data, error } = await supabase
    .rpc('get_customers_with_due_amounts')

  return { data, error }
}

export const getLowStockItems = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .lt('stock_quantity', 10)
    .order('stock_quantity', { ascending: true })

  return { data, error }
}

export const getRecentMarketVisits = async () => {
  const { data, error } = await supabase
    .from('market_visits')
    .select(`
      *,
      profiles(first_name, last_name),
      customers(name)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  return { data, error }
}

// Reports helpers
export const getSalesReport = async (filters: {
  startDate?: string
  endDate?: string
  salesmanId?: string
}) => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items(*),
      customers(name, email, phone),
      profiles(first_name, last_name)
    `)

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate)
  }
  if (filters.salesmanId) {
    query = query.eq('salesman_id', filters.salesmanId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  return { data, error }
}

export const getPaymentsReport = async (filters: {
  startDate?: string
  endDate?: string
  customerId?: string
}) => {
  let query = supabase
    .from('payments')
    .select(`
      *,
      customers(name, email)
    `)

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate)
  }
  if (filters.customerId) {
    query = query.eq('customer_id', filters.customerId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  return { data, error }
}

export const getInventoryReport = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      inventory_logs(*)
    `)
    .order('name', { ascending: true })

  return { data, error }
}

// Detailed Sales Report using SQL function
export const getDetailedSalesReport = async (startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .rpc('generate_detailed_sales_report', {
      p_start_date: startDate,
      p_end_date: endDate
    })

  return { data, error }
}